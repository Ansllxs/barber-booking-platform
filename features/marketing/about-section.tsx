"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function AboutSection() {
  return (
    <section
      id="nosotros"
      className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24 md:py-28"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden lg:max-w-none"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
        >
          <Image
            src="/gallery/04-corte-barba.png"
            alt="Detalle de corte y barba en COELI"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
        </motion.div>

        <motion.div
          className="text-center lg:text-left"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          <p className="text-xs tracking-[0.3em] text-gold uppercase">
            Sobre nosotros
          </p>
          <h2 className="font-display mt-4 text-3xl text-silver-bright sm:text-4xl md:text-5xl">
            Detalle, estilo y ritual
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted sm:mt-6 sm:text-lg lg:mx-0">
            En COELI BARBER CLUB cada cita es una experiencia. El enfoque es
            precisión, atmósfera calmada y un resultado que se nota desde el
            primer fade hasta el último detalle.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
