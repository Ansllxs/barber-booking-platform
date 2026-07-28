"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "¿Cómo reservo?",
    a: "Entrá a Reservar cita, elegí el servicio, la fecha, la hora y tus datos. Listo.",
  },
  {
    q: "¿Cuál es el horario?",
    a: "Lunes a sábado de 9:00 a.m. a 8:00 p.m. La última cita se toma a las 7:00 p.m. Almuerzo de 12:00 a 1:00 p.m.",
  },
  {
    q: "¿Puedo cancelar?",
    a: "Sí. Contactá al barbero con tiempo o se puede liberar el horario desde el panel para que otra persona pueda reservar.",
  },
  {
    q: "¿Dónde están?",
    a: "Podés ver la ubicación exacta en Google Maps desde la sección Ubicación.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24 md:py-28"
    >
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase">FAQ</p>
          <h2 className="font-display mt-4 text-3xl text-silver-bright sm:text-4xl md:text-5xl">
            Preguntas frecuentes
          </h2>
        </div>
        <ul className="mt-10 divide-y divide-border border-y border-border">
          {FAQS.map((item, index) => {
            const isOpen = open === index;
            return (
              <li key={item.q}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  onClick={() => setOpen(isOpen ? null : index)}
                >
                  <span className="text-base text-foreground">{item.q}</span>
                  <span className="text-silver-dim">{isOpen ? "–" : "+"}</span>
                </button>
                <div
                  className={cn(
                    "overflow-hidden pb-5 text-sm leading-relaxed text-muted",
                    isOpen ? "block" : "hidden",
                  )}
                >
                  {item.a}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
