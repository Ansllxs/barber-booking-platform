"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAdminHoursAction } from "@/actions/admin-config";
import { AdminNav } from "@/features/admin/components/admin-nav";
import type { DayHoursInput } from "@/services/admin-config.service";
import { cn } from "@/lib/utils";

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

/** Half-hour options 00:00–23:30 for tablet-friendly selects */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

const selectClass =
  "min-h-12 w-full appearance-none border border-border bg-background px-3 text-base text-foreground outline-none focus:border-silver/50";

function TimeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = TIME_OPTIONS.includes(value)
    ? TIME_OPTIONS
    : [value, ...TIME_OPTIONS].sort();

  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        {options.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AdminHoursPanel({
  barberName,
  initialDays,
}: {
  barberName: string;
  initialDays: DayHoursInput[];
}) {
  const router = useRouter();
  const [days, setDays] = useState<DayHoursInput[]>(initialDays);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateDay(dayOfWeek: number, patch: Partial<DayHoursInput>) {
    setDays((current) =>
      current.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day,
      ),
    );
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(() => {
      void saveAdminHoursAction(days).then((result) => {
        if (!result.success) {
          setError(result.error);
          return;
        }
        setMessage("Horarios guardados");
        router.refresh();
      });
    });
  }

  return (
    <div className="bg-luxury min-h-dvh">
      <div className="mx-auto w-full max-w-5xl px-5 py-5 md:px-8 md:py-6">
        <AdminNav
          subtitle={`Horario de ${barberName} · mañana y tarde (almuerzo en medio)`}
        />

        <p className="mt-4 text-sm text-muted">
          Podés cambiar las horas de cada día y marcar si está cerrado. Ejemplo:
          09:00–12:00 y 13:00–20:00.
        </p>

        {message ? (
          <p className="mt-3 text-sm text-success">{message}</p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        <section className="mt-4 space-y-3">
          {days.map((day) => (
            <article
              key={day.dayOfWeek}
              className={cn(
                "border bg-surface p-4 md:p-5",
                day.isClosed ? "border-border/70" : "border-border",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg text-foreground">
                  {DAY_NAMES[day.dayOfWeek]}
                </h2>
                <label className="flex min-h-11 items-center gap-2 text-sm text-silver">
                  <input
                    type="checkbox"
                    checked={day.isClosed}
                    onChange={(e) =>
                      updateDay(day.dayOfWeek, { isClosed: e.target.checked })
                    }
                  />
                  Día cerrado
                </label>
              </div>

              <div
                className={cn(
                  "mt-4 grid gap-4 md:grid-cols-2",
                  day.isClosed && "opacity-50",
                )}
              >
                <div className="space-y-2 rounded-sm border border-border/50 p-3">
                  <p className="text-xs tracking-wide text-silver-dim uppercase">
                    Mañana
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <TimeSelect
                      label="Abre"
                      value={day.morningOpen}
                      onChange={(morningOpen) =>
                        updateDay(day.dayOfWeek, { morningOpen })
                      }
                    />
                    <TimeSelect
                      label="Cierra"
                      value={day.morningClose}
                      onChange={(morningClose) =>
                        updateDay(day.dayOfWeek, { morningClose })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2 rounded-sm border border-border/50 p-3">
                  <p className="text-xs tracking-wide text-silver-dim uppercase">
                    Tarde
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <TimeSelect
                      label="Abre"
                      value={day.afternoonOpen}
                      onChange={(afternoonOpen) =>
                        updateDay(day.dayOfWeek, { afternoonOpen })
                      }
                    />
                    <TimeSelect
                      label="Cierra"
                      value={day.afternoonClose}
                      onChange={(afternoonClose) =>
                        updateDay(day.dayOfWeek, { afternoonClose })
                      }
                    />
                  </div>
                </div>
              </div>

              {day.isClosed ? (
                <p className="mt-3 text-sm text-muted">
                  Este día no acepta citas. Las horas quedan guardadas por si lo
                  abrís después.
                </p>
              ) : null}
            </article>
          ))}
        </section>

        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="mt-5 min-h-14 w-full bg-silver text-base font-medium text-black active:bg-silver-bright disabled:opacity-40 md:max-w-sm"
        >
          {pending ? "Guardando…" : "Guardar horarios"}
        </button>
      </div>
    </div>
  );
}
