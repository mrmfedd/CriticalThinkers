import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_SUPABASE_URL = "https://bfnodshuhelbkwroyxtj.supabase.co";

export type SupabaseConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

const STORE_PATH = path.join(process.cwd(), "data", "supabase.json");
const emptyConfig: SupabaseConfig = {
  url: DEFAULT_SUPABASE_URL,
  anonKey: "",
  serviceRoleKey: "",
};

function readStoredConfig(): SupabaseConfig {
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Partial<SupabaseConfig>;
    return {
      url: parsed.url?.trim() || DEFAULT_SUPABASE_URL,
      anonKey: parsed.anonKey?.trim() || "",
      serviceRoleKey: parsed.serviceRoleKey?.trim() || "",
    };
  } catch {
    return emptyConfig;
  }
}

export function getSupabaseConfig(): SupabaseConfig {
  const stored = readStoredConfig();
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || stored.url || DEFAULT_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || stored.anonKey,
    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || stored.serviceRoleKey,
  };
}

export function supabaseEnvLocked() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function supabaseConfigured(config = getSupabaseConfig()) {
  return Boolean(config.url && (config.serviceRoleKey || config.anonKey));
}

export function getSupabaseAdminView() {
  const stored = readStoredConfig();
  const config = getSupabaseConfig();
  return {
    connected: supabaseConfigured(config),
    url: config.url,
    hasAnonKey: Boolean(config.anonKey),
    hasServiceRoleKey: Boolean(config.serviceRoleKey),
    envLocked: supabaseEnvLocked(),
    storedUrl: stored.url,
  };
}

export function saveSupabaseConfig(next: SupabaseConfig) {
  mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  writeFileSync(
    STORE_PATH,
    `${JSON.stringify(
      {
        url: next.url.trim() || DEFAULT_SUPABASE_URL,
        anonKey: next.anonKey.trim(),
        serviceRoleKey: next.serviceRoleKey.trim(),
      },
      null,
      2,
    )}\n`,
  );
}

export function clearSupabaseConfig() {
  saveSupabaseConfig(emptyConfig);
}

export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  const key = config.serviceRoleKey || config.anonKey;
  if (!config.url || !key) return null;
  return createClient(config.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
