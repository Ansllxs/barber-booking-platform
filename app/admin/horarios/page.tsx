import type { Metadata } from "next";
import { requireAdmin } from "@/actions/admin";
import { getAdminBusinessHours } from "@/services/admin-config.service";
import { AdminHoursPanel } from "@/features/admin/components/admin-hours-panel";

export const metadata: Metadata = {
  title: "Horarios — Admin COELI",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminHoursPage() {
  await requireAdmin();
  const { barber, days } = await getAdminBusinessHours();

  return (
    <main className="bg-luxury min-h-dvh">
      <AdminHoursPanel barberName={barber.name} initialDays={days} />
    </main>
  );
}
