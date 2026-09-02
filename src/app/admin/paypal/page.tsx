import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin-auth";
import { getPayPalAdminView } from "@/lib/paypal";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { PayPalConnectForm } from "@/components/admin/PayPalConnectForm";

export const metadata: Metadata = {
  title: "PayPal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPayPalPage() {
  if (!(await isAdmin())) {
    return <AdminLoginForm />;
  }

  return <PayPalConnectForm initial={getPayPalAdminView()} />;
}
