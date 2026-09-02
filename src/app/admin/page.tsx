import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin-auth";
import {
  defaultBrandImages,
  getBrandImages,
  getCatalog,
} from "@/lib/image-store";
import { products } from "@/lib/products";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { ImageControlPanel } from "@/components/admin/ImageControlPanel";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return <AdminLoginForm />;
  }

  return (
    <ImageControlPanel
      products={getCatalog()}
      brand={getBrandImages()}
      originals={{
        brand: { ...defaultBrandImages },
        products: Object.fromEntries(
          products.map((product) => [product.slug, product.image]),
        ),
      }}
    />
  );
}
