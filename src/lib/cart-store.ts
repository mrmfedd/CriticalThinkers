import { getCatalog } from "@/lib/cms";
import { withShipping } from "@/lib/commerce";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { imageFor, type Product } from "@/lib/products";
import type { ProductColor } from "@/lib/products";
import type { CartItem, StoredOrder } from "@/lib/cart-types";

export type CartLineInput = {
  slug: string;
  name?: string;
  image?: string;
  price?: number;
  quantity: number;
  size: string;
  color: ProductColor | string;
};

type CartRow = {
  id: string;
  session_id: string;
};

type CartItemRow = {
  product_slug: string;
  name: string;
  image: string;
  unit_price: number | string;
  quantity: number;
  size: string;
  color_name: string;
  color_hex: string;
};

export class StoreSetupError extends Error {
  constructor(message = "Cart tables are missing. Run supabase/schema.sql in the SQL editor.") {
    super(message);
    this.name = "StoreSetupError";
  }
}

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

function throwIfStoreError(error: { message?: string; code?: string } | null) {
  if (!error) return;
  if (isMissingTable(error)) throw new StoreSetupError(error.message);
  throw new Error(error.message || "Supabase request failed.");
}

function colorOf(value: ProductColor | string): ProductColor {
  if (typeof value === "string") {
    return { name: value, hex: "#111111" };
  }
  return value;
}

export function toCartItem(input: CartLineInput, product: Product): CartItem {
  const color = colorOf(input.color);
  const matched =
    product.colors.find((option) => option.name === color.name) || product.colors[0];
  const size = product.sizes.includes(input.size) ? input.size : product.sizes[0];
  const quantity = Math.max(1, Math.min(12, Math.floor(Number(input.quantity)) || 1));
  return {
    id: `${product.slug}::${size}::${matched.name}`,
    slug: product.slug,
    name: product.name,
    image: imageFor(product, matched.name),
    price: product.price,
    quantity,
    size,
    color: matched,
  };
}

export function normalizeCartItems(input: unknown, catalog: Product[]): CartItem[] {
  if (!Array.isArray(input)) return [];
  const merged = new Map<string, CartItem>();
  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Partial<CartLineInput>;
    if (typeof row.slug !== "string") continue;
    const product = catalog.find((item) => item.slug === row.slug);
    if (!product) continue;
    const item = toCartItem(
      {
        slug: row.slug,
        name: row.name,
        image: row.image,
        price: row.price,
        quantity: Number(row.quantity) || 1,
        size: typeof row.size === "string" ? row.size : product.sizes[0],
        color: row.color ?? product.colors[0],
      },
      product,
    );
    const existing = merged.get(item.id);
    if (existing) {
      existing.quantity = Math.min(12, existing.quantity + item.quantity);
    } else {
      merged.set(item.id, item);
    }
  }
  return [...merged.values()];
}

function fromRow(row: CartItemRow): CartLineInput {
  return {
    slug: row.product_slug,
    name: row.name,
    image: row.image,
    price: Number(row.unit_price),
    quantity: row.quantity,
    size: row.size,
    color: { name: row.color_name, hex: row.color_hex },
  };
}

async function getOrCreateCart(sessionId: string) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const existing = await supabase
    .from("carts")
    .select("id, session_id")
    .eq("session_id", sessionId)
    .maybeSingle();
  throwIfStoreError(existing.error);
  if (existing.data) return existing.data as CartRow;

  const created = await supabase
    .from("carts")
    .insert({ session_id: sessionId })
    .select("id, session_id")
    .single();
  throwIfStoreError(created.error);
  return created.data as CartRow;
}

export async function readCart(sessionId: string): Promise<CartItem[]> {
  if (!supabaseConfigured()) return [];
  const supabase = getSupabase();
  if (!supabase) return [];

  const cart = await getOrCreateCart(sessionId);
  if (!cart) return [];

  const result = await supabase
    .from("cart_items")
    .select("product_slug, name, image, unit_price, quantity, size, color_name, color_hex")
    .eq("cart_id", cart.id);
  throwIfStoreError(result.error);
  const catalog = await getCatalog();
  return normalizeCartItems((result.data as CartItemRow[] | null)?.map(fromRow) ?? [], catalog);
}

export async function writeCart(sessionId: string, items: unknown) {
  if (!supabaseConfigured()) {
    throw new Error("Supabase is not connected.");
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not connected.");

  const cart = await getOrCreateCart(sessionId);
  if (!cart) throw new Error("Could not create a cart.");

  const catalog = await getCatalog();
  const normalized = normalizeCartItems(items, catalog);
  const cleared = await supabase.from("cart_items").delete().eq("cart_id", cart.id);
  throwIfStoreError(cleared.error);

  if (normalized.length) {
    const inserted = await supabase.from("cart_items").insert(
      normalized.map((item) => ({
        cart_id: cart.id,
        product_slug: item.slug,
        name: item.name,
        image: item.image,
        unit_price: item.price,
        quantity: item.quantity,
        size: item.size,
        color_name: item.color.name,
        color_hex: item.color.hex,
      })),
    );
    throwIfStoreError(inserted.error);
  }

  await supabase.from("carts").update({ updated_at: new Date().toISOString() }).eq("id", cart.id);
  return normalized;
}

export async function clearCart(sessionId: string) {
  return writeCart(sessionId, []);
}

export async function probeStore() {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: "Add a Supabase service role key or anon key." };
  }
  const result = await supabase.from("carts").select("id").limit(1);
  if (result.error) {
    return {
      ok: false,
      needsSchema: isMissingTable(result.error),
      error: isMissingTable(result.error)
        ? "Connected, but cart tables are missing. Run supabase/schema.sql in the SQL editor."
        : result.error.message,
    };
  }
  return { ok: true };
}

type CustomerInput = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
};

export async function createOrder(options: {
  sessionId: string;
  customer: CustomerInput;
  items?: unknown;
  paidWith: "paypal" | "sample";
  paypalCaptureId?: string;
  paypalOrderId?: string;
}) {
  if (!supabaseConfigured()) {
    throw new Error("Supabase is not connected.");
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not connected.");

  const name = String(options.customer.name || "").trim();
  const email = String(options.customer.email || "").trim();
  if (!name || !email) {
    throw new Error("Name and email are required.");
  }

  const cart = await getOrCreateCart(options.sessionId);
  const stored = cart ? await readCart(options.sessionId) : [];
  const items = stored.length ? stored : normalizeCartItems(options.items ?? [], await getCatalog());
  if (!items.length) {
    throw new Error("Your cart is empty.");
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totals = withShipping(subtotal, items.length > 0);
  const orderRow = {
      cart_id: cart?.id ?? null,
      customer_name: name,
      email,
      phone: String(options.customer.phone || "").trim() || null,
      address: String(options.customer.address || "").trim() || null,
      city: String(options.customer.city || "").trim() || null,
      state: String(options.customer.state || "").trim() || null,
      zip: String(options.customer.zip || "").trim() || null,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      status: options.paidWith === "paypal" ? "paid" : "sample",
      paid_with: options.paidWith,
      paypal_capture_id: options.paypalCaptureId || null,
      paypal_order_id: options.paypalOrderId || null,
  };
  let inserted = await supabase.from("orders").insert(orderRow).select("id").single();
  if (inserted.error && /shipping/i.test(inserted.error.message || "")) {
    const { shipping: _shipping, ...withoutShipping } = orderRow;
    inserted = await supabase.from("orders").insert(withoutShipping).select("id").single();
  }
  throwIfStoreError(inserted.error);

  const orderId = (inserted.data as { id: string }).id;
  const lines = await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: orderId,
      product_slug: item.slug,
      name: item.name,
      image: item.image,
      unit_price: item.price,
      quantity: item.quantity,
      size: item.size,
      color_name: item.color.name,
      color_hex: item.color.hex,
    })),
  );
  throwIfStoreError(lines.error);
  await clearCart(options.sessionId);
  return { id: orderId, items, subtotal: totals.subtotal, shipping: totals.shipping };
}

export async function listOrders(limit = 50): Promise<StoredOrder[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const columns =
    "id, customer_name, email, phone, address, city, state, zip, subtotal, shipping, status, paid_with, paypal_capture_id, created_at, order_items(name, quantity, size, color_name, unit_price)";
  const fallbackColumns =
    "id, customer_name, email, phone, address, city, state, zip, subtotal, status, paid_with, paypal_capture_id, created_at, order_items(name, quantity, size, color_name, unit_price)";
  let result = await supabase
    .from("orders")
    .select(columns)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (result.error && /shipping/i.test(result.error.message || "")) {
    result = await supabase
      .from("orders")
      .select(fallbackColumns)
      .order("created_at", { ascending: false })
      .limit(limit);
  }
  throwIfStoreError(result.error);

  return ((result.data as Array<Record<string, unknown>> | null) ?? []).map((row) => ({
    id: String(row.id),
    customer_name: String(row.customer_name),
    email: String(row.email),
    phone: (row.phone as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    zip: (row.zip as string | null) ?? null,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping ?? 0),
    status: String(row.status),
    paid_with: String(row.paid_with),
    paypal_capture_id: (row.paypal_capture_id as string | null) ?? null,
    created_at: String(row.created_at),
    items: Array.isArray(row.order_items)
      ? (row.order_items as StoredOrder["items"])
      : [],
  }));
}
