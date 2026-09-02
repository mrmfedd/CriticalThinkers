"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatPrice, type Product } from "@/lib/products";
import { GarmentPreview } from "@/components/GarmentPreview";
import { Modal } from "@/components/Modal";

export function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [addedOpen, setAddedOpen] = useState(false);

  const total = useMemo(
    () => product.price * quantity,
    [product.price, quantity],
  );

  function addToCart() {
    addItem(
      {
        slug: product.slug,
        name: product.name,
        image: product.image,
        price: product.price,
        size,
        color,
      },
      quantity,
    );
    setAddedOpen(true);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <GarmentPreview
        image={product.image}
        alt={`${product.name} in ${color.name}`}
        color={color.hex}
        blendMode={product.blendMode}
        className="rounded-md border border-white/10"
      />
      <div>
        <p className="text-xs tracking-[0.22em] text-flagRed uppercase">
          {product.category}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-wide text-white md:text-5xl">
          {product.name}
        </h1>
        <p className="mt-4 font-display text-3xl text-chrome">
          {formatPrice(product.price)}
        </p>
        <p className="mt-5 max-w-xl text-base leading-7 text-steel">
          {product.description}
        </p>

        <fieldset className="mt-8">
          <legend className="font-display text-sm tracking-[0.16em] text-white uppercase">
            Color: {color.name}
          </legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {product.colors.map((option) => {
              const selected = option.name === color.name;
              return (
                <button
                  key={option.name}
                  type="button"
                  aria-label={option.name}
                  aria-pressed={selected}
                  onClick={() => setColor(option)}
                  className={`h-9 w-9 rounded-full border ${
                    selected ? "border-white ring-2 ring-flagRed" : "border-white/30"
                  }`}
                  style={{ backgroundColor: option.hex }}
                />
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="font-display text-sm tracking-[0.16em] text-white uppercase">
            Size
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((option) => {
              const selected = option === size;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSize(option)}
                  className={`min-w-12 rounded border px-3 py-2 text-sm ${
                    selected
                      ? "border-white bg-white text-ink"
                      : "border-white/20 text-chrome hover:border-white"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-6 flex items-center gap-4">
          <label className="text-sm text-steel" htmlFor="qty">
            Qty
          </label>
          <input
            id="qty"
            type="number"
            min={1}
            max={12}
            value={quantity}
            onChange={(event) =>
              setQuantity(Math.max(1, Number(event.target.value) || 1))
            }
            className="w-20 rounded border border-white/20 bg-black px-3 py-2 text-white"
          />
        </div>

        <button
          type="button"
          onClick={addToCart}
          className="mt-8 w-full rounded bg-flagRed px-6 py-4 font-display tracking-[0.18em] text-white uppercase hover:bg-red-700"
        >
          Add to cart · {formatPrice(total)}
        </button>

        <ul className="mt-8 grid gap-2 text-sm text-steel">
          {product.details.map((detail) => (
            <li key={detail}>★ {detail}</li>
          ))}
        </ul>
      </div>

      <Modal
        open={addedOpen}
        title="Added to cart"
        onClose={() => setAddedOpen(false)}
      >
        <p className="text-steel">
          {quantity} × {product.name} ({color.name}, {size}) is in your cart.
        </p>
        <div className="mt-6 flex gap-3">
          <a
            href="/cart"
            className="flex-1 rounded bg-flagRed px-4 py-3 text-center font-display tracking-[0.12em] text-white uppercase"
          >
            View cart
          </a>
          <button
            type="button"
            onClick={() => setAddedOpen(false)}
            className="flex-1 rounded border border-white/20 px-4 py-3 font-display tracking-[0.12em] uppercase"
          >
            Keep shopping
          </button>
        </div>
      </Modal>
    </div>
  );
}
