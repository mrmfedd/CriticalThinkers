import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin-auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { ProductsList } from "@/components/admin/ProductsList";
import { getCatalog } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  if (!(await isAdmin())) {
    return <AdminLoginForm />;
  }

  return <ProductsList products={await getCatalog()} />;
}
