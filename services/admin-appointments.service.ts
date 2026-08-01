import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { BUSINESS } from "@/lib/constants";

const TIMEZONE = BUSINESS.timezone;

function dayBounds(dateYmd: string) {
  return {
    dayStart: fromZonedTime(`${dateYmd}T00:00:00`, TIMEZONE),
    dayEnd: fromZonedTime(`${dateYmd}T23:59:59`, TIMEZONE),
  };
}

export function todayYmd(): string {
  return formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd");
}

export async function getAppointmentsForDate(dateYmd: string) {
  const { dayStart, dayEnd } = dayBounds(dateYmd);

  return prisma.appointment.findMany({
    where: {
      startAt: { gte: dayStart, lte: dayEnd },
      status: { not: "CANCELLED" },
    },
    include: {
      service: {
        select: {
          name: true,
          priceCrc: true,
          durationMinutes: true,
        },
      },
      barber: {
        select: { name: true },
      },
    },
    orderBy: { startAt: "asc" },
  });
}

export async function getAdminDayStats(dateYmd: string) {
  const appointments = await getAppointmentsForDate(dateYmd);
  const confirmed = appointments.filter((a) =>
    ["PENDING", "CONFIRMED"].includes(a.status),
  );
  const completed = appointments.filter((a) => a.status === "COMPLETED");
  const revenue = [...confirmed, ...completed].reduce(
    (sum, a) => sum + a.service.priceCrc,
    0,
  );

  return {
    total: appointments.length,
    upcoming: confirmed.length,
    completed: completed.length,
    revenueCrc: revenue,
    appointments,
  };
}

export async function updateAppointmentStatus(
  id: string,
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW",
) {
  return prisma.appointment.update({
    where: { id },
    data: {
      status,
      cancellationReason: status === "CANCELLED" ? "Cancelada desde el panel" : null,
    },
    include: {
      service: { select: { name: true, priceCrc: true, durationMinutes: true } },
      barber: { select: { name: true } },
    },
  });
}

export async function updateAppointmentNotes(id: string, notes: string | null) {
  const trimmed = notes?.trim() || null;
  return prisma.appointment.update({
    where: { id },
    data: { notes: trimmed },
    select: { id: true, notes: true },
  });
}
