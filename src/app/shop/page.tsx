import type { Metadata } from "next";
import { ShopGrid } from "@/components/ShopGrid";
import { getCatalog, getSiteSettings } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Shop",
};

export default async function ShopPage() {
  const [items, site] = await Promise.all([getCatalog(), getSiteSettings()]);

  return (
    <div>
      <p className="text-xs tracking-[0.22em] text-flagRed uppercase">Store</p>
      <h1 className="mt-2 font-display text-5xl text-white">{site.shopHeading}</h1>
      <p className="mt-3 max-w-2xl text-steel">{site.shopIntro}</p>
      <div className="mt-10">
        <ShopGrid items={items} />
      </div>
    </div>
  );
}
