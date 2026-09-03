import { designTees } from "@/lib/design-tees";

export type ProductCategory = "T-shirts";

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
  blendMode?: "multiply" | "color-burn";
};

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
