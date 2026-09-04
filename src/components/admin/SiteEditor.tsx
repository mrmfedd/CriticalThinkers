"use client";

import { FormEvent, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { PublicSite } from "@/lib/cms";

type Field = {
  key: keyof PublicSite;
  label: string;
  textarea?: boolean;
  rows?: number;
};

const groups: Array<{ title: string; description: string; fields: Field[] }> = [
  {
    title: "Identity",
    description: "Name, owner, and contact used in the header, footer, and checkout.",
    fields: [
      { key: "name", label: "Site name" },
      { key: "tagline", label: "Tagline" },
      { key: "owner", label: "Owner" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "phoneDisplay", label: "Phone display" },
      { key: "url", label: "Public URL" },
      { key: "metaDescription", label: "Search description", textarea: true, rows: 3 },
    ],
  },
  {
    title: "Home page",
    description: "Hero, featured heading, and the story block on the front page.",
    fields: [
      { key: "heroKicker", label: "Hero kicker" },
      { key: "heroHeadline", label: "Hero headline" },
      { key: "heroSubhead", label: "Hero subhead", textarea: true, rows: 3 },
      { key: "heroCta", label: "Hero button" },
      { key: "featuredLabel", label: "Featured label" },
      { key: "featuredHeading", label: "Featured heading" },
      { key: "homeStoryHeading", label: "Story heading" },
      { key: "homeStoryBody", label: "Story body", textarea: true, rows: 6 },
    ],
  },
  {
    title: "Shop, about, contact, footer",
    description: "Copy on the other pages and the footer blurb.",
    fields: [
      { key: "shopHeading", label: "Shop heading" },
      { key: "shopIntro", label: "Shop intro", textarea: true, rows: 3 },
      { key: "aboutKicker", label: "About kicker" },
      { key: "aboutHeading", label: "About heading" },
      { key: "aboutBody", label: "About first paragraph", textarea: true, rows: 5 },
      { key: "aboutBody2", label: "About second paragraph", textarea: true, rows: 5 },
      { key: "contactKicker", label: "Contact kicker" },
      { key: "contactHeading", label: "Contact heading" },
      { key: "contactIntro", label: "Contact intro", textarea: true, rows: 4 },
      { key: "footerBlurb", label: "Footer blurb", textarea: true, rows: 3 },
    ],
  },
];

const inputClass =
  "rounded border border-white/20 bg-black px-3 py-2 text-white disabled:opacity-60";

export function SiteEditor({
  initial,
  source,
}: {
  initial: PublicSite;
  source: string;
}) {
  const [settings, setSettings] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "hero" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function setField<K extends keyof PublicSite>(key: K, value: PublicSite[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/cms/site", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const payload = (await response.json()) as { error?: string; settings?: PublicSite };
    setBusy(false);
    if (!response.ok || !payload.settings) {
      setError(payload.error || "Could not save the site.");
      return;
    }
    setSettings(payload.settings);
    setMessage("Site copy saved. Refresh the shop to see it live.");
  }

  async function uploadBrand(kind: "logo" | "hero", file: File) {
    setUploading(kind);
    setError("");
    setMessage("");
    const form = new FormData();
    form.set("file", file);
    form.set("folder", "brand");
    form.set("name", kind);
    form.set("apply", kind);
    const response = await fetch("/api/admin/cms/upload", { method: "POST", body: form });
    const payload = (await response.json()) as {
      error?: string;
      url?: string;
      settings?: PublicSite;
    };
    setUploading(null);
    if (!response.ok || !payload.url) {
      setError(payload.error || "Could not upload that image.");
      return;
    }
    if (payload.settings) setSettings(payload.settings);
    else setField(kind === "logo" ? "logoUrl" : "heroUrl", payload.url);
    setMessage(`${kind === "logo" ? "Logo" : "Hero"} image updated.`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AdminHeader
        title="Website"
        description="Edit the live site from the database. Copy, contact, and brand images all save here."
      />

      <p className="mb-6 text-sm text-steel">
        Saving to {source === "postgres" ? "Supabase tables" : source === "storage" ? "Supabase Storage" : "local fallback until the database is connected"}.
      </p>

      <form onSubmit={onSubmit} className="grid gap-8">
        <section className="grid gap-6 rounded-md border border-white/10 bg-black/40 p-6 md:grid-cols-2">
          <div>
            <h2 className="font-display text-xl text-white">Logo</h2>
            <img
              src={settings.logoUrl}
              alt="Logo"
              className="mt-3 h-28 w-auto rounded-sm border border-white/10"
            />
            <label className="mt-4 block text-sm text-steel">
              Replace logo
              <input
                type="file"
                accept="image/*"
                disabled={Boolean(uploading) || busy}
                className="mt-2 block w-full text-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadBrand("logo", file);
                  event.target.value = "";
                }}
              />
            </label>
            <label className="mt-3 grid gap-1 text-sm">
              Logo URL
              <input
                value={settings.logoUrl}
                onChange={(event) => setField("logoUrl", event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <div>
            <h2 className="font-display text-xl text-white">Hero image</h2>
            <img
              src={settings.heroUrl}
              alt="Hero"
              className="mt-3 h-28 w-full rounded-sm border border-white/10 object-cover"
            />
            <label className="mt-4 block text-sm text-steel">
              Replace hero
              <input
                type="file"
                accept="image/*"
                disabled={Boolean(uploading) || busy}
                className="mt-2 block w-full text-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadBrand("hero", file);
                  event.target.value = "";
                }}
              />
            </label>
            <label className="mt-3 grid gap-1 text-sm">
              Hero URL
              <input
                value={settings.heroUrl}
                onChange={(event) => setField("heroUrl", event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
        </section>

        {groups.map((group) => (
          <section
            key={group.title}
            className="grid gap-4 rounded-md border border-white/10 bg-black/40 p-6"
          >
            <div>
              <h2 className="font-display text-xl text-white">{group.title}</h2>
              <p className="mt-1 text-sm text-steel">{group.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {group.fields.map((field) => (
                <label
                  key={field.key}
                  className={`grid gap-1 text-sm ${field.textarea ? "md:col-span-2" : ""}`}
                >
                  {field.label}
                  {field.textarea ? (
                    <textarea
                      rows={field.rows ?? 4}
                      value={settings[field.key]}
                      onChange={(event) => setField(field.key, event.target.value)}
                      className={inputClass}
                    />
                  ) : (
                    <input
                      value={settings[field.key]}
                      onChange={(event) => setField(field.key, event.target.value)}
                      className={inputClass}
                    />
                  )}
                </label>
              ))}
            </div>
          </section>
        ))}

        {error ? <p className="text-sm text-flagRed">{error}</p> : null}
        {message ? <p className="text-sm text-chrome">{message}</p> : null}
        <button
          type="submit"
          disabled={busy || Boolean(uploading)}
          className="w-fit rounded bg-flagRed px-8 py-3 font-display tracking-[0.16em] text-white uppercase disabled:opacity-60"
        >
          {busy ? "Saving…" : uploading ? "Uploading…" : "Save website"}
        </button>
      </form>
    </div>
  );
}
