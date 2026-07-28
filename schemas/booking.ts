import { z } from "zod";

/** Local CR mobile: 8 digits. UI always shows +506 prefix. */
export const bookingCustomerSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre es demasiado largo"),
  customerPhone: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "Ingresa tu número de 8 dígitos (sin el 506)"),
});

export const createAppointmentSchema = bookingCustomerSchema.extend({
  serviceId: z.string().min(1, "Servicio inválido"),
  barberId: z.string().min(1, "Barbero inválido"),
  startAt: z.string().min(1, "Horario inválido"),
});

export const availabilityQuerySchema = z.object({
  serviceId: z.string().min(1),
  barberId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
});

export type BookingCustomerInput = z.infer<typeof bookingCustomerSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
