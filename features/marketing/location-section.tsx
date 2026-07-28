import Link from "next/link";
import { BUSINESS } from "@/lib/constants";

const MAPS_EMBED =
  "https://www.google.com/maps?q=Coeli+Barber+Club,+100+mts+este+de+la+Plaza+de+Buenos+Aires,+Santa+Cruz,+Guanacaste,+Barrio+Buenos+Aires&hl=es&z=16&output=embed";

const ADDRESS =
  "100 mts este de la Plaza de Buenos Aires, Barrio Buenos Aires, Santa Cruz, Guanacaste";

export function LocationSection() {
  return (
    <section
      id="ubicacion"
      className="scroll-mt-20 border-t border-gold/20 px-4 py-16 sm:px-6 sm:py-24 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase">Ubicación</p>
          <h2 className="font-display mt-4 text-3xl text-silver-bright sm:text-4xl md:text-5xl">
            Visitanos
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
            {ADDRESS}
          </p>
          <p className="mt-2 text-sm text-silver">
            Lun–Sáb 9:00 a.m. – 8:00 p.m.
            <span className="mx-2 text-gold-dim">·</span>
            {BUSINESS.phoneDisplay}
          </p>
        </div>

        <div className="mt-8 overflow-hidden border border-gold/30 shadow-[0_0_40px_rgba(184,155,76,0.08)] sm:mt-10">
          <div className="relative h-64 w-full bg-surface sm:h-80 md:h-[28rem]">
            <iframe
              title="Ubicación COELI BARBER CLUB en Google Maps"
              src={MAPS_EMBED}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold/20" />
          </div>
        </div>

        <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-center">
          <a
            href={BUSINESS.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 w-full items-center justify-center border border-gold/40 px-6 text-sm text-gold transition hover:border-gold hover:text-gold-bright sm:w-auto"
          >
            Abrir en Google Maps
          </a>
          <Link
            href="/reservar"
            className="inline-flex min-h-12 w-full items-center justify-center bg-gold px-8 text-sm font-medium text-[#1a1408] transition hover:bg-gold-bright sm:w-auto"
          >
            Reservar cita
          </Link>
        </div>
      </div>
    </section>
  );
}
