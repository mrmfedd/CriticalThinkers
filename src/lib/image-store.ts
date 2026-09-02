import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { products as catalog, type Product } from "@/lib/products";

export type BrandKey = "logo" | "hero";

export type ImageStore = {
  brand: Partial<Record<BrandKey, string>>;
  products: Record<string, string>;
};

const STORE_PATH = path.join(process.cwd(), "data", "images.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export const defaultBrandImages = {
  logo: "/brand/logo.jpg",
  hero: "/products/hero-flag.png",
} as const;

const emptyStore: ImageStore = { brand: {}, products: {} };

export function readImageStore(): ImageStore {
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as ImageStore;
    return {
      brand: parsed.brand ?? {},
      products: parsed.products ?? {},
    };
  } catch {
    return emptyStore;
  }
}

function writeImageStore(store: ImageStore) {
  mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`);
}

function revalidateStorefront() {
  revalidatePath("/", "layout");
  revalidatePath("/shop");
  revalidatePath("/about");
  revalidatePath("/admin");
  for (const product of catalog) {
    revalidatePath(`/shop/${product.slug}`);
  }
}

export function getBrandImages() {
  const store = readImageStore();
  return {
    logo: store.brand.logo || defaultBrandImages.logo,
    hero: store.brand.hero || defaultBrandImages.hero,
  };
}

export function getCatalog(): Product[] {
  const store = readImageStore();
  return catalog.map((product) => ({
    ...product,
    image: store.products[product.slug] || product.image,
  }));
}

export function getProduct(slug: string) {
  return getCatalog().find((product) => product.slug === slug);
}

export function getFeaturedProducts() {
  return getCatalog().filter((product) => product.featured);
}

export function originalImageFor(kind: "brand" | "product", key: string) {
  if (kind === "brand" && (key === "logo" || key === "hero")) {
    return defaultBrandImages[key];
  }
  return catalog.find((product) => product.slug === key)?.image ?? "";
}

export function isCustomImage(kind: "brand" | "product", key: string, current: string) {
  return current !== originalImageFor(kind, key);
}

function extensionFor(type: string, filename: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  const fromName = filename.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  return null;
}

function safeKey(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

function publicPathFromDisk(filePath: string) {
  const relative = path.relative(path.join(process.cwd(), "public"), filePath);
  return `/${relative.split(path.sep).join("/")}`;
}

function tryDeleteUpload(publicPath: string) {
  if (!publicPath.startsWith("/uploads/")) return;
  const disk = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  try {
    unlinkSync(disk);
  } catch {
    // The previous file may already be gone.
  }
}

export async function saveUploadedImage(options: {
  kind: "brand" | "product";
  key: string;
  file: File;
}) {
  const { kind, key, file } = options;
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type) && !extensionFor(file.type, file.name)) {
    throw new Error("Use a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Images must be 8MB or smaller.");
  }

  const slug = safeKey(key);
  if (!slug) throw new Error("Missing image target.");
  if (kind === "product" && !catalog.some((product) => product.slug === slug)) {
    throw new Error("Unknown product.");
  }
  if (kind === "brand" && slug !== "logo" && slug !== "hero") {
    throw new Error("Unknown brand image.");
  }

  const ext = extensionFor(file.type, file.name);
  if (!ext) throw new Error("Use a JPEG, PNG, WebP, or GIF image.");

  mkdirSync(UPLOAD_DIR, { recursive: true });
  const filename = `${kind}-${slug}-${Date.now()}.${ext}`;
  const diskPath = path.join(UPLOAD_DIR, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  writeFileSync(diskPath, bytes);

  const store = readImageStore();
  const previous =
    kind === "brand"
      ? store.brand[slug as BrandKey]
      : store.products[slug];
  const nextPath = publicPathFromDisk(diskPath);

  if (kind === "brand") {
    store.brand[slug as BrandKey] = nextPath;
  } else {
    store.products[slug] = nextPath;
  }

  writeImageStore(store);
  if (previous) tryDeleteUpload(previous);
  revalidateStorefront();
  return nextPath;
}

export function revertImage(kind: "brand" | "product", key: string) {
  const store = readImageStore();
  const previous =
    kind === "brand"
      ? store.brand[key as BrandKey]
      : store.products[key];

  if (kind === "brand") {
    delete store.brand[key as BrandKey];
  } else {
    delete store.products[key];
  }

  writeImageStore(store);
  if (previous) tryDeleteUpload(previous);
  revalidateStorefront();
  return originalImageFor(kind, key);
}
