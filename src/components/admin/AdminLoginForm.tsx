"use client";

import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setPending(false);
    if (!response.ok) {
      setError("That password did not match.");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full rounded-md border border-white/10 bg-black/40 p-8"
      >
        <p className="text-xs tracking-[0.22em] text-flagRed uppercase">
          CriticalThinkers.us
        </p>
        <h1 className="mt-2 font-display text-4xl text-white">Admin</h1>
        <p className="mt-3 text-sm text-steel">
          Sign in to replace shop, logo, and hero images.
        </p>
        <label className="mt-6 grid gap-1 text-sm text-steel">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="rounded border border-white/20 bg-black px-3 py-2 text-white"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-flagRed">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded bg-flagRed px-6 py-3 font-display tracking-[0.16em] text-white uppercase disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
