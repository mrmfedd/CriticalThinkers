import type { Metadata } from "next";
import { isAdmin, isOwner } from "@/lib/admin-auth";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
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
  if (!(await isOwner())) {
    return <AdminAccessDenied area="PayPal settings" />;
  }

  return <PayPalConnectForm initial={getPayPalAdminView()} />;
}
