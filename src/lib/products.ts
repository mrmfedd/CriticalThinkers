import { designTees } from "@/lib/design-tees";

export type ProductCategory = string;

export type ProductColor = {
  name: string;
  hex: string;
};

export type ProductViews = {
  front: string;
  back: string;
};

export type Product = {
  slug: string;
  name: string;
  price: number;
  category: ProductCategory;
  image: string;
  description: string;
  details: string[];
  sizes: string[];
  colors: ProductColor[];
  views?: Record<string, ProductViews>;
  featured?: boolean;
  sortOrder?: number;
  blendMode?: "multiply" | "color-burn";
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function imageFor(
  product: Product,
  colorName = product.colors[0]?.name,
  view: keyof ProductViews = "front",
) {
  return product.views?.[colorName]?.[view] || product.image;
}

export const products: Product[] = designTees;

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getFeaturedProducts() {
  return products.filter((product) => product.featured);
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
