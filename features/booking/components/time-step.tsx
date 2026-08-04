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
  selectedBarberId,
  loading,
  onSelect,
}: {
  slots: TimeSlot[];
  selectedStartAt: string | null;
  selectedBarberId: string | null;
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
          Horarios disponibles de Kaled y Dorian. Elegí hora y barbero.
        </p>
      </header>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted">Cargando horas…</p>
      ) : slots.length === 0 ? (
        <p className="border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          No hay horas libres este día. Prueba otra fecha.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map((slot) => {
            const selected =
              slot.startAt === selectedStartAt &&
              slot.barberId === selectedBarberId;
            return (
              <button
                key={`${slot.barberId}-${slot.startAt}`}
                type="button"
                onClick={() => onSelect(slot)}
                className={cn(
                  "min-h-14 border px-2 py-2.5 text-center transition",
                  selected
                    ? "border-silver bg-silver text-black"
                    : "border-border bg-surface text-foreground hover:border-silver/40",
                )}
              >
                <span className="block text-sm font-medium">
                  {toDisplayLabel(slot.label)}
                </span>
                {slot.barberName ? (
                  <span
                    className={cn(
                      "mt-0.5 block text-xs",
                      selected ? "text-black/70" : "text-muted",
                    )}
                  >
                    {slot.barberName}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
