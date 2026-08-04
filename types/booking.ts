export type BookingStep =
  | "service"
  | "date"
  | "time"
  | "details"
  | "confirm"
  | "success";

export type TimeSlot = {
  startAt: string; // ISO
  endAt: string; // ISO
  label: string; // e.g. "09:00"
  barberId?: string;
  barberName?: string;
};

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
