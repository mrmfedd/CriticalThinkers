"use client";

import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { formatPrice, type Product } from "@/lib/products";

export function ProductsList({ products }: { products: Product[] }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AdminHeader
        title="Products"
        description="Add, edit, or remove every item in the shop. Photos, prices, colors, and copy all live in the database."
      />

      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/products/new"
          className="rounded bg-flagRed px-5 py-2 font-display text-xs tracking-[0.14em] text-white uppercase"
        >
          Add product
        </Link>
      </div>

      <div className="overflow-x-auto rounded-md border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-black/50 text-xs tracking-[0.14em] text-steel uppercase">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.slug} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt=""
                      className="h-12 w-12 rounded-sm border border-white/10 object-cover"
                    />
                    <div>
                      <p className="text-white">{product.name}</p>
                      <p className="text-xs text-steel">{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-steel">{product.category}</td>
                <td className="px-4 py-3 text-white">{formatPrice(product.price)}</td>
                <td className="px-4 py-3 text-steel">{product.featured ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/products/${product.slug}`}
                    className="font-display text-xs tracking-[0.14em] text-white uppercase hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
