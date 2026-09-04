"use client";

import { FormEvent, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";

type PayPalAdminView = {
  connected: boolean;
  clientId: string;
  hasSecret: boolean;
  mode: "sandbox" | "live";
  envLocked: boolean;
};

export function PayPalConnectForm({ initial }: { initial: PayPalAdminView }) {
  const [status, setStatus] = useState(initial);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/paypal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: String(form.get("clientId") || ""),
        clientSecret: String(form.get("clientSecret") || ""),
        mode: String(form.get("mode") || "sandbox"),
      }),
    });
    const payload = (await response.json()) as {
      error?: string;
      config?: PayPalAdminView;
    };
    setBusy(false);
    if (!response.ok || !payload.config) {
      setError(payload.error || "Could not connect PayPal.");
      return;
    }
    setStatus(payload.config);
    const secretField = event.currentTarget.querySelector<HTMLInputElement>(
      'input[name="clientSecret"]',
    );
    if (secretField) secretField.value = "";
    setMessage(
      payload.config.mode === "live"
        ? "PayPal is connected in live mode. Checkout will charge real money."
        : "PayPal sandbox is connected. Use sandbox buyer accounts to test checkout.",
    );
  }

  async function disconnect() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/paypal", { method: "DELETE" });
    const payload = (await response.json()) as {
      error?: string;
      config?: PayPalAdminView;
    };
    setBusy(false);
    if (!response.ok || !payload.config) {
      setError(payload.error || "Could not disconnect PayPal.");
      return;
    }
    setStatus(payload.config);
    setMessage("PayPal has been disconnected.");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AdminHeader
        title="Connect PayPal"
        description="Paste your PayPal REST app credentials so checkout can take payment."
      />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={onSubmit}
          className="grid gap-4 rounded-md border border-white/10 bg-black/40 p-6"
        >
          <p
            className={`text-sm ${
              status.connected ? "text-chrome" : "text-flagRed"
            }`}
          >
            {status.connected
              ? `Connected · ${status.mode}`
              : "Not connected"}
          </p>
          {status.envLocked ? (
            <p className="text-sm text-steel">
              Credentials are coming from environment variables, so this form
              cannot override them.
            </p>
          ) : null}
          <label className="grid gap-1 text-sm">
            Client ID
            <input
              name="clientId"
              required
              defaultValue={status.clientId}
              disabled={status.envLocked || busy}
              className="rounded border border-white/20 bg-black px-3 py-2 text-white disabled:opacity-60"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Secret
            <input
              name="clientSecret"
              type="password"
              autoComplete="off"
              required={!status.hasSecret}
              placeholder={status.hasSecret ? "Saved — enter a new secret to replace it" : ""}
              disabled={status.envLocked || busy}
              className="rounded border border-white/20 bg-black px-3 py-2 text-white disabled:opacity-60"
            />
          </label>
          <fieldset className="grid gap-2 text-sm">
            <legend>Mode</legend>
            <label className="flex items-center gap-2 text-steel">
              <input
                type="radio"
                name="mode"
                value="sandbox"
                defaultChecked={status.mode === "sandbox"}
                disabled={status.envLocked || busy}
              />
              Sandbox (test payments)
            </label>
            <label className="flex items-center gap-2 text-steel">
              <input
                type="radio"
                name="mode"
                value="live"
                defaultChecked={status.mode === "live"}
                disabled={status.envLocked || busy}
              />
              Live (real charges)
            </label>
          </fieldset>
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
          <h2 className="font-display text-xl text-white">How to get keys</h2>
          <ol className="mt-4 grid list-decimal gap-3 pl-5">
            <li>
              Open{" "}
              <a
                href="https://developer.paypal.com/dashboard/applications"
                target="_blank"
                rel="noreferrer"
                className="text-white underline"
              >
                developer.paypal.com
              </a>{" "}
              and sign in as Joe Ierisi.
            </li>
            <li>
              Create an app under{" "}
              <span className="text-white">Apps & Credentials</span>. Use
              Sandbox for tests, Live when you are ready to take real orders.
            </li>
            <li>Copy the Client ID and Secret into this form and save.</li>
          </ol>
          <p className="mt-4">
            Money lands in the PayPal account that owns the app — typically{" "}
            <span className="text-white">joei21407@gmail.com</span>.
          </p>
        </aside>
      </div>
    </div>
  );
}
