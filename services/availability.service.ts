import { addDays, format, startOfDay } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { BOOKING_RULES, BUSINESS } from "@/lib/constants";
import { computeEndAt } from "@/utils/date";
import { buildAvailableSlotsForDay } from "@/services/availability-slots";
import type { TimeSlot } from "@/types/booking";

const TIMEZONE = BUSINESS.timezone;
/** Solo estas bloquean el calendario. CANCELLED / COMPLETED / NO_SHOW liberan la hora. */
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"] as const;

function dateYmdInTz(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd");
}

/** ISO day 1=Mon … 7=Sun → JS 0=Sun … 6=Sat */
function isoToJsDay(isoDay: string | number): number {
  const n = Number(isoDay);
  return n === 7 ? 0 : n;
}

function getJsDayOfWeek(dateYmd: string): number {
  const noon = fromZonedTime(`${dateYmd}T12:00:00`, TIMEZONE);
  return isoToJsDay(formatInTimeZone(noon, TIMEZONE, "i"));
}

function zonedStart(dateYmd: string, timeHm: string): Date {
  return fromZonedTime(`${dateYmd}T${timeHm}:00`, TIMEZONE);
}

function dayBounds(dateYmd: string): { dayStart: Date; dayEnd: Date } {
  return {
    dayStart: zonedStart(dateYmd, "00:00"),
    dayEnd: zonedStart(dateYmd, "23:59"),
  };
}

export async function getAvailableSlots(input: {
  barberId: string;
  serviceId: string;
  date: string;
}): Promise<TimeSlot[]> {
  const { barberId, serviceId, date: dateYmd } = input;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) {
    throw new Error("Fecha inválida");
  }

  const [settings, service, barber] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "default" } }),
    prisma.service.findFirst({
      where: { id: serviceId, isActive: true },
    }),
    prisma.barber.findFirst({
      where: { id: barberId, isActive: true },
    }),
  ]);

  if (!service) throw new Error("Servicio no disponible");
  if (!barber) throw new Error("Barbero no disponible");

  const bufferMinutes = settings?.bufferMinutes ?? BOOKING_RULES.bufferMinutes;
  const slotInterval =
    settings?.slotIntervalMinutes ?? BOOKING_RULES.slotIntervalMinutes;
  const maxAdvanceDays = settings?.maxAdvanceDays ?? 60;
  const bookingLeadMinutes = settings?.bookingLeadMinutes ?? 0;

  const now = new Date();
  const todayYmd = dateYmdInTz(now);
  const maxYmd = dateYmdInTz(addDays(toZonedTime(now, TIMEZONE), maxAdvanceDays));

  if (dateYmd < todayYmd) {
    return [];
  }
  if (dateYmd > maxYmd) {
    return [];
  }

  const jsDay = getJsDayOfWeek(dateYmd);

  const [hours, blockedDate, appointments, blockedHours] = await Promise.all([
    prisma.businessHours.findMany({
      where: { barberId, dayOfWeek: jsDay, isClosed: false },
      orderBy: { openTime: "asc" },
    }),
    prisma.blockedDate.findFirst({
      where: {
        date: new Date(`${dateYmd}T00:00:00.000Z`),
        OR: [{ barberId }, { barberId: null }],
      },
    }),
    prisma.appointment.findMany({
      where: {
        barberId,
        status: { in: [...ACTIVE_STATUSES] },
        startAt: {
          gte: dayBounds(dateYmd).dayStart,
          lte: dayBounds(dateYmd).dayEnd,
        },
      },
      select: { startAt: true, endAt: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.blockedHour.findMany({
      where: {
        OR: [{ barberId }, { barberId: null }],
        startAt: { lt: dayBounds(dateYmd).dayEnd },
        endAt: { gt: dayBounds(dateYmd).dayStart },
      },
      select: { startAt: true, endAt: true },
    }),
  ]);

  if (blockedDate || hours.length === 0) {
    return [];
  }

  const earliestAllowed = new Date(now.getTime() + bookingLeadMinutes * 60_000);

  return buildAvailableSlotsForDay({
    dateYmd,
    durationMinutes: service.durationMinutes,
    hours,
    appointments,
    blockedHours,
    bufferMinutes,
    slotIntervalMinutes: slotInterval,
    earliestAllowed,
  });
}

export async function getAvailableSlotsForBarbers(input: {
  barbers: Array<{ id: string; name: string }>;
  serviceId: string;
  date: string;
}): Promise<TimeSlot[]> {
  const results = await Promise.all(
    input.barbers.map(async (barber) => {
      const slots = await getAvailableSlots({
        barberId: barber.id,
        serviceId: input.serviceId,
        date: input.date,
      });
      return slots.map((slot) => ({
        ...slot,
        barberId: barber.id,
        barberName: barber.name.split(" ")[0] ?? barber.name,
      }));
    }),
  );

  return results
    .flat()
    .sort(
      (a, b) =>
        a.startAt.localeCompare(b.startAt) ||
        (a.barberName ?? "").localeCompare(b.barberName ?? ""),
    );
}

export async function getBookableDatesForBarbers(input: {
  barbers: Array<{ id: string }>;
  serviceId: string;
  daysAhead?: number;
}): Promise<string[]> {
  if (input.barbers.length === 0) return [];

  const dateLists = await Promise.all(
    input.barbers.map((barber) =>
      getBookableDates({
        barberId: barber.id,
        serviceId: input.serviceId,
        daysAhead: input.daysAhead,
      }),
    ),
  );

  return [...new Set(dateLists.flat())].sort();
}

export async function getBookableDates(input: {
  barberId: string;
  serviceId: string;
  daysAhead?: number;
}): Promise<string[]> {
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  const maxDays = Math.min(
    input.daysAhead ?? settings?.maxAdvanceDays ?? 60,
    settings?.maxAdvanceDays ?? 60,
  );

  const now = toZonedTime(new Date(), TIMEZONE);
  const todayYmd = format(startOfDay(now), "yyyy-MM-dd");
  const rangeEndYmd = format(addDays(startOfDay(now), maxDays), "yyyy-MM-dd");

  const [hours, blockedDates] = await Promise.all([
    prisma.businessHours.findMany({
      where: { barberId: input.barberId, isClosed: false },
      select: { dayOfWeek: true },
    }),
    prisma.blockedDate.findMany({
      where: {
        OR: [{ barberId: input.barberId }, { barberId: null }],
        date: {
          gte: new Date(`${todayYmd}T00:00:00.000Z`),
          lte: new Date(`${rangeEndYmd}T00:00:00.000Z`),
        },
      },
      select: { date: true },
    }),
  ]);

  const openDays = new Set(hours.map((h) => h.dayOfWeek));
  const blocked = new Set(
    blockedDates.map((b) => formatInTimeZone(b.date, "UTC", "yyyy-MM-dd")),
  );

  const candidates: string[] = [];
  for (let i = 0; i <= maxDays; i++) {
    const d = addDays(startOfDay(now), i);
    const ymd = format(d, "yyyy-MM-dd");
    const jsDay = getJsDayOfWeek(ymd);
    if (!openDays.has(jsDay)) continue;
    if (blocked.has(ymd)) continue;
    candidates.push(ymd);
  }

  // Today can already be fully booked — verify slots. Future open days stay bookable.
  const dates: string[] = [];
  for (const ymd of candidates) {
    if (ymd === todayYmd) {
      const slots = await getAvailableSlots({
        barberId: input.barberId,
        serviceId: input.serviceId,
        date: ymd,
      });
      if (slots.length > 0) dates.push(ymd);
    } else {
      dates.push(ymd);
    }
  }

  return dates;
}

export async function assertSlotStillAvailable(params: {
  barberId: string;
  serviceId: string;
  startAt: Date;
  excludeAppointmentId?: string;
}): Promise<{ endAt: Date; serviceDuration: number }> {
  const service = await prisma.service.findFirst({
    where: { id: params.serviceId, isActive: true },
  });
  if (!service) throw new Error("Servicio no disponible");

  const dateYmd = formatInTimeZone(params.startAt, TIMEZONE, "yyyy-MM-dd");
  const slots = await getAvailableSlots({
    barberId: params.barberId,
    serviceId: params.serviceId,
    date: dateYmd,
  });

  const endAt = computeEndAt(params.startAt, service.durationMinutes);
  const startIso = params.startAt.toISOString();

  const match = slots.find((s) => s.startAt === startIso);
  if (!match) {
    // Fallback: re-check overlap directly (clock skew / ISO equality)
    const stillOk = slots.some((s) => {
      const sStart = new Date(s.startAt).getTime();
      return Math.abs(sStart - params.startAt.getTime()) < 1000;
    });
    if (!stillOk) {
      throw new Error("Ese horario ya no está disponible");
    }
  }

  if (params.excludeAppointmentId) {
    // When rescheduling, getAvailableSlots already excludes nothing —
    // caller should pass through a customized check in Phase 4.
  }

  return { endAt, serviceDuration: service.durationMinutes };
}
