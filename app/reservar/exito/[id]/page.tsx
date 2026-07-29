import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { MessageCircle } from "lucide-react";
import { getAppointmentById } from "@/services/appointment.service";
import { BUSINESS } from "@/lib/constants";
import { formatCrc, formatPhoneDisplay } from "@/utils/date";
import { formatDuration } from "@/features/booking/types";
import {
  buildBookingNotifyShopMessage,
  shopWhatsAppUrl,
} from "@/utils/whatsapp";
import { BrandLogo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Cita confirmada",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BookingSuccessPage({ params }: Props) {
  const { id } = await params;
  const appointment = await getAppointmentById(id);

  if (!appointment || appointment.status === "CANCELLED") {
    notFound();
  }

  const tz = BUSINESS.timezone;
  const fecha = formatInTimeZone(appointment.startAt, tz, "EEEE d 'de' MMMM", {
    locale: es,
  });
  const hora = formatInTimeZone(appointment.startAt, tz, "h:mm a");

  const whatsappHref = shopWhatsAppUrl(
    buildBookingNotifyShopMessage({
      customerName: appointment.customerName,
      serviceName: appointment.service.name,
      fecha,
      hora,
    }),
  );

  return (
    <main className="bg-luxury flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-3">
          <BrandLogo size="md" href="/" className="mx-auto" />
          <p className="text-xs tracking-[0.25em] text-silver-dim uppercase">
            Listo
          </p>
          <h1 className="font-display text-4xl text-silver-bright sm:text-5xl">
            Cita confirmada
          </h1>
          <p className="text-sm text-muted">
            Gracias, {appointment.customerName}. Tu cita quedó agendada. Tocá el
            botón para avisar por WhatsApp (el mensaje ya va escrito).
          </p>
        </div>

        <dl className="space-y-4 border border-border bg-surface p-5 text-left">
          <div>
            <dt className="text-xs tracking-wide text-silver-dim uppercase">
              Servicio
            </dt>
            <dd className="mt-1 text-foreground">{appointment.service.name}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-silver-dim uppercase">
              Fecha y hora
            </dt>
            <dd className="mt-1 capitalize text-foreground">
              {fecha}
              <span className="mt-1 block normal-case text-muted">
                {hora} – {formatInTimeZone(appointment.endAt, tz, "h:mm a")} ·{" "}
                {formatDuration(appointment.service.durationMinutes)}
              </span>
            </dd>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs tracking-wide text-silver-dim uppercase">
                Barbero
              </dt>
              <dd className="mt-1 text-foreground">{appointment.barber.name}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-silver-dim uppercase">
                Precio
              </dt>
              <dd className="mt-1 text-foreground">
                {formatCrc(appointment.service.priceCrc)}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-silver-dim uppercase">
              Tu WhatsApp
            </dt>
            <dd className="mt-1 text-foreground">
              {formatPhoneDisplay(appointment.customerPhone)}
            </dd>
          </div>
        </dl>

        <div className="space-y-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 bg-silver px-5 text-sm font-medium text-black"
          >
            <MessageCircle className="h-5 w-5" />
            Notifique su cita porfavor
          </a>
          <p className="text-xs leading-relaxed text-muted">
            Es muy importante que nos envíe su confirmación al WhatsApp.
          </p>
          <Link
            href="/"
            className="inline-flex min-h-12 w-full items-center justify-center border border-border px-5 text-sm text-silver"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
