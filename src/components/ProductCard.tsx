"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice, imageFor, type Product } from "@/lib/products";
import { GarmentPreview } from "@/components/GarmentPreview";

export function ProductCard({ product }: { product: Product }) {
  const [color, setColor] = useState(product.colors[0]);

  return (
    <article className="group overflow-hidden rounded-md border border-white/10 bg-black/40">
      <Link href={`/shop/${product.slug}`} className="block">
        <GarmentPreview
          image={imageFor(product, color.name)}
          alt={product.name}
          color={color.hex}
          blendMode={product.blendMode}
        />
      </Link>
      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-flagRed uppercase">
              {product.category}
            </p>
            <Link href={`/shop/${product.slug}`}>
              <h3 className="mt-1 font-display text-lg tracking-wide text-white">
                {product.name}
              </h3>
            </Link>
          </div>
          <p className="font-display text-lg text-chrome">{formatPrice(product.price)}</p>
        </div>
        {product.colors.length > 1 ? (
          <div className="flex flex-wrap gap-2" role="list" aria-label="Colors">
            {product.colors.map((option) => {
              const selected = option.name === color.name;
              return (
                <button
                  key={option.name}
                  type="button"
                  role="listitem"
                  aria-label={option.name}
                  aria-pressed={selected}
                  onClick={() => setColor(option)}
                  className={`h-6 w-6 rounded-full border ${
                    selected ? "border-white ring-2 ring-flagRed" : "border-white/30"
                  }`}
                  style={{ backgroundColor: option.hex }}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </article>
  );
}
