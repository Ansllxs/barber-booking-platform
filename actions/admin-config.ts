"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/actions/admin";
import {
  getAdminBusinessHours,
  listAdminServices,
  saveAdminBusinessHours,
  setServiceActive,
  upsertAdminService,
  type DayHoursInput,
} from "@/services/admin-config.service";
import type { ActionResult } from "@/types/booking";

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return false;
  }
  return true;
}

function revalidatePublic() {
  revalidatePath("/admin");
  revalidatePath("/admin/servicios");
  revalidatePath("/admin/horarios");
  revalidatePath("/reservar");
  revalidatePath("/");
}

export async function getAdminServicesAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof listAdminServices>>>
> {
  if (!(await guard())) return { success: false, error: "No autorizado" };
  try {
    const data = await listAdminServices();
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudieron cargar los servicios" };
  }
}

export async function saveAdminServiceAction(input: {
  id?: string;
  name: string;
  description?: string;
  includesText?: string;
  priceCrc: number;
  durationMinutes: number;
  isActive: boolean;
  sortOrder: number;
}): Promise<ActionResult<{ id: string }>> {
  if (!(await guard())) return { success: false, error: "No autorizado" };

  try {
    const includes = (input.includesText ?? "")
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);

    const saved = await upsertAdminService({
      id: input.id,
      name: input.name,
      description: input.description,
      includes,
      priceCrc: input.priceCrc,
      durationMinutes: input.durationMinutes,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    });

    revalidatePublic();
    return { success: true, data: { id: saved.id } };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo guardar",
    };
  }
}

export async function toggleServiceActiveAction(input: {
  id: string;
  isActive: boolean;
}): Promise<ActionResult<{ id: string }>> {
  if (!(await guard())) return { success: false, error: "No autorizado" };

  try {
    const saved = await setServiceActive(input.id, input.isActive);
    revalidatePublic();
    return { success: true, data: { id: saved.id } };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudo actualizar el servicio" };
  }
}

export async function getAdminHoursAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof getAdminBusinessHours>>>
> {
  if (!(await guard())) return { success: false, error: "No autorizado" };
  try {
    const data = await getAdminBusinessHours();
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudieron cargar los horarios" };
  }
}

export async function saveAdminHoursAction(
  days: DayHoursInput[],
): Promise<ActionResult<{ ok: true }>> {
  if (!(await guard())) return { success: false, error: "No autorizado" };

  try {
    await saveAdminBusinessHours(days);
    revalidatePublic();
    return { success: true, data: { ok: true } };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo guardar",
    };
  }
}
