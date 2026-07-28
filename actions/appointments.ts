"use server";

import { headers } from "next/headers";
import { availabilityQuerySchema, createAppointmentSchema } from "@/schemas/booking";
import {
  createAppointment,
  getDefaultBarber,
  listActiveServices,
} from "@/services/appointment.service";
import { getAvailableSlots, getBookableDates } from "@/services/availability.service";
import { sendAppointmentConfirmation } from "@/services/whatsapp.service";
import { rateLimit } from "@/lib/rate-limit";
import type { ActionResult } from "@/types/booking";
import type { TimeSlot } from "@/types/booking";

async function clientKey(prefix: string) {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  return `${prefix}:${ip}`;
}

export async function getBookingBootstrapAction(): Promise<
  ActionResult<{
    services: Awaited<ReturnType<typeof listActiveServices>>;
    barber: NonNullable<Awaited<ReturnType<typeof getDefaultBarber>>>;
  }>
> {
  try {
    const [services, barber] = await Promise.all([
      listActiveServices(),
      getDefaultBarber(),
    ]);

    if (!barber) {
      return { success: false, error: "No hay barberos disponibles" };
    }

    return { success: true, data: { services, barber } };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudo cargar la reserva" };
  }
}

export async function getAvailabilityAction(input: {
  serviceId: string;
  barberId: string;
  date: string;
}): Promise<ActionResult<TimeSlot[]>> {
  const parsed = availabilityQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Datos de disponibilidad inválidos" };
  }

  const limited = rateLimit(await clientKey("availability"), 60, 60_000);
  if (!limited.success) {
    return { success: false, error: "Demasiadas consultas. Espera un momento." };
  }

  try {
    const slots = await getAvailableSlots(parsed.data);
    return { success: true, data: slots };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cargar horarios",
    };
  }
}

export async function getBookableDatesAction(input: {
  serviceId: string;
  barberId: string;
}): Promise<ActionResult<string[]>> {
  const limited = rateLimit(await clientKey("bookable-dates"), 30, 60_000);
  if (!limited.success) {
    return { success: false, error: "Demasiadas consultas. Espera un momento." };
  }

  try {
    const dates = await getBookableDates({
      ...input,
      daysAhead: 21,
    });
    return { success: true, data: dates };
  } catch (error) {
    console.error(error);
    return { success: false, error: "No se pudieron cargar las fechas" };
  }
}

export async function createBookingAction(
  input: unknown,
): Promise<
  ActionResult<{
    id: string;
    customerName: string;
    startAt: string;
    endAt: string;
    serviceName: string;
    barberName: string;
    priceCrc: number;
    durationMinutes: number;
  }>
> {
  const limited = rateLimit(await clientKey("create-booking"), 8, 60_000);
  if (!limited.success) {
    return { success: false, error: "Demasiados intentos. Espera un minuto." };
  }

  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { success: false, error: first };
  }

  try {
    const appointment = await createAppointment({
      serviceId: parsed.data.serviceId,
      barberId: parsed.data.barberId,
      startAt: new Date(parsed.data.startAt),
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone, // 8 digits → normalized to +506 in service
      source: "WEB",
    });

    // Barbería → cliente (automático). No bloquea la reserva si WhatsApp falla.
    try {
      await sendAppointmentConfirmation(appointment.id);
    } catch (whatsappError) {
      console.error("WhatsApp confirmation failed:", whatsappError);
    }

    return {
      success: true,
      data: {
        id: appointment.id,
        customerName: appointment.customerName,
        startAt: appointment.startAt.toISOString(),
        endAt: appointment.endAt.toISOString(),
        serviceName: appointment.service.name,
        barberName: appointment.barber.name,
        priceCrc: appointment.service.priceCrc,
        durationMinutes: appointment.service.durationMinutes,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo crear la cita. Intenta de nuevo.",
    };
  }
}
