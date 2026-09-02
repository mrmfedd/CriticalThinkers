import { NextResponse } from "next/server";
import {
  clearPayPalConfig,
  getPayPalAdminView,
  getPayPalConfig,
  paypalAccessToken,
  savePayPalConfig,
  type PayPalMode,
} from "@/lib/paypal";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ config: getPayPalAdminView() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { clientId?: string; clientSecret?: string; mode?: string }
    | null;

  const current = getPayPalConfig();
  const clientId = (body?.clientId || "").trim();
  const incomingSecret = (body?.clientSecret || "").trim();
  const clientSecret = incomingSecret || current.clientSecret;
  const mode: PayPalMode = body?.mode === "live" ? "live" : "sandbox";

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Client ID and Secret are required." },
      { status: 400 },
    );
  }

  const next = { clientId, clientSecret, mode };

  try {
    await paypalAccessToken(next);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PayPal rejected those credentials.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  savePayPalConfig(next);
  return NextResponse.json({ config: getPayPalAdminView() });
}

export async function DELETE() {
  clearPayPalConfig();
  return NextResponse.json({ config: getPayPalAdminView() });
}
