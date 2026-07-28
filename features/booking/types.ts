import { formatCrc } from "@/utils/date";

export type BookingService = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  includes: string[];
  priceCrc: number;
  durationMinutes: number;
};

export type BookingBarber = {
  id: string;
  name: string;
  slug: string;
};

export type WizardStep =
  | "service"
  | "date"
  | "time"
  | "details"
  | "confirm";

export const WIZARD_STEPS: WizardStep[] = [
  "service",
  "date",
  "time",
  "details",
  "confirm",
];

export const STEP_LABELS: Record<WizardStep, string> = {
  service: "Servicio",
  date: "Fecha",
  time: "Hora",
  details: "Datos",
  confirm: "Confirmar",
};

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function formatServicePrice(priceCrc: number): string {
  return formatCrc(priceCrc);
}
