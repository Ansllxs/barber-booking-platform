"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  formatDuration,
  formatServicePrice,
  type BookingService,
} from "@/features/booking/types";
import { cn } from "@/lib/utils";

export function ServiceStep({
  services,
  selectedId,
  onSelect,
}: {
  services: BookingService[];
  selectedId: string | null;
  onSelect: (service: BookingService) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h2 className="font-display text-3xl text-silver-bright sm:text-4xl">
          Elige tu servicio
        </h2>
        <p className="text-sm text-muted">
          Tocá un servicio para seleccionarlo. Si tiene extras, abrí el detalle
          para ver qué incluye.
        </p>
      </header>

      <ul className="space-y-3">
        {services.map((service) => {
          const selected = service.id === selectedId;
          const isOpen = openId === service.id;
          const hasIncludes = service.includes.length > 0;

          return (
            <li
              key={service.id}
              className={cn(
                "overflow-hidden border transition",
                selected
                  ? "border-gold/50 bg-surface-elevated"
                  : "border-border bg-surface",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(service)}
                className="w-full px-4 py-4 text-left transition active:scale-[0.995]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-medium text-foreground">
                      {service.name}
                    </p>
                    {service.description ? (
                      <p className="mt-1 text-sm text-muted line-clamp-2">
                        {service.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm text-gold-bright">
                      {formatServicePrice(service.priceCrc)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {formatDuration(service.durationMinutes)}
                    </p>
                  </div>
                </div>
              </button>

              {hasIncludes ? (
                <div className="border-t border-border/80">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenId((current) =>
                        current === service.id ? null : service.id,
                      )
                    }
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-xs tracking-wide text-gold uppercase">
                      {isOpen
                        ? "Ocultar detalle"
                        : `Ver qué incluye (${service.includes.length})`}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-gold transition",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <ul className="space-y-2 px-4 pb-4">
                        {service.includes.map((item) => (
                          <li
                            key={item}
                            className="flex gap-2 text-sm text-silver"
                          >
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
