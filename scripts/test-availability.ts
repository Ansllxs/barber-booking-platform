import "dotenv/config";
import { prisma } from "../lib/prisma";
import { getAvailableSlots } from "../services/availability.service";

async function main() {
  const barber = await prisma.barber.findFirst();
  const service = await prisma.service.findFirst({ where: { slug: "corte" } });

  if (!barber || !service) {
    throw new Error("Missing seed data");
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
  }).format(new Date());

  console.log({ barber: barber.name, service: service.name, today });

  const slots = await getAvailableSlots({
    barberId: barber.id,
    serviceId: service.id,
    date: today,
  });

  console.log("slots", slots.length);
  console.log(slots.slice(0, 8));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
