import { prisma } from "@/lib/prisma";

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueServiceSlug(base: string, excludeId?: string) {
  let slug = slugify(base) || "servicio";
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const existing = await prisma.service.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    n += 1;
  }
}

export async function listAdminServices() {
  return prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function upsertAdminService(input: {
  id?: string;
  name: string;
  description?: string;
  includes?: string[];
  priceCrc: number;
  durationMinutes: number;
  isActive: boolean;
  sortOrder: number;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("El nombre es obligatorio");
  if (!Number.isFinite(input.priceCrc) || input.priceCrc < 0) {
    throw new Error("Precio inválido");
  }
  if (
    !Number.isFinite(input.durationMinutes) ||
    input.durationMinutes < 15 ||
    input.durationMinutes > 480
  ) {
    throw new Error("Duración inválida (15–480 min)");
  }

  const includes = (input.includes ?? [])
    .map((item) => item.trim())
    .filter(Boolean);

  if (input.id) {
    const slug = await uniqueServiceSlug(name, input.id);
    return prisma.service.update({
      where: { id: input.id },
      data: {
        name,
        slug,
        description: input.description?.trim() || null,
        includes,
        priceCrc: Math.round(input.priceCrc),
        durationMinutes: Math.round(input.durationMinutes),
        isActive: input.isActive,
        sortOrder: Math.round(input.sortOrder),
      },
    });
  }

  const slug = await uniqueServiceSlug(name);
  return prisma.service.create({
    data: {
      name,
      slug,
      description: input.description?.trim() || null,
      includes,
      priceCrc: Math.round(input.priceCrc),
      durationMinutes: Math.round(input.durationMinutes),
      isActive: input.isActive,
      sortOrder: Math.round(input.sortOrder),
    },
  });
}

export async function setServiceActive(id: string, isActive: boolean) {
  return prisma.service.update({
    where: { id },
    data: { isActive },
  });
}

export async function getPrimaryBarberId() {
  const barber = await prisma.barber.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  if (!barber) throw new Error("No hay barbero configurado");
  return barber;
}

export type DayHoursInput = {
  dayOfWeek: number;
  isClosed: boolean;
  morningOpen: string;
  morningClose: string;
  afternoonOpen: string;
  afternoonClose: string;
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function assertTime(value: string, label: string) {
  if (!TIME_RE.test(value)) {
    throw new Error(`${label} inválida (${value})`);
  }
}

export async function getAdminBusinessHours() {
  const barber = await getPrimaryBarberId();
  const rows = await prisma.businessHours.findMany({
    where: { barberId: barber.id },
    orderBy: [{ dayOfWeek: "asc" }, { openTime: "asc" }],
  });

  const days: DayHoursInput[] = [];
  for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek += 1) {
    const dayRows = rows.filter((r) => r.dayOfWeek === dayOfWeek);
    const closed = dayRows.length === 0 || dayRows.every((r) => r.isClosed);
    const openRows = dayRows
      .filter((r) => !r.isClosed)
      .sort((a, b) => a.openTime.localeCompare(b.openTime));

    days.push({
      dayOfWeek,
      isClosed: closed,
      morningOpen: openRows[0]?.openTime ?? "09:00",
      morningClose: openRows[0]?.closeTime ?? "12:00",
      afternoonOpen: openRows[1]?.openTime ?? "13:00",
      afternoonClose: openRows[1]?.closeTime ?? "20:00",
    });
  }

  return { barber, days };
}

export async function saveAdminBusinessHours(days: DayHoursInput[]) {
  if (days.length !== 7) {
    throw new Error("Debés enviar los 7 días de la semana");
  }

  const barber = await getPrimaryBarberId();

  const payload: Array<{
    barberId: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }> = [];

  for (const day of days) {
    if (day.dayOfWeek < 0 || day.dayOfWeek > 6) {
      throw new Error("Día inválido");
    }

    if (day.isClosed) {
      payload.push({
        barberId: barber.id,
        dayOfWeek: day.dayOfWeek,
        openTime: "00:00",
        closeTime: "00:00",
        isClosed: true,
      });
      continue;
    }

    assertTime(day.morningOpen, "Apertura mañana");
    assertTime(day.morningClose, "Cierre mañana");
    assertTime(day.afternoonOpen, "Apertura tarde");
    assertTime(day.afternoonClose, "Cierre tarde");

    if (day.morningOpen >= day.morningClose) {
      throw new Error("La mañana debe abrir antes de cerrar");
    }
    if (day.afternoonOpen >= day.afternoonClose) {
      throw new Error("La tarde debe abrir antes de cerrar");
    }
    if (day.morningClose > day.afternoonOpen) {
      throw new Error("El almuerzo queda mal: la mañana se solapa con la tarde");
    }

    payload.push(
      {
        barberId: barber.id,
        dayOfWeek: day.dayOfWeek,
        openTime: day.morningOpen,
        closeTime: day.morningClose,
        isClosed: false,
      },
      {
        barberId: barber.id,
        dayOfWeek: day.dayOfWeek,
        openTime: day.afternoonOpen,
        closeTime: day.afternoonClose,
        isClosed: false,
      },
    );
  }

  await prisma.$transaction([
    prisma.businessHours.deleteMany({ where: { barberId: barber.id } }),
    prisma.businessHours.createMany({ data: payload }),
  ]);

  return getAdminBusinessHours();
}
