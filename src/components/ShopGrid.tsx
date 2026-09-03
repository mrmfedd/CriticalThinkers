"use client";

import { useMemo, useState } from "react";
import { products, type Product, type ProductCategory } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

const filters: Array<"All" | ProductCategory> = [
  "All",
  "T-shirts",
  "Apparel",
  "Accessories",
  "Drinkware",
];

export function ShopGrid({ items = products }: { items?: Product[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const visible = useMemo(
    () =>
      filter === "All"
        ? items
        : items.filter((product) => product.category === filter),
    [filter, items],
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {filters.map((option) => {
          const selected = option === filter;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(option)}
              className={`rounded border px-4 py-2 font-display text-sm tracking-[0.14em] uppercase ${
                selected
                  ? "border-white bg-white text-ink"
                  : "border-white/20 text-steel hover:border-white"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
