import { prisma } from "@/lib/prisma";
import { normalizePhoneCR } from "@/utils/date";
import { assertSlotStillAvailable } from "@/services/availability.service";
import { ensureDorianBarber } from "@/services/ensure-barbers.service";
import type { Appointment } from "@/lib/generated/prisma/client";

export type CreateAppointmentInput = {
  serviceId: string;
  barberId: string;
  startAt: Date;
  customerName: string;
  customerPhone: string;
  notes?: string;
  source?: "WEB" | "ADMIN";
};

export type AppointmentWithRelations = Appointment & {
  service: {
    id: string;
    name: string;
    priceCrc: number;
    durationMinutes: number;
  };
  barber: {
    id: string;
    name: string;
  };
};

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<AppointmentWithRelations> {
  const customerName = input.customerName.trim();
  const customerPhone = normalizePhoneCR(input.customerPhone);

  if (customerName.length < 2) {
    throw new Error("El nombre es inválido");
  }

  const { endAt } = await assertSlotStillAvailable({
    barberId: input.barberId,
    serviceId: input.serviceId,
    startAt: input.startAt,
  });

  return prisma.$transaction(async (tx) => {
    const overlap = await tx.appointment.findFirst({
      where: {
        barberId: input.barberId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startAt: { lt: endAt },
        endAt: { gt: input.startAt },
      },
      select: { id: true },
    });

    if (overlap) {
      throw new Error("Ese horario acabó de ocuparse. Elige otro.");
    }

    const appointment = await tx.appointment.create({
      data: {
        barberId: input.barberId,
        serviceId: input.serviceId,
        customerName,
        customerPhone,
        startAt: input.startAt,
        endAt,
        status: "CONFIRMED",
        source: input.source ?? "WEB",
        notes: input.notes?.trim() || null,
        notifications: {
          create: {
            type: "CONFIRMATION",
            channel: "WHATSAPP",
            status: "PENDING",
          },
        },
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            priceCrc: true,
            durationMinutes: true,
          },
        },
        barber: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return appointment;
  });
}

export async function getAppointmentById(
  id: string,
): Promise<AppointmentWithRelations | null> {
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          priceCrc: true,
          durationMinutes: true,
        },
      },
      barber: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function listActiveServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      includes: true,
      priceCrc: true,
      durationMinutes: true,
    },
  });
}

export async function listActiveBarbers() {
  await ensureDorianBarber();
  return prisma.barber.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

export async function getDefaultBarber() {
  return prisma.barber.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}
