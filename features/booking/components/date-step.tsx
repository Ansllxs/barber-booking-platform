"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function DateStep({
  dates,
  selectedDate,
  loading,
  onSelect,
}: {
  dates: string[];
  selectedDate: string | null;
  loading: boolean;
  onSelect: (date: string) => void;
}) {
  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h2 className="font-display text-3xl text-silver-bright sm:text-4xl">
          Elige la fecha
        </h2>
        <p className="text-sm text-muted">
          Lun–Sáb. Almuerzo de 12:00 a 1:00 p.m. sin citas.
        </p>
      </header>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted">Cargando fechas…</p>
      ) : dates.length === 0 ? (
        <p className="border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          No hay fechas disponibles para este servicio en las próximas semanas.
        </p>
      ) : (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
          {dates.map((date) => {
            const d = parseISO(date);
            const selected = date === selectedDate;
            return (
              <button
                key={date}
                type="button"
                onClick={() => onSelect(date)}
                className={cn(
                  "snap-start flex min-h-[5.5rem] w-[4.75rem] shrink-0 flex-col items-center justify-center border px-2 py-3 transition",
                  selected
                    ? "border-silver bg-silver text-black"
                    : "border-border bg-surface text-foreground hover:border-silver/40",
                )}
              >
                <span className="text-[10px] tracking-wider uppercase opacity-80">
                  {format(d, "EEE", { locale: es })}
                </span>
                <span className="mt-1 text-2xl font-medium leading-none">
                  {format(d, "d")}
                </span>
                <span className="mt-1 text-[10px] uppercase opacity-80">
                  {format(d, "MMM", { locale: es })}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
