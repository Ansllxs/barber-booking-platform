import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const barber =
    (await prisma.barber.findUnique({ where: { slug: "jairo" } })) ??
    (await prisma.barber.findUnique({ where: { slug: "kaled-barrantes" } })) ??
    (await prisma.barber.findFirst({ orderBy: { sortOrder: "asc" } }));

  if (!barber) {
    throw new Error("No barber found to rename");
  }

  const updated = await prisma.barber.update({
    where: { id: barber.id },
    data: {
      name: "Kaled Barrantes",
      slug: "kaled-barrantes",
      bio: "Barbero principal de COELI BARBER CLUB.",
    },
  });

  console.log("Barber updated:", updated.name, updated.slug);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
