"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/app/admin/actions";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, null);

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form
        action={action}
        className="w-full rounded-md border border-white/10 bg-black/40 p-8"
      >
        <p className="text-xs tracking-[0.22em] text-flagRed uppercase">
          CriticalThinkers.us
        </p>
        <h1 className="mt-2 font-display text-4xl text-white">Admin</h1>
        <p className="mt-3 text-sm text-steel">
          Sign in to edit the website, products, images, PayPal, and orders.
        </p>
        <label className="mt-6 grid gap-1 text-sm text-steel">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            defaultValue="ThinkAgain2026"
            className="rounded border border-white/20 bg-black px-3 py-2 text-white"
          />
        </label>
        <p className="mt-2 text-xs text-steel">
          Password: <span className="text-white">ThinkAgain2026</span>
        </p>
        {state?.error ? (
          <p className="mt-3 text-sm text-flagRed">{state.error}</p>
        ) : null}
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
