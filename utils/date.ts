import { addMinutes, format, parse } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { BUSINESS } from "@/lib/constants";

export const TIMEZONE = BUSINESS.timezone;

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatCrc(amount: number): string {
  return `₡${amount.toLocaleString("es-CR")}`;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("506") && digits.length === 11) {
    return `+506 ${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

/** Normalize CR phone to E.164 (+506XXXXXXXX) */
export function normalizePhoneCR(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("506") && digits.length === 11) {
    return `+${digits}`;
  }
  if (digits.length === 8) {
    return `+506${digits}`;
  }
  if (input.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  throw new Error("Número de teléfono inválido");
}

export function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

export function computeEndAt(startAt: Date, durationMinutes: number): Date {
  return addMinutes(startAt, durationMinutes);
}

export function zonedDateTime(dateYmd: string, timeHm: string): Date {
  return fromZonedTime(`${dateYmd}T${timeHm}:00`, TIMEZONE);
}

export function formatInBusinessTz(
  date: Date,
  pattern: string = "dd/MM/yyyy HH:mm",
): string {
  return formatInTimeZone(date, TIMEZONE, pattern);
}

export function toBusinessZonedDate(date: Date): Date {
  return toZonedTime(date, TIMEZONE);
}

export function formatBusinessDateLabel(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "EEEE d 'de' MMMM yyyy");
}

export function parseHm(time: string): Date {
  return parse(time, "HH:mm", new Date());
}

export function formatHm(date: Date): string {
  return format(date, "HH:mm");
}
