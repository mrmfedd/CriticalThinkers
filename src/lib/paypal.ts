import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getCatalog, getSiteSettings } from "@/lib/cms";
import { withShipping } from "@/lib/commerce";

export type PayPalMode = "sandbox" | "live";

export type PayPalConfig = {
  clientId: string;
  clientSecret: string;
  mode: PayPalMode;
};

export type CheckoutLine = {
  slug: string;
  name: string;
  quantity: number;
  size: string;
  color: string;
};

type TokenCache = {
  token: string;
  expiresAt: number;
  fingerprint: string;
};

const STORE_PATH = path.join(process.cwd(), "data", "paypal.json");
const emptyConfig: PayPalConfig = {
  clientId: "",
  clientSecret: "",
  mode: "sandbox",
};

let tokenCache: TokenCache | null = null;

function readStoredConfig(): PayPalConfig {
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Partial<PayPalConfig>;
    return {
      clientId: parsed.clientId?.trim() || "",
      clientSecret: parsed.clientSecret?.trim() || "",
      mode: parsed.mode === "live" ? "live" : "sandbox",
    };
  } catch {
    return emptyConfig;
  }
}

export function getPayPalConfig(): PayPalConfig {
  const stored = readStoredConfig();
  return {
    clientId: process.env.PAYPAL_CLIENT_ID?.trim() || stored.clientId,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET?.trim() || stored.clientSecret,
    mode:
      process.env.PAYPAL_MODE === "live" || process.env.PAYPAL_MODE === "sandbox"
        ? process.env.PAYPAL_MODE
        : stored.mode,
  };
}

export function paypalConfigured(config = getPayPalConfig()) {
  return Boolean(config.clientId && config.clientSecret);
}

export function getPayPalPublicConfig() {
  const config = getPayPalConfig();
  return {
    connected: paypalConfigured(config),
    clientId: config.clientId,
    mode: config.mode,
  };
}

export function getPayPalAdminView() {
  const stored = readStoredConfig();
  const config = getPayPalConfig();
  const envLocked = Boolean(
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET,
  );
  return {
    connected: paypalConfigured(config),
    clientId: envLocked ? config.clientId : stored.clientId,
    hasSecret: Boolean(config.clientSecret),
    mode: config.mode,
    envLocked,
  };
}

export function savePayPalConfig(next: PayPalConfig) {
  mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  writeFileSync(
    STORE_PATH,
    `${JSON.stringify(
      {
        clientId: next.clientId.trim(),
        clientSecret: next.clientSecret.trim(),
        mode: next.mode,
      },
      null,
      2,
    )}\n`,
  );
  tokenCache = null;
}

export function clearPayPalConfig() {
  savePayPalConfig(emptyConfig);
}

function apiBase(mode: PayPalMode) {
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export async function paypalAccessToken(config = getPayPalConfig()) {
  if (!paypalConfigured(config)) {
    throw new Error("PayPal is not connected.");
  }

  const fingerprint = `${config.mode}:${config.clientId}:${config.clientSecret}`;
  if (
    tokenCache &&
    tokenCache.fingerprint === fingerprint &&
    tokenCache.expiresAt > Date.now() + 30_000
  ) {
    return tokenCache.token;
  }

  const auth = Buffer.from(
    `${config.clientId}:${config.clientSecret}`,
  ).toString("base64");
  const response = await fetch(`${apiBase(config.mode)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description || "PayPal rejected those credentials.",
    );
  }

  tokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 300) * 1000,
    fingerprint,
  };
  return payload.access_token;
}

export function money(amount: number) {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

export async function pricedLines(items: CheckoutLine[]) {
  if (!items.length) {
    throw new Error("Your cart is empty.");
  }

  const catalog = await getCatalog();
  return items.map((item) => {
    const product = catalog.find((entry) => entry.slug === item.slug);
    if (!product) {
      throw new Error(`Unknown product: ${item.slug}`);
    }
    const quantity = Math.max(1, Math.min(12, Math.floor(item.quantity) || 1));
    return {
      slug: product.slug,
      name: item.name || product.name,
      quantity,
      size: item.size,
      color: item.color,
      unitPrice: product.price,
      lineTotal: product.price * quantity,
    };
  });
}

export async function orderTotal(items: CheckoutLine[]) {
  const lines = await pricedLines(items);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  return withShipping(subtotal, lines.length > 0).total;
}

export async function createPayPalOrder(items: CheckoutLine[]) {
  const config = getPayPalConfig();
  const token = await paypalAccessToken(config);
  const lines = await pricedLines(items);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const totals = withShipping(subtotal, lines.length > 0);
  const settings = await getSiteSettings();

  const response = await fetch(`${apiBase(config.mode)}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: `${settings.name} order`,
          amount: {
            currency_code: "USD",
            value: money(totals.total),
            breakdown: {
              item_total: { currency_code: "USD", value: money(totals.subtotal) },
              shipping: { currency_code: "USD", value: money(totals.shipping) },
            },
          },
          items: lines.map((line) => ({
            name: `${line.name} (${line.color}, ${line.size})`.slice(0, 127),
            quantity: String(line.quantity),
            sku: line.slug,
            unit_amount: {
              currency_code: "USD",
              value: money(line.unitPrice),
            },
          })),
        },
      ],
    }),
  });

  const payload = (await response.json()) as {
    id?: string;
    message?: string;
    details?: Array<{ description?: string }>;
  };
  if (!response.ok || !payload.id) {
    throw new Error(
      payload.details?.[0]?.description ||
        payload.message ||
        "PayPal could not create the order.",
    );
  }
  return payload.id;
}

export async function capturePayPalOrder(orderId: string) {
  const config = getPayPalConfig();
  const token = await paypalAccessToken(config);
  const response = await fetch(
    `${apiBase(config.mode)}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
  const payload = (await response.json()) as {
    id?: string;
    status?: string;
    message?: string;
    details?: Array<{ description?: string }>;
    purchase_units?: Array<{
      payments?: { captures?: Array<{ id?: string; status?: string }> };
    }>;
  };
  if (!response.ok) {
    throw new Error(
      payload.details?.[0]?.description ||
        payload.message ||
        "PayPal could not capture the payment.",
    );
  }
  return {
    orderId: payload.id || orderId,
    status: payload.status || "UNKNOWN",
    captureId:
      payload.purchase_units?.[0]?.payments?.captures?.[0]?.id || payload.id,
  };
}
