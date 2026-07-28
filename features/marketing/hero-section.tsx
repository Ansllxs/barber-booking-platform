"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/brand/logo";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden md:items-stretch">
      {/*
        Desktop: la foto ocupa la derecha (menos estirada = más nítida).
        Móvil: full-bleed con object-cover.
      */}
      <div className="absolute inset-0 md:left-[38%] lg:left-[40%]">
        <Image
          src="/gallery/hero-kaled.jpg"
          alt="COELI BARBER CLUB"
          fill
          priority
          quality={100}
          unoptimized
          sizes="(max-width: 768px) 100vw, 62vw"
          className="object-cover object-[center_12%] md:object-center"
        />
      </div>

      {/* Negro detrás del logo → difuminado hacia la foto */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[88%] md:hidden"
        style={{
          background:
            "linear-gradient(to top, #000 0%, #000 40%, rgba(0,0,0,0.94) 58%, rgba(0,0,0,0.5) 78%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] hidden w-[48%] bg-black md:block lg:w-[46%]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-[42%] z-[1] hidden w-[18%] md:block lg:left-[40%] lg:w-[16%]"
        style={{
          background:
            "linear-gradient(to right, #000 0%, rgba(0,0,0,0.75) 40%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-4 pt-24 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 md:justify-center md:px-8 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex w-full max-w-md flex-col items-center text-center md:max-w-lg md:items-start md:text-left"
        >
          <BrandLogo size="hero" href={null} priority className="mx-auto md:mx-0" />
          <p className="mt-6 max-w-md text-sm leading-relaxed text-silver sm:mt-8 sm:text-base md:text-lg">
            Barbería premium. Cortes precisos, rituales y una experiencia que se
            siente distinta.
          </p>
          <Link
            href="/reservar"
            className="mt-8 inline-flex min-h-12 w-full max-w-xs items-center justify-center bg-gold px-8 text-sm font-medium tracking-wide text-[#1a1408] transition hover:bg-gold-bright sm:w-auto sm:min-w-[14rem]"
          >
            Reservar cita
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
