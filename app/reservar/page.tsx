import type { Metadata } from "next";
import { listActiveServices, getDefaultBarber } from "@/services/appointment.service";
import { BookingWizard } from "@/features/booking/components/booking-wizard";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reservar cita",
  description: "Reserva tu cita en COELI BARBER CLUB en pocos pasos.",
};

export const dynamic = "force-dynamic";

export default async function ReservarPage() {
  const [services, barber] = await Promise.all([
    listActiveServices(),
    getDefaultBarber(),
  ]);

  if (!barber || services.length === 0) {
    return (
      <main className="bg-luxury flex min-h-dvh items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-3xl text-silver-bright">
            Reservas no disponibles
          </h1>
          <p className="mt-3 text-sm text-muted">
            Aún no hay servicios o barberos activos. Intenta más tarde.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm text-silver underline-offset-4 hover:underline"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-luxury min-h-dvh">
      <BookingWizard services={services} barber={barber} />
    </main>
  );
}
