import { cache } from "react";
import { revalidatePath } from "next/cache";
import { designTees } from "@/lib/design-tees";
import { contactHrefs, site } from "@/lib/site";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { TEE_PRICE, migrateLegacyTeePrices } from "@/lib/commerce";
import { slugify, type Product, type ProductColor, type ProductViews } from "@/lib/products";

export type SiteSettings = {
  name: string;
  tagline: string;
  owner: string;
  email: string;
  phone: string;
  phoneDisplay: string;
  url: string;
  heroKicker: string;
  heroHeadline: string;
  heroSubhead: string;
  heroCta: string;
  featuredHeading: string;
  featuredLabel: string;
  homeStoryHeading: string;
  homeStoryBody: string;
  footerBlurb: string;
  shopHeading: string;
  shopIntro: string;
  aboutKicker: string;
  aboutHeading: string;
  aboutBody: string;
  aboutBody2: string;
  contactKicker: string;
  contactHeading: string;
  contactIntro: string;
  logoUrl: string;
  heroUrl: string;
  metaDescription: string;
};

export type PublicSite = SiteSettings & {
  emailHref: string;
  phoneHref: string;
};

export type CmsSource = "postgres" | "storage" | "fallback";

export type CmsStatus = {
  connected: boolean;
  source: CmsSource;
  tables: boolean;
  storage: boolean;
  productCount: number;
  error?: string;
};

type SiteSettingsRow = {
  id: string;
  name: string;
  tagline: string;
  owner: string;
  email: string;
  phone: string;
  phone_display: string;
  url: string;
  hero_kicker: string;
  hero_headline: string;
  hero_subhead: string;
  hero_cta: string;
  featured_heading: string;
  featured_label: string;
  home_story_heading: string;
  home_story_body: string;
  footer_blurb: string;
  shop_heading: string;
  shop_intro: string;
  about_kicker: string;
  about_heading: string;
  about_body: string;
  about_body_2: string;
  contact_kicker: string;
  contact_heading: string;
  contact_intro: string;
  logo_url: string;
  hero_url: string;
  meta_description: string;
};

type ShopProductRow = {
  slug: string;
  name: string;
  price: number | string;
  category: string;
  description: string;
  details: unknown;
  sizes: unknown;
  colors: unknown;
  views: unknown;
  image: string;
  featured: boolean;
  sort_order: number;
  blend_mode: string | null;
};

const SETTINGS_ID = "main";
const MEDIA_BUCKET = "media";
const CMS_BUCKET = "cms";
const SETTINGS_OBJECT = "settings.json";
const PRODUCTS_OBJECT = "products.json";

let seedAttempted = false;

export const defaultSiteSettings: SiteSettings = {
  name: site.name,
  tagline: site.tagline,
  owner: site.owner,
  email: site.email,
  phone: site.phone,
  phoneDisplay: site.phoneDisplay,
  url: site.url,
  heroKicker: site.name,
  heroHeadline: site.tagline,
  heroSubhead: "Gear for citizens who still ask the hard questions.",
  heroCta: "Shop the collection",
  featuredLabel: "Featured",
  featuredHeading: "Wear the argument",
  homeStoryHeading: "A store with a spine",
  homeStoryBody: `${site.name} is not another slogan mill. ${site.owner} built this shop for people who want patriotism with a working brain: read the bill, check the claim, then wear the receipt.`,
  footerBlurb: `${site.tagline}. Gear for citizens who still ask the hard questions.`,
  shopHeading: "Shop",
  shopIntro: "T-shirts from the Make America Think Again collection.",
  aboutKicker: "Mission",
  aboutHeading: site.tagline,
  aboutBody: `${site.name} exists because slogans are easy and thinking is not. ${site.owner} built this shop for people who still read the source, test the claim, and refuse to outsource their judgment.`,
  aboutBody2:
    "The merch is the uniform. The work is the argument. If you want a flag on your chest and a question in your mouth, you are in the right store.",
  contactKicker: "Reach us",
  contactHeading: "Contact",
  contactIntro: `Questions about an order, a wholesale run, or the next drop? Write or call ${site.owner} directly.`,
  logoUrl: "/brand/logo.jpg",
  heroUrl: "/products/hero-flag.png",
  metaDescription: `${site.tagline}. T-shirts from ${site.name}.`,
};

function isMissingTable(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const message = error.message || "";
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /could not find the table/i.test(message) ||
    /relation .* does not exist/i.test(message)
  );
}

function asStringArray(value: unknown, fallback: string[] = []) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : fallback;
}

function asColors(value: unknown, fallback: ProductColor[] = []): ProductColor[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Partial<ProductColor>;
      if (!row.name) return null;
      return { name: String(row.name), hex: String(row.hex || "#111111") };
    })
    .filter((entry): entry is ProductColor => Boolean(entry));
}

function asViews(value: unknown): Record<string, ProductViews> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const views: Record<string, ProductViews> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Partial<ProductViews>;
    views[key] = {
      front: String(row.front || ""),
      back: String(row.back || ""),
    };
  }
  return Object.keys(views).length ? views : undefined;
}

export function withContactLinks(settings: SiteSettings): PublicSite {
  return {
    ...settings,
    ...contactHrefs(settings.email, settings.phone),
  };
}

function text(value: unknown, fallback: string) {
  const next = String(value ?? "").trim();
  return next || fallback;
}

function normalizeSettings(input: Partial<SiteSettings> | null | undefined): SiteSettings {
  const next = { ...defaultSiteSettings, ...(input ?? {}) };
  return {
    name: text(next.name, defaultSiteSettings.name),
    tagline: text(next.tagline, defaultSiteSettings.tagline),
    owner: text(next.owner, defaultSiteSettings.owner),
    email: text(next.email, defaultSiteSettings.email),
    phone: text(next.phone, defaultSiteSettings.phone),
    phoneDisplay: text(next.phoneDisplay, next.phone || defaultSiteSettings.phoneDisplay),
    url: text(next.url, defaultSiteSettings.url),
    heroKicker: String(next.heroKicker ?? ""),
    heroHeadline: String(next.heroHeadline ?? ""),
    heroSubhead: String(next.heroSubhead ?? ""),
    heroCta: String(next.heroCta ?? ""),
    featuredHeading: String(next.featuredHeading ?? ""),
    featuredLabel: String(next.featuredLabel ?? ""),
    homeStoryHeading: String(next.homeStoryHeading ?? ""),
    homeStoryBody: String(next.homeStoryBody ?? ""),
    footerBlurb: String(next.footerBlurb ?? ""),
    shopHeading: String(next.shopHeading ?? ""),
    shopIntro: String(next.shopIntro ?? ""),
    aboutKicker: String(next.aboutKicker ?? ""),
    aboutHeading: String(next.aboutHeading ?? ""),
    aboutBody: String(next.aboutBody ?? ""),
    aboutBody2: String(next.aboutBody2 ?? ""),
    contactKicker: String(next.contactKicker ?? ""),
    contactHeading: String(next.contactHeading ?? ""),
    contactIntro: String(next.contactIntro ?? ""),
    logoUrl: text(next.logoUrl, defaultSiteSettings.logoUrl),
    heroUrl: text(next.heroUrl, defaultSiteSettings.heroUrl),
    metaDescription: String(next.metaDescription ?? ""),
  };
}

function settingsFromRow(row: SiteSettingsRow): SiteSettings {
  return normalizeSettings({
    name: row.name,
    tagline: row.tagline,
    owner: row.owner,
    email: row.email,
    phone: row.phone,
    phoneDisplay: row.phone_display,
    url: row.url,
    heroKicker: row.hero_kicker,
    heroHeadline: row.hero_headline,
    heroSubhead: row.hero_subhead,
    heroCta: row.hero_cta,
    featuredHeading: row.featured_heading,
    featuredLabel: row.featured_label,
    homeStoryHeading: row.home_story_heading,
    homeStoryBody: row.home_story_body,
    footerBlurb: row.footer_blurb,
    shopHeading: row.shop_heading,
    shopIntro: row.shop_intro,
    aboutKicker: row.about_kicker,
    aboutHeading: row.about_heading,
    aboutBody: row.about_body,
    aboutBody2: row.about_body_2,
    contactKicker: row.contact_kicker,
    contactHeading: row.contact_heading,
    contactIntro: row.contact_intro,
    logoUrl: row.logo_url,
    heroUrl: row.hero_url,
    metaDescription: row.meta_description,
  });
}

function rowFromSettings(settings: SiteSettings) {
  return {
    id: SETTINGS_ID,
    name: settings.name,
    tagline: settings.tagline,
    owner: settings.owner,
    email: settings.email,
    phone: settings.phone,
    phone_display: settings.phoneDisplay,
    url: settings.url,
    hero_kicker: settings.heroKicker,
    hero_headline: settings.heroHeadline,
    hero_subhead: settings.heroSubhead,
    hero_cta: settings.heroCta,
    featured_heading: settings.featuredHeading,
    featured_label: settings.featuredLabel,
    home_story_heading: settings.homeStoryHeading,
    home_story_body: settings.homeStoryBody,
    footer_blurb: settings.footerBlurb,
    shop_heading: settings.shopHeading,
    shop_intro: settings.shopIntro,
    about_kicker: settings.aboutKicker,
    about_heading: settings.aboutHeading,
    about_body: settings.aboutBody,
    about_body_2: settings.aboutBody2,
    contact_kicker: settings.contactKicker,
    contact_heading: settings.contactHeading,
    contact_intro: settings.contactIntro,
    logo_url: settings.logoUrl,
    hero_url: settings.heroUrl,
    meta_description: settings.metaDescription,
    updated_at: new Date().toISOString(),
  };
}

function productFromRow(row: ShopProductRow, index = 0): Product {
  const colors = asColors(row.colors);
  return {
    slug: row.slug,
    name: row.name,
    price: Number(row.price),
    category: row.category || "T-shirts",
    description: row.description || "",
    details: asStringArray(row.details),
    sizes: asStringArray(row.sizes, ["S", "M", "L", "XL", "XXL"]),
    colors: colors.length ? colors : [{ name: "Black", hex: "#111111" }],
    views: asViews(row.views),
    image: row.image || "",
    featured: Boolean(row.featured),
    sortOrder: Number(row.sort_order ?? index),
    blendMode:
      row.blend_mode === "multiply" || row.blend_mode === "color-burn"
        ? row.blend_mode
        : undefined,
  };
}

function rowFromProduct(product: Product, index = 0) {
  return {
    slug: product.slug,
    name: product.name,
    price: product.price,
    category: product.category,
    description: product.description,
    details: product.details,
    sizes: product.sizes,
    colors: product.colors,
    views: product.views ?? {},
    image: product.image,
    featured: Boolean(product.featured),
    sort_order: product.sortOrder ?? index,
    blend_mode: product.blendMode ?? null,
    updated_at: new Date().toISOString(),
  };
}

function seedProducts(): Product[] {
  return designTees.map((product, index) => ({
    ...product,
    sortOrder: index,
  }));
}

function sortProducts(products: Product[]) {
  return [...products].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
  );
}

function isMissingObject(error: { message?: string; statusCode?: string } | null) {
  if (!error) return false;
  const message = error.message || "";
  return /not found|does not exist|No such file/i.test(message);
}

async function ensureBuckets() {
  const supabase = getSupabase();
  if (!supabase) return false;
  const existing = await supabase.storage.listBuckets();
  const names = new Set((existing.data ?? []).map((bucket) => bucket.id || bucket.name));
  if (!names.has(MEDIA_BUCKET)) {
    const created = await supabase.storage.createBucket(MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: 8 * 1024 * 1024,
    });
    if (created.error && !/exist|duplicate/i.test(created.error.message)) {
      throw new Error(created.error.message);
    }
  }
  if (!names.has(CMS_BUCKET)) {
    const created = await supabase.storage.createBucket(CMS_BUCKET, { public: false });
    if (created.error && !/exist|duplicate/i.test(created.error.message)) {
      throw new Error(created.error.message);
    }
  }
  return true;
}

async function postgresAvailable() {
  const supabase = getSupabase();
  if (!supabase) return false;
  const result = await supabase.from("site_settings").select("id").limit(1);
  if (!result.error) return true;
  if (isMissingTable(result.error)) return false;
  return true;
}

async function readJsonObject<T>(object: string): Promise<T | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const result = await supabase.storage.from(CMS_BUCKET).download(object);
  if (result.error || !result.data) {
    if (isMissingObject(result.error)) return null;
    if (result.error) throw new Error(result.error.message);
    return null;
  }
  return JSON.parse(await result.data.text()) as T;
}

async function writeJsonObject(object: string, value: unknown) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not connected.");
  await ensureBuckets();
  const body = JSON.stringify(value, null, 2);
  const result = await supabase.storage.from(CMS_BUCKET).upload(object, body, {
    upsert: true,
    contentType: "application/json",
  });
  if (result.error) throw new Error(result.error.message);
}

async function readSettingsFromPostgres(): Promise<SiteSettings | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const result = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", SETTINGS_ID)
    .maybeSingle();
  if (result.error) {
    if (isMissingTable(result.error)) return null;
    throw new Error(result.error.message);
  }
  return result.data ? settingsFromRow(result.data as SiteSettingsRow) : null;
}

async function writeSettingsToPostgres(settings: SiteSettings) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not connected.");
  const result = await supabase.from("site_settings").upsert(rowFromSettings(settings));
  if (result.error) throw new Error(result.error.message);
}

async function readProductsFromPostgres(): Promise<Product[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const result = await supabase
    .from("shop_products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (result.error) {
    if (isMissingTable(result.error)) return null;
    throw new Error(result.error.message);
  }
  return ((result.data as ShopProductRow[] | null) ?? []).map(productFromRow);
}

async function writeProductsToPostgres(products: Product[]) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not connected.");
  const result = await supabase.from("shop_products").upsert(
    products.map((product, index) => rowFromProduct(product, index)),
    { onConflict: "slug" },
  );
  if (result.error) throw new Error(result.error.message);
}

async function deleteProductFromPostgres(slug: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not connected.");
  const result = await supabase.from("shop_products").delete().eq("slug", slug);
  if (result.error) throw new Error(result.error.message);
}

async function seedIfNeeded() {
  if (!supabaseConfigured() || seedAttempted) return;
  seedAttempted = true;
  try {
    const usePostgres = await postgresAvailable();
    if (usePostgres) {
      const settings = await readSettingsFromPostgres();
      const products = await readProductsFromPostgres();
      if (!settings) await writeSettingsToPostgres(defaultSiteSettings);
      if (products && products.length === 0) {
        const stored = await readJsonObject<Product[]>(PRODUCTS_OBJECT);
        await writeProductsToPostgres(
          migrateLegacyTeePrices(stored?.length ? stored : seedProducts()),
        );
      } else if (products?.length) {
        const migrated = migrateLegacyTeePrices(products);
        if (migrated !== products) await writeProductsToPostgres(migrated);
      }
      if (!settings) {
        const stored = await readJsonObject<SiteSettings>(SETTINGS_OBJECT);
        if (stored) await writeSettingsToPostgres(normalizeSettings(stored));
      }
      return;
    }

    await ensureBuckets();
    const settings = await readJsonObject<SiteSettings>(SETTINGS_OBJECT);
    const products = await readJsonObject<Product[]>(PRODUCTS_OBJECT);
    if (!settings) await writeJsonObject(SETTINGS_OBJECT, defaultSiteSettings);
    if (!products) {
      await writeJsonObject(PRODUCTS_OBJECT, seedProducts());
    } else {
      const migrated = migrateLegacyTeePrices(products);
      if (migrated !== products) await writeJsonObject(PRODUCTS_OBJECT, migrated);
    }
  } catch (error) {
    seedAttempted = false;
    throw error;
  }
}

export function revalidateStorefront(slugs: string[] = []) {
  revalidatePath("/", "layout");
  revalidatePath("/shop");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  for (const slug of slugs) {
    revalidatePath(`/shop/${slug}`);
    revalidatePath(`/admin/products/${slug}`);
  }
}

async function loadSiteSettings(): Promise<PublicSite> {
  try {
    await seedIfNeeded();
    if (await postgresAvailable()) {
      const settings = await readSettingsFromPostgres();
      if (settings) return withContactLinks(settings);
    }
    const stored = await readJsonObject<SiteSettings>(SETTINGS_OBJECT);
    if (stored) return withContactLinks(normalizeSettings(stored));
  } catch {
    // Fall back to the built-in copy so the shop still renders.
  }
  return withContactLinks(defaultSiteSettings);
}

async function loadCatalog(): Promise<Product[]> {
  try {
    await seedIfNeeded();
    if (await postgresAvailable()) {
      const products = await readProductsFromPostgres();
      if (products?.length) return sortProducts(migrateLegacyTeePrices(products));
    }
    const stored = await readJsonObject<Product[]>(PRODUCTS_OBJECT);
    if (stored?.length) return sortProducts(migrateLegacyTeePrices(stored).map((product, index) => ({
      ...product,
      sortOrder: product.sortOrder ?? index,
    })));
  } catch {
    // Fall back to the built-in catalog so the shop still renders.
  }
  return seedProducts();
}

export const getSiteSettings = cache(loadSiteSettings);
export const getCatalog = cache(loadCatalog);

export async function getProduct(slug: string) {
  const catalog = await getCatalog();
  return catalog.find((product) => product.slug === slug) ?? null;
}

export async function getFeaturedProducts() {
  const catalog = await getCatalog();
  const featured = catalog.filter((product) => product.featured);
  return featured.length ? featured : catalog.slice(0, 6);
}

export async function saveSiteSettings(input: Partial<SiteSettings>) {
  if (!supabaseConfigured()) {
    throw new Error("Connect Supabase in Admin → Database before editing the site.");
  }
  const current = await loadSiteSettings();
  const next = normalizeSettings({ ...current, ...input });
  if (await postgresAvailable()) {
    await writeSettingsToPostgres(next);
  } else {
    await writeJsonObject(SETTINGS_OBJECT, next);
  }
  revalidateStorefront();
  return withContactLinks(next);
}

export function emptyProduct(): Product {
  return {
    slug: "",
    name: "",
    price: TEE_PRICE,
    category: "T-shirts",
    image: "",
    description: "",
    details: ["Printed in the USA"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Heather Grey", hex: "#9aa3ad" },
      { name: "Black", hex: "#111111" },
      { name: "White", hex: "#f4f4f4" },
    ],
    views: {},
    featured: false,
    sortOrder: 999,
  };
}

function sanitizeProduct(input: Partial<Product>, previous?: Product | null): Product {
  const name = String(input.name || previous?.name || "").trim();
  if (!name) throw new Error("Product name is required.");
  const slug = slugify(String(input.slug || previous?.slug || name));
  if (!slug) throw new Error("Product slug is required.");
  const price = Number(input.price ?? previous?.price ?? 0);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Enter a valid price.");
  }
  const colors = asColors(input.colors, previous?.colors).filter((color) => color.name.trim());
  if (!colors.length) throw new Error("Add at least one color.");
  const sizes = asStringArray(input.sizes, previous?.sizes).map((size) => size.trim()).filter(Boolean);
  if (!sizes.length) throw new Error("Add at least one size.");
  const views = asViews(input.views) || previous?.views;
  const image =
    String(input.image || previous?.image || views?.[colors[0].name]?.front || "").trim();
  return {
    slug,
    name,
    price,
    category: String(input.category || previous?.category || "T-shirts").trim() || "T-shirts",
    description: String(input.description ?? previous?.description ?? ""),
    details: asStringArray(input.details, previous?.details),
    sizes,
    colors,
    views,
    image,
    featured: Boolean(input.featured ?? previous?.featured),
    sortOrder: Number(input.sortOrder ?? previous?.sortOrder ?? 999),
    blendMode: input.blendMode ?? previous?.blendMode,
  };
}

export async function saveProduct(input: Partial<Product>, previousSlug?: string) {
  if (!supabaseConfigured()) {
    throw new Error("Connect Supabase in Admin → Database before editing products.");
  }
  const catalog = await loadCatalog();
  const previous =
    catalog.find((product) => product.slug === (previousSlug || input.slug)) ?? null;
  const next = sanitizeProduct(input, previous);
  const withoutOld = catalog.filter(
    (product) => product.slug !== next.slug && product.slug !== previous?.slug,
  );
  if (catalog.some((product) => product.slug === next.slug && product.slug !== previous?.slug)) {
    throw new Error("That slug is already used by another product.");
  }
  const products = sortProducts([...withoutOld, next]);

  if (await postgresAvailable()) {
    if (previous && previous.slug !== next.slug) {
      await deleteProductFromPostgres(previous.slug);
    }
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is not connected.");
    const result = await supabase.from("shop_products").upsert(rowFromProduct(next, next.sortOrder));
    if (result.error) throw new Error(result.error.message);
  } else {
    await writeJsonObject(PRODUCTS_OBJECT, products);
  }

  revalidateStorefront([next.slug, previous?.slug || ""]);
  return next;
}

export async function deleteProduct(slug: string) {
  if (!supabaseConfigured()) {
    throw new Error("Connect Supabase in Admin → Database before editing products.");
  }
  if (await postgresAvailable()) {
    await deleteProductFromPostgres(slug);
  } else {
    const catalog = await loadCatalog();
    await writeJsonObject(
      PRODUCTS_OBJECT,
      catalog.filter((product) => product.slug !== slug),
    );
  }
  revalidateStorefront([slug]);
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

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 80);
}

export async function uploadCmsImage(options: {
  file: File;
  folder: string;
  name?: string;
}) {
  if (!supabaseConfigured()) {
    throw new Error("Connect Supabase in Admin → Database before uploading images.");
  }
  const { file, folder, name } = options;
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type) && !extensionFor(file.type, file.name)) {
    throw new Error("Use a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Images must be 8MB or smaller.");
  }
  const ext = extensionFor(file.type, file.name);
  if (!ext) throw new Error("Use a JPEG, PNG, WebP, or GIF image.");

  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not connected.");
  await ensureBuckets();

  const filename = `${safeSegment(name || "image")}-${Date.now()}.${ext}`;
  const path = `${safeSegment(folder) || "uploads"}/${filename}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const uploaded = await supabase.storage.from(MEDIA_BUCKET).upload(path, bytes, {
    contentType: file.type || `image/${ext}`,
    upsert: true,
  });
  if (uploaded.error) throw new Error(uploaded.error.message);
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function probeCms(): Promise<CmsStatus> {
  if (!supabaseConfigured()) {
    return {
      connected: false,
      source: "fallback",
      tables: false,
      storage: false,
      productCount: designTees.length,
      error: "Add a Supabase service role key.",
    };
  }
  try {
    await seedIfNeeded();
    const tables = await postgresAvailable();
    let storage = false;
    try {
      storage = await ensureBuckets();
    } catch {
      storage = false;
    }
    const catalog = await loadCatalog();
    return {
      connected: true,
      source: tables ? "postgres" : storage ? "storage" : "fallback",
      tables,
      storage,
      productCount: catalog.length,
    };
  } catch (error) {
    return {
      connected: false,
      source: "fallback",
      tables: false,
      storage: false,
      productCount: designTees.length,
      error: error instanceof Error ? error.message : "Could not reach the CMS.",
    };
  }
}
