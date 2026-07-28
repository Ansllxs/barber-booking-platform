import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";
import { BUSINESS } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 text-center sm:gap-8 sm:px-6 sm:py-14 md:px-8">
        <BrandLogo size="lg" />
        <div className="space-y-2 px-2">
          <p className="text-sm text-muted">
            Lun–Sáb · 9:00 a.m. – 8:00 p.m. · Última cita 7:00 p.m.
          </p>
          <p className="text-sm text-gold">{BUSINESS.phoneDisplay}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs tracking-[0.16em] text-silver-dim uppercase">
          <Link href="/reservar" className="hover:text-silver">
            Reservar cita
          </Link>
          <a href="#servicios" className="hover:text-silver">
            Servicios
          </a>
          <a href="#galeria" className="hover:text-silver">
            Galería
          </a>
          <a
            href={BUSINESS.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-silver"
          >
            Ubicación
          </a>
        </div>
        <p className="text-[11px] text-muted/70">
          © {new Date().getFullYear()} {BUSINESS.name}
        </p>
      </div>
    </footer>
  );
}
