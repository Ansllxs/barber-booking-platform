import type { Metadata } from "next";
import { requireAdmin, getAdminDayAction } from "@/actions/admin";
import { AdminDayBoard } from "@/features/admin/components/admin-day-board";
import { todayYmd } from "@/services/admin-appointments.service";

export const metadata: Metadata = {
  title: "Agenda — COELI",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ date?: string }>;
};

export default async function AdminPage({ searchParams }: Props) {
  await requireAdmin();

  const params = await searchParams;
  const date =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : todayYmd();

  const result = await getAdminDayAction(date);

  if (!result.success) {
    return (
      <main className="bg-luxury flex min-h-dvh items-center justify-center px-4">
        <p className="text-danger">{result.error}</p>
      </main>
    );
  }

  const { appointments, ...stats } = result.data;

  return (
    <main className="bg-luxury min-h-dvh">
      <AdminDayBoard
        date={stats.date}
        total={stats.total}
        upcoming={stats.upcoming}
        completed={stats.completed}
        revenueCrc={stats.revenueCrc}
        appointments={appointments.map((a) => ({
          id: a.id,
          customerName: a.customerName,
          customerPhone: a.customerPhone,
          startAt: a.startAt.toISOString(),
          endAt: a.endAt.toISOString(),
          status: a.status,
          notes: a.notes,
          service: a.service,
          barber: a.barber,
        }))}
      />
    </main>
  );
}
