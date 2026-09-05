import type { Product } from "@/lib/products";

export const TEE_PRICE = 24.99;
export const FLAT_SHIPPING = 6.5;
const LEGACY_TEE_PRICE = 32;

export function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function flatShipping(hasItems: boolean) {
  return hasItems ? FLAT_SHIPPING : 0;
}

export function withShipping(subtotal: number, hasItems = subtotal > 0) {
  const shipping = flatShipping(hasItems);
  return {
    subtotal: roundMoney(subtotal),
    shipping,
    total: roundMoney(subtotal + shipping),
  };
}

export function migrateLegacyTeePrices(products: Product[]) {
  let changed = false;
  const next = products.map((product) => {
    if (product.price !== LEGACY_TEE_PRICE) return product;
    changed = true;
    return { ...product, price: TEE_PRICE };
  });
  return changed ? next : products;
}
