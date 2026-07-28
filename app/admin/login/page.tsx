import { AdminPinLogin } from "@/features/admin/components/admin-pin-login";

export const metadata = {
  title: "Login admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <AdminPinLogin />;
}
