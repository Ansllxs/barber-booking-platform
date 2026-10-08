import { prisma } from "@/lib/prisma";

/**
 * Hides Dorian from booking and admin hours without deleting past appointments.
 */
export async function deactivateDorianBarber() {
  const existing = await prisma.barber.findUnique({
    where: { slug: "dorian" },
    select: { id: true, isActive: true },
  });

  if (!existing?.isActive) return existing;

  return prisma.barber.update({
    where: { id: existing.id },
    data: { isActive: false },
  });
}
