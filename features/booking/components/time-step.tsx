"use client";

import type { TimeSlot } from "@/types/booking";
import { cn } from "@/lib/utils";

function toDisplayLabel(label: string): string {
  const [h, m] = label.split(":").map(Number);
  const suffix = h >= 12 ? "p.m." : "a.m.";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function TimeStep({
  slots,
  selectedStartAt,
  loading,
  onSelect,
}: {
  slots: TimeSlot[];
  selectedStartAt: string | null;
  loading: boolean;
  onSelect: (slot: TimeSlot) => void;
}) {
  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h2 className="font-display text-3xl text-silver-bright sm:text-4xl">
          Elige la hora
        </h2>
        <p className="text-sm text-muted">
          Última cita a las 7:00 p.m. Los horarios se actualizan según el
          servicio.
        </p>
      </header>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted">Cargando horas…</p>
      ) : slots.length === 0 ? (
        <p className="border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          No hay horas libres este día. Prueba otra fecha.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((slot) => {
            const selected = slot.startAt === selectedStartAt;
            return (
              <button
                key={slot.startAt}
                type="button"
                onClick={() => onSelect(slot)}
                className={cn(
                  "min-h-12 border px-2 py-3 text-sm transition",
                  selected
                    ? "border-silver bg-silver text-black"
                    : "border-border bg-surface text-foreground hover:border-silver/40",
                )}
              >
                {toDisplayLabel(slot.label)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
