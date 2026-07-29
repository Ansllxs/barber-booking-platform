import { BUSINESS } from "@/lib/constants";

/** Digits only, for wa.me links (e.g. 50671936588). */
export function whatsappDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const to = whatsappDigits(phone);
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

/** Customer → Coeli: notify the shop about a new booking. */
export function buildBookingNotifyShopMessage(params: {
  customerName: string;
  serviceName: string;
  fecha: string;
  hora: string;
}): string {
  return [
    `Hola, acabo de reservar en ${BUSINESS.name} 💈`,
    "",
    `Nombre: ${params.customerName}`,
    `Servicio: ${params.serviceName}`,
    `Fecha: ${params.fecha}`,
    `Hora: ${params.hora}`,
    "",
    "¡Gracias!",
  ].join("\n");
}

/** Barbería → cliente: reminder (opens WhatsApp on the tablet). */
export function buildReminderToCustomerMessage(params: {
  customerName: string;
  serviceName: string;
  fecha: string;
  hora: string;
}): string {
  return [
    `Hola ${params.customerName}, te escribimos de ${BUSINESS.name} 💈`,
    "",
    `Te recordamos tu cita de ${params.serviceName} el ${params.fecha} a las ${params.hora}.`,
    "",
    "Si necesitás reprogramar, respondé este mensaje. ¡Te esperamos!",
  ].join("\n");
}

export function shopWhatsAppUrl(text: string): string {
  return buildWhatsAppUrl(BUSINESS.whatsappNumber, text);
}
