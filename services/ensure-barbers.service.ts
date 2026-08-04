import { prisma } from "@/lib/prisma";

const WORK_DAYS = [1, 2, 3, 4, 5, 6] as const;

const DORIAN_SEGMENTS = [
  { openTime: "09:00", closeTime: "12:00" },
  { openTime: "13:00", closeTime: "17:00" },
] as const;

/**
 * Ensures Dorian exists with default Mon–Sat 9–5 (lunch 12–13).
 * Safe to call repeatedly — does not overwrite existing hours.
 */
export async function ensureDorianBarber() {
  const existing = await prisma.barber.findUnique({
    where: { slug: "dorian" },
    select: { id: true, name: true, slug: true, isActive: true },
  });

  if (existing) {
    if (!existing.isActive || existing.name !== "Dorian") {
      await prisma.barber.update({
        where: { id: existing.id },
        data: { name: "Dorian", isActive: true, sortOrder: 2 },
      });
    }
    return existing;
  }

  const dorian = await prisma.barber.create({
    data: {
      name: "Dorian",
      slug: "dorian",
      bio: "Barbero de COELI BARBER CLUB.",
      isActive: true,
      sortOrder: 2,
    },
  });

  await prisma.businessHours.createMany({
    data: [
      ...WORK_DAYS.flatMap((dayOfWeek) =>
        DORIAN_SEGMENTS.map((segment) => ({
          barberId: dorian.id,
          dayOfWeek,
          openTime: segment.openTime,
          closeTime: segment.closeTime,
          isClosed: false,
        })),
      ),
      {
        barberId: dorian.id,
        dayOfWeek: 0,
        openTime: "00:00",
        closeTime: "00:00",
        isClosed: true,
      },
    ],
  });

  return dorian;
}
