import { isBefore } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { BOOKING_RULES, BUSINESS } from "@/lib/constants";
import {
  computeEndAt,
  minutesToTime,
  parseTimeToMinutes,
  rangesOverlap,
} from "@/utils/date";
import type { TimeSlot } from "@/types/booking";

const TIMEZONE = BUSINESS.timezone;
const NORMAL_CLOSE_MINUTES = parseTimeToMinutes(BOOKING_RULES.closeTime);
const LATEST_END_MINUTES = parseTimeToMinutes("20:15");

type Interval = { start: Date; end: Date };

function zonedStart(dateYmd: string, timeHm: string): Date {
  return fromZonedTime(`${dateYmd}T${timeHm}:00`, TIMEZONE);
}

function uniqueSortedMinutes(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function addMinutesSafe(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/**
 * Appointments must start during business hours. Only the final segment at
 * normal closing time allows appointments to run until 20:15.
 */
export function isStartAllowedInSegment(params: {
  startMinutes: number;
  durationMinutes: number;
  segmentOpen: number;
  segmentClose: number;
  isLastSegment: boolean;
}): boolean {
  const {
    startMinutes,
    durationMinutes,
    segmentOpen,
    segmentClose,
    isLastSegment,
  } = params;

  if (startMinutes < segmentOpen) return false;
  if (startMinutes >= segmentClose) return false;
  const latestEnd = isLastSegment && segmentClose === NORMAL_CLOSE_MINUTES
    ? LATEST_END_MINUTES
    : Math.min(segmentClose, LATEST_END_MINUTES);

  return startMinutes + durationMinutes <= latestEnd;
}

export function buildAvailableSlotsForDay(input: {
  dateYmd: string;
  durationMinutes: number;
  hours: Array<{ openTime: string; closeTime: string }>;
  appointments: Array<{ startAt: Date; endAt: Date }>;
  blockedHours: Array<{ startAt: Date; endAt: Date }>;
  bufferMinutes: number;
  slotIntervalMinutes: number;
  earliestAllowed: Date;
}): TimeSlot[] {
  const {
    dateYmd,
    durationMinutes,
    hours,
    appointments,
    blockedHours,
    bufferMinutes,
    slotIntervalMinutes,
    earliestAllowed,
  } = input;

  if (hours.length === 0) return [];

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
    for (let m = open; m < close; m += slotIntervalMinutes) {
      candidateMinutes.add(m);
    }
  }

  // Gap-fill: offer starts exactly when an appointment ends (e.g. 09:45 / 19:15)
  for (const appt of appointments) {
    const endLabel = formatInTimeZone(appt.endAt, TIMEZONE, "HH:mm");
    const endYmd = formatInTimeZone(appt.endAt, TIMEZONE, "yyyy-MM-dd");
    if (endYmd === dateYmd) {
      candidateMinutes.add(parseTimeToMinutes(endLabel));
    }
  }

  const segments = hours.map((h, index) => {
    const open = parseTimeToMinutes(h.openTime);
    const close = parseTimeToMinutes(h.closeTime);
    const isLastSegment = index === hours.length - 1;
    return { open, close, isLastSegment };
  });

  const slots: TimeSlot[] = [];

  for (const startMinutes of uniqueSortedMinutes([...candidateMinutes])) {
    const matchingSegment = segments.find(
      (s) => startMinutes >= s.open && startMinutes < s.close,
    );
    if (!matchingSegment) continue;

    const allowed = isStartAllowedInSegment({
      startMinutes,
      durationMinutes,
      segmentOpen: matchingSegment.open,
      segmentClose: matchingSegment.close,
      isLastSegment: matchingSegment.isLastSegment,
    });
    if (!allowed) continue;

    const timeHm = minutesToTime(startMinutes);
    const startAt = zonedStart(dateYmd, timeHm);
    const endAt = computeEndAt(startAt, durationMinutes);

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
