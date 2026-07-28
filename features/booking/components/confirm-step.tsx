"use client";

import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { BUSINESS } from "@/lib/constants";
import {
  formatDuration,
  formatServicePrice,
  type BookingService,
} from "@/features/booking/types";
import { Button } from "@/components/ui/button";

export function ConfirmStep({
  service,
  barberName,
  startAt,
  endAt,
  customerName,
  customerPhone,
  submitting,
  error,
  onConfirm,
}: {
  service: BookingService;
  barberName: string;
  startAt: string;
  endAt: string;
  customerName: string;
  customerPhone: string;
  submitting: boolean;
  error: string | null;
  onConfirm: () => void;
}) {
  const tz = BUSINESS.timezone;

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h2 className="font-display text-3xl text-silver-bright sm:text-4xl">
          Confirma tu cita
        </h2>
        <p className="text-sm text-muted">Revisa que todo esté correcto.</p>
      </header>

      <dl className="space-y-4 border border-border bg-surface p-4">
        <div>
          <dt className="text-xs tracking-wide text-silver-dim uppercase">Servicio</dt>
          <dd className="mt-1 text-foreground">{service.name}</dd>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs tracking-wide text-silver-dim uppercase">Fecha</dt>
            <dd className="mt-1 capitalize text-foreground">
              {formatInTimeZone(startAt, tz, "EEEE d MMM", { locale: es })}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-silver-dim uppercase">Hora</dt>
            <dd className="mt-1 text-foreground">
              {formatInTimeZone(startAt, tz, "h:mm a")} –{" "}
              {formatInTimeZone(endAt, tz, "h:mm a")}
            </dd>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs tracking-wide text-silver-dim uppercase">Duración</dt>
            <dd className="mt-1 text-foreground">
              {formatDuration(service.durationMinutes)}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-silver-dim uppercase">Precio</dt>
            <dd className="mt-1 text-foreground">
              {formatServicePrice(service.priceCrc)}
            </dd>
          </div>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-silver-dim uppercase">Barbero</dt>
          <dd className="mt-1 text-foreground">{barberName}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-silver-dim uppercase">Cliente</dt>
          <dd className="mt-1 text-foreground">
            {customerName}
            <span className="mt-0.5 block text-sm text-muted">
              +506 {customerPhone}
            </span>
          </dd>
        </div>
      </dl>

      {error ? (
        <p className="border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <Button onClick={onConfirm} disabled={submitting}>
        {submitting ? "Reservando…" : "Confirmar cita"}
      </Button>
    </div>
  );
}
