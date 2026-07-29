import type { Metadata } from "next";
import { requireAdmin } from "@/actions/admin";
import { listAdminServices } from "@/services/admin-config.service";
import { AdminServicesPanel } from "@/features/admin/components/admin-services-panel";

export const metadata: Metadata = {
  title: "Servicios — Admin COELI",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  await requireAdmin();
  const services = await listAdminServices();

  return (
    <main className="bg-luxury min-h-dvh">
      <AdminServicesPanel
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          includes: s.includes,
          priceCrc: s.priceCrc,
          durationMinutes: s.durationMinutes,
          isActive: s.isActive,
          sortOrder: s.sortOrder,
        }))}
      />
    </main>
  );
}
