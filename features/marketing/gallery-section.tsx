"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { GALLERY_IMAGES } from "@/features/marketing/gallery-data";

export function GallerySection() {
  return (
    <section
      id="galeria"
      className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase">Galería</p>
          <h2 className="font-display mt-4 text-3xl text-silver-bright sm:text-4xl md:text-5xl">
            Cortes reales
          </h2>
          <p className="mt-4 text-sm text-muted sm:text-base">
            Trabajo hecho en COELI. Precisión que se ve de cerca.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-4">
          {GALLERY_IMAGES.map((image, index) => (
            <motion.figure
              key={image.src}
              className="group relative aspect-[3/4] overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                quality={90}
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/15" />
            </motion.figure>
          ))}
        </div>

        <div className="mt-10 flex justify-center sm:mt-12">
          <Link
            href="/reservar"
            className="inline-flex min-h-12 w-full max-w-xs items-center justify-center bg-gold px-8 text-sm font-medium text-[#1a1408] transition hover:bg-gold-bright sm:w-auto"
          >
            Reservar cita
          </Link>
        </div>
      </div>
    </section>
  );
}
