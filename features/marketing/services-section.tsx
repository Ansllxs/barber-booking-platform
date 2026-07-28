"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export type MarketingService = {
  id: string;
  name: string;
  description: string | null;
  includes: string[];
  priceCrc: number;
  durationMinutes: number;
};

export function ServicesSection({ services }: { services: MarketingService[] }) {
  return (
    <section
      id="servicios"
      className="scroll-mt-20 border-y border-gold/20 px-4 py-16 sm:px-6 sm:py-24 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase">Servicios</p>
          <h2 className="font-display mt-4 text-3xl text-silver-bright sm:text-4xl md:text-5xl">
            Nuestras experiencias
          </h2>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {services.map((service, index) => (
            <motion.li
              key={service.id}
              className="flex h-full flex-col border border-gold/30 bg-surface/80 p-4 sm:p-5"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(index * 0.04, 0.3) }}
            >
              <span className="h-px w-10 bg-gold" />
              <p className="mt-4 font-display text-xl leading-snug text-silver-bright sm:text-2xl">
                {service.name}
              </p>
              {service.description ? (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {service.description}
                </p>
              ) : null}
              {service.includes.length > 0 ? (
                <ul className="mt-4 space-y-1.5">
                  {service.includes.slice(0, 4).map((item) => (
                    <li
                      key={item}
                      className="text-xs tracking-wide text-silver-dim"
                    >
                      <span className="mr-2 text-gold">·</span>
                      {item}
                    </li>
                  ))}
                  {service.includes.length > 4 ? (
                    <li className="text-xs text-gold-dim">
                      +{service.includes.length - 4} más
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </motion.li>
          ))}
        </ul>

        <div className="mt-10 flex justify-center sm:mt-12">
          <Link
            href="/reservar"
            className="inline-flex min-h-12 w-full max-w-xs items-center justify-center bg-gold px-8 text-sm font-medium tracking-wide text-[#1a1408] transition hover:bg-gold-bright sm:w-auto"
          >
            Reservar cita
          </Link>
        </div>
      </div>
    </section>
  );
}
