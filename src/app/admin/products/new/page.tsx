import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin-auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { emptyProduct, probeCms } from "@/lib/cms";

export const metadata: Metadata = {
  title: "New product",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  if (!(await isAdmin())) {
    return <AdminLoginForm />;
  }

  const cms = await probeCms();
  return <ProductEditor initial={emptyProduct()} isNew source={cms.source} />;
}
