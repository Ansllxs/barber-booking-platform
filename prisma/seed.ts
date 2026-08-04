import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SERVICES = [
  {
    name: "Corte",
    slug: "corte",
    description: "Corte de cabello premium.",
    includes: [] as string[],
    priceCrc: 5000,
    durationMinutes: 45,
    sortOrder: 1,
  },
  {
    name: "Barba",
    slug: "barba",
    description: "Arreglo y perfilado de barba.",
    includes: [],
    priceCrc: 3000,
    durationMinutes: 30,
    sortOrder: 2,
  },
  {
    name: "Cejas",
    slug: "cejas",
    description: "Diseño y perfilado de cejas.",
    includes: [],
    priceCrc: 2000,
    durationMinutes: 10,
    sortOrder: 3,
  },
  {
    name: "Corte + Barba + Cejas",
    slug: "corte-barba-cejas",
    description: "Combo completo de corte, barba y cejas.",
    includes: ["Corte", "Barba", "Cejas"],
    priceCrc: 7000,
    durationMinutes: 70,
    sortOrder: 4,
  },
  {
    name: "Cubrimiento de Canas",
    slug: "cubrimiento-de-canas",
    description: "Tratamiento para cubrimiento de canas.",
    includes: [],
    priceCrc: 12000,
    durationMinutes: 60,
    sortOrder: 5,
  },
  {
    name: "Hidratación Capilar",
    slug: "hidratacion-capilar",
    description: "Tratamiento de hidratación profunda para el cabello.",
    includes: [],
    priceCrc: 15000,
    durationMinutes: 60,
    sortOrder: 6,
  },
  {
    name: "Mechas",
    slug: "mechas",
    description: "Servicio de mechas profesional.",
    includes: [],
    priceCrc: 30000,
    durationMinutes: 180,
    sortOrder: 7,
  },
  {
    name: "Paquete 1",
    slug: "paquete-1",
    description: "Experiencia premium de cuidado personal.",
    includes: [
      "Corte",
      "Exfoliación facial",
      "Hidratación",
      "Vaporizador de ozono",
      "Toalla caliente",
      "Masaje facial",
      "Lavado de cabello",
      "Peinado profesional",
    ],
    priceCrc: 9000,
    durationMinutes: 75,
    sortOrder: 8,
  },
  {
    name: "Paquete 2",
    slug: "paquete-2",
    description: "Todo lo del Paquete 1 más ritual de barba y cejas.",
    includes: [
      "Todo lo del Paquete 1",
      "Ritual de barba",
      "Cejas",
    ],
    priceCrc: 12000,
    durationMinutes: 105,
    sortOrder: 9,
  },
  {
    name: "Paquete 3 - Ritual de Barba",
    slug: "paquete-3-ritual-de-barba",
    description: "Ritual completo de barba.",
    includes: ["Ritual de barba"],
    priceCrc: 5000,
    durationMinutes: 45,
    sortOrder: 10,
  },
] as const;

/** Monday–Saturday: 09:00–12:00 and 13:00–20:00 (lunch 12:00–13:00) */
const WORK_DAYS = [1, 2, 3, 4, 5, 6] as const;
const DAY_SEGMENTS = [
  { openTime: "09:00", closeTime: "12:00" },
  { openTime: "13:00", closeTime: "20:00" },
] as const;

async function main() {
  console.log("Seeding COELI BARBER CLUB...");

  await prisma.settings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      businessName: "COELI BARBER CLUB",
      timezone: "America/Costa_Rica",
      phone: "+50671936588",
      mapsUrl: "https://maps.app.goo.gl/pHUVWPaKvmfoYpyJ7?g_st=ic",
      bufferMinutes: 0,
      slotIntervalMinutes: 30,
      lastAppointmentStartTime: "19:00",
      reminderMinutesBefore: 60,
      bookingLeadMinutes: 0,
      maxAdvanceDays: 60,
    },
    update: {
      businessName: "COELI BARBER CLUB",
      timezone: "America/Costa_Rica",
      phone: "+50671936588",
      mapsUrl: "https://maps.app.goo.gl/pHUVWPaKvmfoYpyJ7?g_st=ic",
      bufferMinutes: 0,
      slotIntervalMinutes: 30,
      lastAppointmentStartTime: "19:00",
    },
  });

  // Prefer renaming existing barber (legacy slug "jairo") to Kaled Barrantes
  const existing =
    (await prisma.barber.findUnique({ where: { slug: "kaled-barrantes" } })) ??
    (await prisma.barber.findUnique({ where: { slug: "jairo" } })) ??
    (await prisma.barber.findFirst({ orderBy: { sortOrder: "asc" } }));

  const barber = existing
    ? await prisma.barber.update({
        where: { id: existing.id },
        data: {
          name: "Kaled Barrantes",
          slug: "kaled-barrantes",
          phone: "+50671936588",
          bio: "Barbero principal de COELI BARBER CLUB.",
          isActive: true,
          sortOrder: 1,
        },
      })
    : await prisma.barber.create({
        data: {
          name: "Kaled Barrantes",
          slug: "kaled-barrantes",
          phone: "+50671936588",
          bio: "Barbero principal de COELI BARBER CLUB.",
          isActive: true,
          sortOrder: 1,
        },
      });

  await prisma.businessHours.deleteMany({ where: { barberId: barber.id } });

  await prisma.businessHours.createMany({
    data: WORK_DAYS.flatMap((dayOfWeek) =>
      DAY_SEGMENTS.map((segment) => ({
        barberId: barber.id,
        dayOfWeek,
        openTime: segment.openTime,
        closeTime: segment.closeTime,
        isClosed: false,
      })),
    ),
  });

  // Sunday closed marker (optional explicit row)
  await prisma.businessHours.create({
    data: {
      barberId: barber.id,
      dayOfWeek: 0,
      openTime: "00:00",
      closeTime: "00:00",
      isClosed: true,
    },
  });

  for (const service of SERVICES) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      create: {
        ...service,
        includes: [...service.includes],
        isActive: true,
      },
      update: {
        name: service.name,
        description: service.description,
        includes: [...service.includes],
        priceCrc: service.priceCrc,
        durationMinutes: service.durationMinutes,
        sortOrder: service.sortOrder,
        isActive: true,
      },
    });
  }

  console.log("Seed completed.");
  console.log(`Barber: ${barber.name} (${barber.id})`);

  // Second barber — Dorian (9:00–12:00 + 13:00–17:00)
  const DORIAN_SEGMENTS = [
    { openTime: "09:00", closeTime: "12:00" },
    { openTime: "13:00", closeTime: "17:00" },
  ] as const;

  const dorian =
    (await prisma.barber.findUnique({ where: { slug: "dorian" } })) ??
    (await prisma.barber.create({
      data: {
        name: "Dorian",
        slug: "dorian",
        bio: "Barbero de COELI BARBER CLUB.",
        isActive: true,
        sortOrder: 2,
      },
    }));

  await prisma.barber.update({
    where: { id: dorian.id },
    data: {
      name: "Dorian",
      slug: "dorian",
      bio: "Barbero de COELI BARBER CLUB.",
      isActive: true,
      sortOrder: 2,
    },
  });

  await prisma.businessHours.deleteMany({ where: { barberId: dorian.id } });
  await prisma.businessHours.createMany({
    data: WORK_DAYS.flatMap((dayOfWeek) =>
      DORIAN_SEGMENTS.map((segment) => ({
        barberId: dorian.id,
        dayOfWeek,
        openTime: segment.openTime,
        closeTime: segment.closeTime,
        isClosed: false,
      })),
    ),
  });
  await prisma.businessHours.create({
    data: {
      barberId: dorian.id,
      dayOfWeek: 0,
      openTime: "00:00",
      closeTime: "00:00",
      isClosed: true,
    },
  });

  console.log(`Barber: Dorian (${dorian.id}) · 9:00–17:00`);
  console.log(`Services: ${SERVICES.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
