"use client";

import { useMemo } from "react";
import type { TimeSlot } from "@/types/booking";
import { cn } from "@/lib/utils";

function toDisplayLabel(label: string): string {
  const [h, m] = label.split(":").map(Number);
  const suffix = h >= 12 ? "p.m." : "a.m.";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function barberSortKey(name: string) {
  const n = name.toLowerCase();
  if (n.startsWith("kaled")) return "0";
  if (n.startsWith("dorian")) return "1";
  return `2-${n}`;
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
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; slots: TimeSlot[] }>();

    for (const slot of slots) {
      const id = slot.barberId ?? "unknown";
      const name = slot.barberName ?? "Barbero";
      const group = map.get(id) ?? { name, slots: [] };
      group.slots.push(slot);
      map.set(id, group);
    }

    return [...map.entries()]
      .map(([id, group]) => ({
        id,
        name: group.name,
        slots: [...group.slots].sort((a, b) =>
          a.startAt.localeCompare(b.startAt),
        ),
      }))
      .sort((a, b) =>
        barberSortKey(a.name).localeCompare(barberSortKey(b.name)),
      );
  }, [slots]);

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h2 className="font-display text-3xl text-silver-bright sm:text-4xl">
          Elige la hora
        </h2>
        <p className="text-sm text-muted">
          Elegí barbero y horario disponible.
        </p>
      </header>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted">Cargando horas…</p>
      ) : slots.length === 0 ? (
        <p className="border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          No hay horas libres este día. Prueba otra fecha.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.id} className="space-y-3">
              <h3 className="text-sm tracking-wide text-silver uppercase">
                {group.name}
              </h3>
              {group.slots.length === 0 ? (
                <p className="text-sm text-muted">Sin horarios libres</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {group.slots.map((slot) => {
                    const selected =
                      slot.startAt === selectedStartAt &&
                      slot.barberId === selectedBarberId;
                    return (
                      <button
                        key={`${slot.barberId}-${slot.startAt}`}
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
