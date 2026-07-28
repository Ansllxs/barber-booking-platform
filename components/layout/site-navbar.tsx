"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#nosotros", label: "Nosotros" },
  { href: "#servicios", label: "Servicios" },
  { href: "#galeria", label: "Galería" },
  { href: "#faq", label: "FAQ" },
  { href: "#ubicacion", label: "Ubicación" },
];

export function SiteNavbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 md:px-8">
        <BrandLogo size="sm" />

        <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs tracking-[0.16em] text-silver-dim uppercase transition hover:text-gold-bright"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/reservar"
            className="inline-flex min-h-9 items-center bg-gold px-3 text-[11px] font-medium tracking-wide text-[#1a1408] transition hover:bg-gold-bright sm:min-h-10 sm:px-4 sm:text-xs"
          >
            Reservar
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center text-silver lg:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-white/5 bg-background lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="flex max-h-[calc(100svh-3.5rem)] flex-col gap-1 overflow-y-auto px-4 py-4">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-3 text-base tracking-wide text-silver"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/reservar"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex min-h-12 items-center justify-center bg-gold text-sm font-medium text-[#1a1408]"
          >
            Reservar cita
          </Link>
        </div>
      </div>
    </header>
  );
}
