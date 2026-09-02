import type { Metadata } from "next";
import { ShopGrid } from "@/components/ShopGrid";
import { getCatalog } from "@/lib/image-store";

export const metadata: Metadata = {
  title: "Shop",
};

export default function ShopPage() {
  return (
    <div>
      <p className="text-xs tracking-[0.22em] text-flagRed uppercase">Store</p>
      <h1 className="mt-2 font-display text-5xl text-white">Shop</h1>
      <p className="mt-3 max-w-2xl text-steel">
        Apparel, drinkware, and accessories from the Make America Think Again
        collection.
      </p>
      <div className="mt-10">
        <ShopGrid items={getCatalog()} />
      </div>
    </div>
  );
}
