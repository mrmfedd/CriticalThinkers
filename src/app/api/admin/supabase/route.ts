import { readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { probeStore } from "@/lib/cart-store";
import {
  DEFAULT_SUPABASE_URL,
  clearSupabaseConfig,
  getSupabaseAdminView,
  getSupabaseConfig,
  saveSupabaseConfig,
  supabaseEnvLocked,
} from "@/lib/supabase";

export const runtime = "nodejs";

function schemaSql() {
  try {
    return readFileSync(path.join(process.cwd(), "supabase/schema.sql"), "utf8");
  } catch {
    return "";
  }
}

export async function GET() {
  const probe = await probeStore();
  return NextResponse.json({
    config: getSupabaseAdminView(),
    probe,
    schemaSql: schemaSql(),
  });
}

export async function POST(request: Request) {
  if (supabaseEnvLocked()) {
    return NextResponse.json(
      { error: "Supabase credentials are locked by environment variables." },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    url?: string;
    anonKey?: string;
    serviceRoleKey?: string;
  } | null;

  const current = getSupabaseConfig();
  const url = (body?.url || current.url || DEFAULT_SUPABASE_URL).trim();
  const anonKey = (body?.anonKey || "").trim() || current.anonKey;
  const serviceRoleKey =
    (body?.serviceRoleKey || "").trim() || current.serviceRoleKey;

  if (!url.startsWith("https://") || !url.includes("supabase.co")) {
    return NextResponse.json(
      { error: "Use your Supabase project URL." },
      { status: 400 },
    );
  }
  if (!anonKey && !serviceRoleKey) {
    return NextResponse.json(
      { error: "Paste the service role key (recommended) or the anon key." },
      { status: 400 },
    );
  }

  saveSupabaseConfig({ url, anonKey, serviceRoleKey });
  const probe = await probeStore();
  return NextResponse.json({
    config: getSupabaseAdminView(),
    probe,
    schemaSql: schemaSql(),
  });
}

export async function DELETE() {
  if (supabaseEnvLocked()) {
    return NextResponse.json(
      { error: "Supabase credentials are locked by environment variables." },
      { status: 400 },
    );
  }
  clearSupabaseConfig();
  return NextResponse.json({
    config: getSupabaseAdminView(),
    probe: { ok: false, error: "Disconnected." },
    schemaSql: schemaSql(),
  });
}
