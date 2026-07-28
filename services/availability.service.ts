import { addDays, format, isBefore, startOfDay } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { BOOKING_RULES, BUSINESS } from "@/lib/constants";
import {
  computeEndAt,
  minutesToTime,
  parseTimeToMinutes,
  rangesOverlap,
} from "@/utils/date";
import type { TimeSlot } from "@/types/booking";

const TIMEZONE = BUSINESS.timezone;
/** Solo estas bloquean el calendario. CANCELLED / COMPLETED / NO_SHOW liberan la hora. */
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"] as const;

type Interval = { start: Date; end: Date };

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

function uniqueSortedMinutes(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

/**
 * Morning segments: appointment must fully finish before segment close (lunch).
 * Afternoon / last segment: may start until lastAppointmentStart; end may pass shop close.
 */
function isStartAllowedInSegment(params: {
  startMinutes: number;
  durationMinutes: number;
  segmentOpen: number;
  segmentClose: number;
  lastStartMinutes: number;
  allowEndPastClose: boolean;
}): boolean {
  const {
    startMinutes,
    durationMinutes,
    segmentOpen,
    segmentClose,
    lastStartMinutes,
    allowEndPastClose,
  } = params;

  if (startMinutes < segmentOpen) return false;
  if (startMinutes >= segmentClose) return false;
  if (startMinutes > lastStartMinutes) return false;

  const endMinutes = startMinutes + durationMinutes;

  if (allowEndPastClose) {
    return true;
  }

  return endMinutes <= segmentClose;
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
  const lastStartHm =
    settings?.lastAppointmentStartTime ?? BOOKING_RULES.lastAppointmentStartTime;
  const maxAdvanceDays = settings?.maxAdvanceDays ?? 60;
  const bookingLeadMinutes = settings?.bookingLeadMinutes ?? 0;
  const lastStartMinutes = parseTimeToMinutes(lastStartHm);

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

  const occupied: Interval[] = [
    ...appointments.map((a) => ({
      start: a.startAt,
      end: addMinutesSafe(a.endAt, bufferMinutes),
    })),
    ...blockedHours.map((b) => ({ start: b.startAt, end: b.endAt })),
  ];

  const candidateMinutes = new Set<number>();

  for (const segment of hours) {
    const open = parseTimeToMinutes(segment.openTime);
    const close = parseTimeToMinutes(segment.closeTime);
    for (let m = open; m < close; m += slotInterval) {
      candidateMinutes.add(m);
    }
  }

  // Gap-fill: offer starts exactly when an appointment ends (e.g. 09:45)
  for (const appt of appointments) {
    const endLabel = formatInTimeZone(appt.endAt, TIMEZONE, "HH:mm");
    const endYmd = formatInTimeZone(appt.endAt, TIMEZONE, "yyyy-MM-dd");
    if (endYmd === dateYmd) {
      candidateMinutes.add(parseTimeToMinutes(endLabel));
    }
  }

  const earliestAllowed = addMinutesSafe(now, bookingLeadMinutes);
  const segments = hours.map((h, index) => {
    const open = parseTimeToMinutes(h.openTime);
    const close = parseTimeToMinutes(h.closeTime);
    const isLastSegment = index === hours.length - 1;
    return { open, close, allowEndPastClose: isLastSegment };
  });

  const slots: TimeSlot[] = [];

  for (const startMinutes of uniqueSortedMinutes([...candidateMinutes])) {
    const matchingSegment = segments.find(
      (s) => startMinutes >= s.open && startMinutes < s.close,
    );
    if (!matchingSegment) continue;

    const allowed = isStartAllowedInSegment({
      startMinutes,
      durationMinutes: service.durationMinutes,
      segmentOpen: matchingSegment.open,
      segmentClose: matchingSegment.close,
      lastStartMinutes,
      allowEndPastClose: matchingSegment.allowEndPastClose,
    });
    if (!allowed) continue;

    const timeHm = minutesToTime(startMinutes);
    const startAt = zonedStart(dateYmd, timeHm);
    const endAt = computeEndAt(startAt, service.durationMinutes);

    if (isBefore(startAt, earliestAllowed)) continue;

    const conflicts = occupied.some((block) =>
      rangesOverlap(startAt, endAt, block.start, block.end),
    );
    if (conflicts) continue;

    slots.push({
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      label: timeHm,
    });
  }

  return slots;
}

function addMinutesSafe(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
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
