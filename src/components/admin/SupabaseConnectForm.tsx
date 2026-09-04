"use client";

import type { CmsStatus } from "@/lib/cms";
import { FormEvent, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";

type Probe = {
  ok?: boolean;
  needsSchema?: boolean;
  error?: string;
};

type SupabaseAdminView = {
  connected: boolean;
  url: string;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  envLocked: boolean;
};

export function SupabaseConnectForm({
  initial,
  initialProbe,
  cms,
  schemaSql,
}: {
  initial: SupabaseAdminView;
  initialProbe: Probe;
  cms: CmsStatus;
  schemaSql: string;
}) {
  const [status, setStatus] = useState(initial);
  const [probe, setProbe] = useState(initialProbe);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/supabase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: String(form.get("url") || ""),
        anonKey: String(form.get("anonKey") || ""),
        serviceRoleKey: String(form.get("serviceRoleKey") || ""),
      }),
    });
    const payload = (await response.json()) as {
      error?: string;
      config?: SupabaseAdminView;
      probe?: Probe;
    };
    setBusy(false);
    if (!response.ok || !payload.config) {
      setError(payload.error || "Could not connect Supabase.");
      return;
    }
    setStatus(payload.config);
    setProbe(payload.probe ?? {});
    const secretFields = event.currentTarget.querySelectorAll<HTMLInputElement>(
      'input[type="password"]',
    );
    secretFields.forEach((field) => {
      field.value = "";
    });
    setMessage(
      payload.probe?.ok
        ? "Shopping cart is connected to this database."
        : payload.probe?.error || "Keys saved. Finish the SQL setup below.",
    );
  }

  async function disconnect() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/supabase", { method: "DELETE" });
    const payload = (await response.json()) as {
      error?: string;
      config?: SupabaseAdminView;
      probe?: Probe;
    };
    setBusy(false);
    if (!response.ok || !payload.config) {
      setError(payload.error || "Could not disconnect Supabase.");
      return;
    }
    setStatus(payload.config);
    setProbe(payload.probe ?? {});
    setMessage("Supabase has been disconnected.");
  }

  async function copySql() {
    await navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AdminHeader
        title="Database"
        description="Connect Supabase so the website, products, cart, and orders are stored in the database instead of the code."
      />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={onSubmit}
          className="grid gap-4 rounded-md border border-white/10 bg-black/40 p-6"
        >
          <p className={`text-sm ${probe.ok ? "text-chrome" : "text-flagRed"}`}>
            {probe.ok
              ? "Connected · carts and orders are live"
              : probe.error || "Not connected"}
          </p>
          <p className="text-sm text-steel">
            Website CMS:{" "}
            {cms.source === "postgres"
              ? `tables live · ${cms.productCount} products`
              : cms.source === "storage"
                ? `saving to Storage until you run the SQL below · ${cms.productCount} products`
                : cms.error || "using built-in fallback until Supabase is connected"}
          </p>
          {status.envLocked ? (
            <p className="text-sm text-steel">
              Credentials are coming from environment variables, so this form
              cannot override them.
            </p>
          ) : null}
          <label className="grid gap-1 text-sm">
            Project URL
            <input
              name="url"
              required
              defaultValue={status.url}
              disabled={status.envLocked || busy}
              className="rounded border border-white/20 bg-black px-3 py-2 text-white disabled:opacity-60"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Service role key
            <input
              name="serviceRoleKey"
              type="password"
              autoComplete="off"
              placeholder={
                status.hasServiceRoleKey
                  ? "Saved — enter a new key to replace it"
                  : "Recommended. Server-only."
              }
              disabled={status.envLocked || busy}
              className="rounded border border-white/20 bg-black px-3 py-2 text-white disabled:opacity-60"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Anon key
            <input
              name="anonKey"
              type="password"
              autoComplete="off"
              placeholder={
                status.hasAnonKey
                  ? "Saved — enter a new key to replace it"
                  : "Optional if the service role key is set"
              }
              disabled={status.envLocked || busy}
              className="rounded border border-white/20 bg-black px-3 py-2 text-white disabled:opacity-60"
            />
          </label>
          {error ? <p className="text-sm text-flagRed">{error}</p> : null}
          {message ? <p className="text-sm text-chrome">{message}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy || status.envLocked}
              className="rounded bg-flagRed px-6 py-3 font-display tracking-[0.14em] text-white uppercase disabled:opacity-60"
            >
              {busy ? "Connecting…" : "Save and connect"}
            </button>
            {status.connected && !status.envLocked ? (
              <button
                type="button"
                disabled={busy}
                onClick={disconnect}
                className="rounded border border-white/20 px-6 py-3 font-display tracking-[0.14em] uppercase disabled:opacity-60"
              >
                Disconnect
              </button>
            ) : null}
          </div>
        </form>

        <aside className="h-fit rounded-md border border-white/10 bg-black/30 p-6 text-sm leading-6 text-steel">
          <h2 className="font-display text-xl text-white">Finish setup</h2>
          <ol className="mt-4 grid list-decimal gap-3 pl-5">
            <li>
              Open{" "}
              <a
                href="https://supabase.com/dashboard/project/bfnodshuhelbkwroyxtj/settings/api"
                target="_blank"
                rel="noreferrer"
                className="text-white underline"
              >
                Project Settings → API
              </a>{" "}
              and copy the service role key.
            </li>
            <li>Paste it here and save.</li>
            <li>
              Open the{" "}
              <a
                href="https://supabase.com/dashboard/project/bfnodshuhelbkwroyxtj/sql/new"
                target="_blank"
                rel="noreferrer"
                className="text-white underline"
              >
                SQL editor
              </a>
              , paste the schema (carts, orders, website, and products), and run it once.
            </li>
          </ol>
          {schemaSql ? (
            <div className="mt-5">
              <button
                type="button"
                onClick={copySql}
                className="rounded border border-white/20 px-4 py-2 font-display text-xs tracking-[0.14em] text-white uppercase"
              >
                {copied ? "Copied" : "Copy SQL schema"}
              </button>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
