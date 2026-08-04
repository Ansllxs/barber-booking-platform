"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminHoursAction,
  saveAdminHoursAction,
} from "@/actions/admin-config";
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

type BarberOption = { id: string; name: string; slug: string };

export function AdminHoursPanel({
  barbers,
  selectedBarberId,
  initialDays,
}: {
  barbers: BarberOption[];
  selectedBarberId: string;
  initialDays: DayHoursInput[];
}) {
  const router = useRouter();
  const [barberId, setBarberId] = useState(selectedBarberId);
  const [days, setDays] = useState<DayHoursInput[]>(initialDays);
  const [pending, startTransition] = useTransition();
  const [loadingBarber, setLoadingBarber] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedBarber =
    barbers.find((b) => b.id === barberId) ?? barbers[0] ?? null;

  useEffect(() => {
    setBarberId(selectedBarberId);
    setDays(initialDays);
  }, [selectedBarberId, initialDays]);

  function updateDay(dayOfWeek: number, patch: Partial<DayHoursInput>) {
    setDays((current) =>
      current.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day,
      ),
    );
  }

  function selectBarber(nextId: string) {
    if (nextId === barberId) return;
    setMessage(null);
    setError(null);
    setLoadingBarber(true);
    setBarberId(nextId);
    startTransition(() => {
      void getAdminHoursAction(nextId).then((result) => {
        setLoadingBarber(false);
        if (!result.success) {
          setError(result.error);
          return;
        }
        setDays(result.data.days);
        router.replace(`/admin/horarios?barber=${nextId}`);
      });
    });
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(() => {
      void saveAdminHoursAction(days, barberId).then((result) => {
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
          subtitle={`Horarios · mañana y tarde (almuerzo en medio)`}
        />

        {barbers.length > 1 ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {barbers.map((barber) => {
              const active = barber.id === barberId;
              return (
                <button
                  key={barber.id}
                  type="button"
                  disabled={pending || loadingBarber}
                  onClick={() => selectBarber(barber.id)}
                  className={cn(
                    "min-h-12 border text-sm font-medium transition disabled:opacity-40",
                    active
                      ? "border-silver bg-silver text-black"
                      : "border-border bg-surface text-silver active:bg-surface-elevated",
                  )}
                >
                  {barber.name.split(" ")[0] ?? barber.name}
                </button>
              );
            })}
          </div>
        ) : null}

        <p className="mt-4 text-sm text-muted">
          Editá el horario de{" "}
          <span className="text-silver">
            {selectedBarber?.name ?? "barbero"}
          </span>
          . Ejemplo: 09:00–12:00 y 13:00–20:00 (o hasta 17:00).
        </p>

        {message ? (
          <p className="mt-3 text-sm text-success">{message}</p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        <section
          className={cn(
            "mt-4 space-y-3",
            (pending || loadingBarber) && "opacity-60",
          )}
        >
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
          disabled={pending || loadingBarber}
          onClick={save}
          className="mt-5 min-h-14 w-full bg-silver text-base font-medium text-black active:bg-silver-bright disabled:opacity-40 md:max-w-sm"
        >
          {pending ? "Guardando…" : "Guardar horarios"}
        </button>
      </div>
    </div>
  );
}
