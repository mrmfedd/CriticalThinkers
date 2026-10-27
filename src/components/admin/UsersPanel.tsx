"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { AdminRole, AdminUser } from "@/lib/admin-users";

type Probe = {
  ok?: boolean;
  needsSchema?: boolean;
  error?: string;
};

export function UsersPanel({ schemaSql }: { schemaSql: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [probe, setProbe] = useState<Probe>({ ok: false });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/users");
    const payload = (await response.json()) as {
      users?: AdminUser[];
      probe?: Probe;
      error?: string;
    };
    if (!response.ok) {
      setError(payload.error || "Could not load team members.");
      return;
    }
    setProbe(payload.probe ?? { ok: false });
    setUsers(payload.users ?? []);
    setError("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") || ""),
        email: String(form.get("email") || ""),
        password: String(form.get("password") || ""),
        role: String(form.get("role") || "editor"),
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error || "Could not add user.");
      return;
    }
    setMessage("Team member added. They can sign in with their email and password.");
    event.currentTarget.reset();
    await load();
  }

  async function patchUser(
    id: string,
    patch: {
      name?: string;
      role?: AdminRole;
      active?: boolean;
      password?: string;
    },
  ) {
    setError("");
    setMessage("");
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error || "Could not update user.");
      return false;
    }
    await load();
    return true;
  }

  async function removeUser(id: string) {
    if (!window.confirm("Remove this team member? They will lose admin access.")) {
      return;
    }
    setError("");
    const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error || "Could not remove user.");
      return;
    }
    setMessage("Team member removed.");
    await load();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AdminHeader
        title="Team"
        description="Add people who can sign in to update the website and products. Owners can also manage PayPal, database keys, and this team list."
      />

      {probe.needsSchema ? (
        <div className="mb-8 rounded-md border border-flagRed/40 bg-black/40 p-6">
          <p className="text-sm text-white">
            Run the updated SQL in Supabase once to enable team accounts.
          </p>
          <p className="mt-2 text-sm text-steel">{probe.error}</p>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(schemaSql);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            }}
            className="mt-4 rounded border border-white/20 px-4 py-2 font-display text-xs tracking-[0.14em] text-white uppercase"
          >
            {copied ? "Copied" : "Copy schema SQL"}
          </button>
        </div>
      ) : null}

      {!probe.ok && !probe.needsSchema ? (
        <p className="mb-8 rounded-md border border-white/10 bg-black/30 p-6 text-steel">
          {probe.error ||
            "Connect Supabase in Admin → Database before adding team members."}
        </p>
      ) : null}

      {probe.ok ? (
        <form
          onSubmit={onCreate}
          className="mb-10 grid gap-4 rounded-md border border-white/10 bg-black/30 p-6 md:grid-cols-2"
        >
          <h2 className="font-display text-2xl text-white md:col-span-2">
            Add team member
          </h2>
          <label className="grid gap-1 text-sm text-steel">
            Name
            <input
              name="name"
              required
              className="rounded border border-white/20 bg-black px-3 py-2 text-white"
            />
          </label>
          <label className="grid gap-1 text-sm text-steel">
            Email
            <input
              name="email"
              type="email"
              required
              className="rounded border border-white/20 bg-black px-3 py-2 text-white"
            />
          </label>
          <label className="grid gap-1 text-sm text-steel">
            Password
            <input
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className="rounded border border-white/20 bg-black px-3 py-2 text-white"
            />
          </label>
          <label className="grid gap-1 text-sm text-steel">
            Access
            <select
              name="role"
              className="rounded border border-white/20 bg-black px-3 py-2 text-white"
              defaultValue="editor"
            >
              <option value="editor">Editor — website, products, orders</option>
              <option value="owner">Owner — full admin including integrations</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded bg-flagRed px-6 py-3 font-display text-xs tracking-[0.14em] text-white uppercase disabled:opacity-60"
            >
              {busy ? "Adding…" : "Add user"}
            </button>
          </div>
        </form>
      ) : null}

      {error ? <p className="mb-4 text-sm text-flagRed">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-chrome">{message}</p> : null}

      <div className="grid gap-4">
        {users.map((user) => (
          <article
            key={user.id}
            className="rounded-md border border-white/10 bg-black/30 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-white">{user.name}</h2>
                <p className="mt-1 text-sm text-steel">{user.email}</p>
                <p className="mt-1 text-xs tracking-[0.14em] text-steel uppercase">
                  {user.role}
                  {user.active ? "" : " · inactive"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void patchUser(user.id, { active: !user.active })
                  }
                  className="rounded border border-white/20 px-3 py-2 font-display text-xs tracking-[0.12em] text-white uppercase"
                >
                  {user.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = user.role === "owner" ? "editor" : "owner";
                    void patchUser(user.id, { role: next });
                  }}
                  className="rounded border border-white/20 px-3 py-2 font-display text-xs tracking-[0.12em] text-white uppercase"
                >
                  Make {user.role === "owner" ? "editor" : "owner"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const password = window.prompt(
                      `New password for ${user.email} (min 8 characters):`,
                    );
                    if (!password) return;
                    void patchUser(user.id, { password });
                  }}
                  className="rounded border border-white/20 px-3 py-2 font-display text-xs tracking-[0.12em] text-white uppercase"
                >
                  Reset password
                </button>
                <button
                  type="button"
                  onClick={() => void removeUser(user.id)}
                  className="rounded border border-flagRed/50 px-3 py-2 font-display text-xs tracking-[0.12em] text-flagRed uppercase"
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {probe.ok && users.length === 0 ? (
        <p className="mt-6 text-sm text-steel">
          No team accounts yet. Add someone above, or keep using the master
          password with a blank email on the sign-in screen.
        </p>
      ) : null}
    </div>
  );
}
