"use client";

import { useMemo, useState } from "react";
import { formatPrice, type Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export function ShopGrid({ items }: { items: Product[] }) {
  const categories = useMemo(
    () =>
      [...new Set(items.map((product) => product.category))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [items],
  );
  const filters = categories.length > 1 ? ["All", ...categories] : [];
  const [filter, setFilter] = useState("All");
  const visible = useMemo(
    () =>
      !filter || filter === "All"
        ? items
        : items.filter((product) => product.category === filter),
    [filter, items],
  );

  return (
    <div>
      {filters.length > 0 ? (
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
      ) : null}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
