"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getAdminDayStats,
  todayYmd,
  updateAppointmentStatus,
} from "@/services/admin-appointments.service";
import { sendAdminCustomerOutreach } from "@/services/whatsapp.service";
import { rateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "@/types/booking";

const COOKIE_NAME = "coeli_admin";
const COOKIE_VALUE = "authenticated";

function expectedPin() {
  return process.env.ADMIN_PIN?.trim() || "0000";
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value === COOKIE_VALUE;
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function adminLoginAction(
  pin: string,
): Promise<ActionResult<{ ok: true }>> {
  const limited = rateLimit("admin-login", 10, 60_000);
  if (!limited.success) {
    return { success: false, error: "Demasiados intentos. Espera un minuto." };
  }

  if (pin.trim() !== expectedPin()) {
    return { success: false, error: "PIN incorrecto" };
  }

  const jar = await cookies();
  jar.set(COOKIE_NAME, COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days — tablet stays logged in
  });

  return { success: true, data: { ok: true } };
}

export async function adminLogoutAction() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  redirect("/admin/login");
}

export async function getAdminDayAction(
  date?: string,
): Promise<
  ActionResult<Awaited<ReturnType<typeof getAdminDayStats>> & { date: string }>
> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, error: "No autorizado" };
  }

  const dateYmd = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayYmd();

  try {
    const stats = await getAdminDayStats(dateYmd);
    return { success: true, data: { ...stats, date: dateYmd } };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudieron cargar las citas" };
  }
}

export async function setAppointmentStatusAction(input: {
  id: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
}): Promise<ActionResult<{ id: string; status: string }>> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, error: "No autorizado" };
  }

  try {
    const updated = await updateAppointmentStatus(input.id, input.status);

    // Al cancelar (u otros cambios), refrescar panel y flujo público de reserva
    // para que el horario vuelva a aparecer disponible de inmediato.
    revalidatePath("/admin");
    revalidatePath("/reservar");

    return {
      success: true,
      data: { id: updated.id, status: updated.status },
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudo actualizar la cita" };
  }
}

export async function contactCustomerWhatsAppAction(input: {
  appointmentId: string;
  kind?: "reminder" | "waiting" | "confirm";
}): Promise<ActionResult<{ ok: true }>> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, error: "No autorizado" };
  }

  const limited = rateLimit(`admin-wa-${input.appointmentId}`, 8, 60_000);
  if (!limited.success) {
    return {
      success: false,
      error: "Esperá un momento antes de enviar otro mensaje.",
    };
  }

  try {
    const result = await sendAdminCustomerOutreach(
      input.appointmentId,
      input.kind ?? "reminder",
    );

    if (!result.ok) {
      return {
        success: false,
        error:
          result.error ??
          "No se pudo enviar. El cliente debe haber recibido un mensaje reciente de COELI.",
      };
    }

    return { success: true, data: { ok: true } };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudo enviar el WhatsApp" };
  }
}
