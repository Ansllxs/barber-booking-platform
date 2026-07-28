import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { BUSINESS } from "@/lib/constants";
import { formatPhoneDisplay } from "@/utils/date";

type SendResult = {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
  skipped?: boolean;
};

type ConfirmationParts = {
  customerName: string;
  serviceName: string;
  fecha: string;
  hora: string;
  fullText: string;
};

function digitsOnlyPhone(e164: string): string {
  return e164.replace(/\D/g, "");
}

function buildConfirmationParts(params: {
  customerName: string;
  serviceName: string;
  startAt: Date;
}): ConfirmationParts {
  const tz = BUSINESS.timezone;
  const fecha = formatInTimeZone(params.startAt, tz, "EEEE d 'de' MMMM yyyy", {
    locale: es,
  });
  const hora = formatInTimeZone(params.startAt, tz, "h:mm a");

  const fullText = [
    "¡Gracias por reservar tu cita en Coeli Barber Club! 💈",
    "",
    `Tu servicio de ${params.serviceName} a nombre de ${params.customerName} a las ${hora} el día ${fecha}`,
    "",
    "Será un gusto recibirte y brindarte una experiencia de primer nivel.",
    "",
    "Importante: Para garantizar un servicio puntual y de alta calidad para todos nuestros clientes, contamos con un período de tolerancia de 10 minutos. Si llegas después de ese tiempo, tu cita deberá ser reprogramada según la próxima disponibilidad que mejor se adapte a tu horario.",
    "",
    "¡Gracias por tu comprensión! Te esperamos.",
  ].join("\n");

  return {
    customerName: params.customerName,
    serviceName: params.serviceName,
    fecha,
    hora,
    fullText,
  };
}

/**
 * Template esperado en Meta (nombre en WHATSAPP_TEMPLATE_CONFIRMATION):
 *
 * ¡Gracias por reservar tu cita en Coeli Barber Club! 💈
 *
 * Tu servicio de {{1}} a nombre de {{2}} a las {{3}} el día {{4}}
 *
 * Será un gusto recibirte y brindarte una experiencia de primer nivel.
 *
 * Importante: Para garantizar un servicio puntual y de alta calidad para todos nuestros clientes, contamos con un período de tolerancia de 10 minutos. Si llegas después de ese tiempo, tu cita deberá ser reprogramada según la próxima disponibilidad que mejor se adapte a tu horario.
 *
 * ¡Gracias por tu comprensión! Te esperamos.
 *
 * Variables: {{1}} servicio, {{2}} nombre, {{3}} hora, {{4}} fecha
 */
function buildTemplateBody(parts: ConfirmationParts) {
  return {
    messaging_product: "whatsapp" as const,
    type: "template" as const,
    template: {
      name: process.env.WHATSAPP_TEMPLATE_CONFIRMATION!,
      language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "es" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: parts.serviceName },
            { type: "text", text: parts.customerName },
            { type: "text", text: parts.hora },
            { type: "text", text: parts.fecha },
          ],
        },
      ],
    },
  };
}

async function postWhatsAppMessage(body: Record<string, unknown>): Promise<SendResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return {
      ok: false,
      skipped: true,
      error:
        "WhatsApp no configurado (faltan WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID)",
    };
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string; error_user_msg?: string };
  };

  if (!response.ok) {
    return {
      ok: false,
      error:
        json.error?.error_user_msg ??
        json.error?.message ??
        `WhatsApp API error (${response.status})`,
    };
  }

  return {
    ok: true,
    providerMessageId: json.messages?.[0]?.id,
  };
}

async function sendWhatsAppCloudMessage(params: {
  toPhoneE164: string;
  parts: ConfirmationParts;
}): Promise<SendResult> {
  const templateName = process.env.WHATSAPP_TEMPLATE_CONFIRMATION?.trim();
  const to = digitsOnlyPhone(params.toPhoneE164);

  const body = templateName
    ? { ...buildTemplateBody(params.parts), to }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body: params.parts.fullText },
      };

  return postWhatsAppMessage(body);
}

/** Free-form text FROM the barbershop Cloud number TO the customer. */
export async function sendWhatsAppTextMessage(params: {
  toPhoneE164: string;
  text: string;
}): Promise<SendResult> {
  return postWhatsAppMessage({
    messaging_product: "whatsapp",
    to: digitsOnlyPhone(params.toPhoneE164),
    type: "text",
    text: { preview_url: false, body: params.text.slice(0, 4096) },
  });
}

/**
 * Admin tablet: contact customer from COELI WhatsApp (Cloud API),
 * not from whatever personal account is on the device.
 */
export async function sendAdminCustomerOutreach(
  appointmentId: string,
  kind: "reminder" | "waiting" | "confirm" = "reminder",
): Promise<SendResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { service: { select: { name: true } } },
  });

  if (!appointment) {
    return { ok: false, error: "Cita no encontrada" };
  }

  const tz = BUSINESS.timezone;
  const fecha = formatInTimeZone(
    appointment.startAt,
    tz,
    "EEEE d 'de' MMMM",
    { locale: es },
  );
  const hora = formatInTimeZone(appointment.startAt, tz, "h:mm a");

  const texts: Record<typeof kind, string> = {
    reminder: [
      `Hola ${appointment.customerName}, te escribimos de ${BUSINESS.name}.`,
      "",
      `Te recordamos tu cita de ${appointment.service.name} el ${fecha} a las ${hora}.`,
      "",
      "Si necesitás reprogramar, respondé este mensaje. ¡Te esperamos!",
    ].join("\n"),
    waiting: [
      `Hola ${appointment.customerName}, te escribimos de ${BUSINESS.name}.`,
      "",
      `Ya te esperamos para tu ${appointment.service.name} de las ${hora}.`,
      "¿Vas en camino?",
    ].join("\n"),
    confirm: [
      `Hola ${appointment.customerName}, te escribimos de ${BUSINESS.name}.`,
      "",
      `¿Nos confirmás tu cita de ${appointment.service.name} el ${fecha} a las ${hora}?`,
      "Respondé sí o no, por favor.",
    ].join("\n"),
  };

  return sendWhatsAppTextMessage({
    toPhoneE164: appointment.customerPhone,
    text: texts[kind],
  });
}

/**
 * Sends confirmation FROM the barbershop TO the customer.
 * Production: use an approved template (WHATSAPP_TEMPLATE_CONFIRMATION).
 * Dev/test: free-form text works inside the 24h window or to Meta test numbers.
 */
export async function sendAppointmentConfirmation(
  appointmentId: string,
): Promise<SendResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      service: { select: { name: true } },
      notifications: {
        where: { type: "CONFIRMATION", channel: "WHATSAPP" },
        take: 1,
      },
    },
  });

  if (!appointment) {
    return { ok: false, error: "Cita no encontrada" };
  }

  const parts = buildConfirmationParts({
    customerName: appointment.customerName,
    serviceName: appointment.service.name,
    startAt: appointment.startAt,
  });

  const result = await sendWhatsAppCloudMessage({
    toPhoneE164: appointment.customerPhone,
    parts,
  });

  const notificationId = appointment.notifications[0]?.id;

  if (notificationId) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: result.ok ? "SENT" : "FAILED",
        providerMessageId: result.providerMessageId ?? null,
        sentAt: result.ok ? new Date() : null,
        error: result.error ?? null,
        payload: {
          to: formatPhoneDisplay(appointment.customerPhone),
          preview: parts.fullText,
          skipped: Boolean(result.skipped),
          mode: process.env.WHATSAPP_TEMPLATE_CONFIRMATION?.trim()
            ? "template"
            : "text",
        },
      },
    });
  }

  return result;
}

export async function sendAppointmentReminder(
  appointmentId: string,
): Promise<SendResult> {
  void appointmentId;
  return { ok: false, skipped: true, error: "Reminder not wired yet" };
}

export async function sendAppointmentCancellation(
  appointmentId: string,
): Promise<SendResult> {
  void appointmentId;
  return { ok: false, skipped: true, error: "Cancellation not wired yet" };
}

/** Direct send for smoke tests (no DB). */
export async function sendWhatsAppSmokeTest(params: {
  toPhoneE164: string;
  customerName?: string;
}): Promise<SendResult> {
  const parts = buildConfirmationParts({
    customerName: params.customerName ?? "Cliente de prueba",
    serviceName: "Corte de prueba",
    startAt: new Date(),
  });

  return sendWhatsAppCloudMessage({
    toPhoneE164: params.toPhoneE164,
    parts,
  });
}
