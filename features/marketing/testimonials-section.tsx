"use client";

import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    quote:
      "Ambiente impecable y un corte que dura. Se nota el detalle en cada paso.",
    name: "Cliente COELI",
  },
  {
    quote:
      "Reservé desde el celular en dos minutos. Llegué y todo estaba listo.",
    name: "Cliente COELI",
  },
  {
    quote:
      "El ritual de barba vale cada colón. Salís distinto.",
    name: "Cliente COELI",
  },
];

export function TestimonialsSection() {
  return (
    <section className="scroll-mt-20 border-y border-border px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] text-silver-dim uppercase">
            Testimonios
          </p>
          <h2 className="font-display mt-4 text-3xl text-silver-bright sm:text-5xl">
            Lo que se siente
          </h2>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <motion.blockquote
              key={item.quote}
              className="text-center sm:text-left"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <p className="font-display text-xl leading-snug text-silver-bright">
                “{item.quote}”
              </p>
              <footer className="mt-4 text-xs tracking-wide text-silver-dim uppercase">
                {item.name}
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
