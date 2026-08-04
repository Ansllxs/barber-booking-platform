import type { Metadata } from "next";
import { requireAdmin } from "@/actions/admin";
import { getAdminBusinessHours } from "@/services/admin-config.service";
import { AdminHoursPanel } from "@/features/admin/components/admin-hours-panel";

export const metadata: Metadata = {
  title: "Horarios — Admin COELI",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ barber?: string }>;
};

export default async function AdminHoursPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const { barber, barbers, days } = await getAdminBusinessHours(params.barber);

  return (
    <main className="bg-luxury min-h-dvh">
      <AdminHoursPanel
        barbers={barbers}
        selectedBarberId={barber.id}
        initialDays={days}
      />
    </main>
  );
}
