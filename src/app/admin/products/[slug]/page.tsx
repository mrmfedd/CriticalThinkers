import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { getProduct } from "@/lib/cms";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return {
    title: product?.name ?? "Product",
    robots: { index: false, follow: false },
  };
}

export default async function AdminProductPage({ params }: Props) {
  if (!(await isAdmin())) {
    return <AdminLoginForm />;
  }

  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return <ProductEditor initial={product} />;
}
