import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin-auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { OrdersPanel } from "@/components/admin/OrdersPanel";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  if (!(await isAdmin())) {
    return <AdminLoginForm />;
  }

  return <OrdersPanel />;
}
