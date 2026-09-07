"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { Product, ProductColor, ProductViews } from "@/lib/products";
import { slugify } from "@/lib/products";

const inputClass =
  "rounded border border-white/20 bg-black px-3 py-2 text-white disabled:opacity-60";

type ProductEditorProps = {
  initial: Product;
  isNew?: boolean;
  source?: "postgres" | "storage" | "fallback" | string;
};

export function ProductEditor({
  initial,
  isNew = false,
  source,
}: ProductEditorProps) {
  const router = useRouter();
  const [product, setProduct] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [detailsText, setDetailsText] = useState(initial.details.join("\n"));
  const [sizesText, setSizesText] = useState(initial.sizes.join(", "));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setProduct((current) => ({ ...current, [key]: value }));
  }

  function setColor(index: number, patch: Partial<ProductColor>) {
    setProduct((current) => {
      const previous = current.colors[index];
      const colors = current.colors.map((color, colorIndex) =>
        colorIndex === index ? { ...color, ...patch } : color,
      );
      const nextName = patch.name;
      if (!previous || !nextName || nextName === previous.name || !current.views?.[previous.name]) {
        return { ...current, colors };
      }
      const views = { ...current.views };
      views[nextName] = views[previous.name];
      delete views[previous.name];
      return { ...current, colors, views };
    });
  }

  function setView(colorName: string, view: keyof ProductViews, url: string) {
    setProduct((current) => ({
      ...current,
      views: {
        ...(current.views ?? {}),
        [colorName]: {
          front: current.views?.[colorName]?.front || current.image || "",
          back: current.views?.[colorName]?.back || "",
          [view]: url,
        },
      },
      image:
        view === "front" && current.colors[0]?.name === colorName ? url : current.image,
    }));
  }

  async function uploadView(colorName: string, view: keyof ProductViews, file: File) {
    const slot = `${colorName}:${view}`;
    setError("");
    setMessage("");
    setUploading(slot);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("folder", `products/${product.slug || slugify(product.name) || "new"}`);
      form.set("name", `${slugify(colorName) || "color"}-${view}`);
      if (!isNew && product.slug) {
        form.set("apply", "product");
        form.set("slug", product.slug);
        form.set("color", colorName);
        form.set("view", view);
      }
      const response = await fetch("/api/admin/cms/upload", { method: "POST", body: form });
      const payload = (await readUploadPayload(response)) as {
        error?: string;
        url?: string;
        product?: Product;
      };
      if (!response.ok || !payload.url) {
        setError(payload.error || "Could not upload that image.");
        return;
      }
      setView(colorName, view, payload.url);
      if (payload.error) {
        setError(`${payload.error} Click Save product to keep this photo.`);
      } else {
        setMessage(
          isNew
            ? `${view} photo added. Save the product to keep it.`
            : `${colorName} ${view} photo saved to the database.`,
        );
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload that image.",
      );
    } finally {
      setUploading("");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const payload = {
      ...product,
      slug: product.slug || slugify(product.name),
      details: detailsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      sizes: sizesText
        .split(",")
        .map((size) => size.trim())
        .filter(Boolean),
    };
    const response = await fetch(
      isNew ? "/api/admin/cms/products" : `/api/admin/cms/products/${initial.slug}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const body = (await response.json()) as { error?: string; product?: Product };
    setBusy(false);
    if (!response.ok || !body.product) {
      setError(body.error || "Could not save that product.");
      return;
    }
    setProduct(body.product);
    setMessage("Product saved.");
    if (isNew || body.product.slug !== initial.slug) {
      router.replace(`/admin/products/${body.product.slug}`);
      router.refresh();
    }
  }

  async function onDelete() {
    if (!confirm(`Delete ${product.name}? This removes it from the shop.`)) return;
    setBusy(true);
    setError("");
    const response = await fetch(`/api/admin/cms/products/${initial.slug}`, {
      method: "DELETE",
    });
    const body = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(body.error || "Could not delete that product.");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AdminHeader
        title={isNew ? "New product" : product.name || "Edit product"}
        description="Change the listing customers see: name, price, colors, sizes, photos, and description."
      />
      {source === "storage" ? (
        <p className="mb-6 text-sm text-chrome">
          Photos save to Supabase Storage. Run the SQL on Admin → Database so they
          also write to the shop_products table.
        </p>
      ) : source === "fallback" ? (
        <p className="mb-6 text-sm text-flagRed">
          The database is not connected, so photo changes will not stay saved.
          Connect Supabase in Admin → Database.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-8">
        <section className="grid gap-4 rounded-md border border-white/10 bg-black/40 p-6 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Name
            <input
              required
              value={product.name}
              onChange={(event) => {
                const name = event.target.value;
                setProduct((current) => ({
                  ...current,
                  name,
                  slug: slugTouched ? current.slug : slugify(name),
                }));
              }}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Slug
            <input
              required
              value={product.slug}
              onChange={(event) => {
                setSlugTouched(true);
                update("slug", slugify(event.target.value));
              }}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Price
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={product.price}
              onChange={(event) => update("price", Number(event.target.value))}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Category
            <input
              value={product.category}
              onChange={(event) => update("category", event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Sort order
            <input
              type="number"
              value={product.sortOrder ?? 0}
              onChange={(event) => update("sortOrder", Number(event.target.value))}
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-3 text-sm text-white">
            <input
              type="checkbox"
              checked={Boolean(product.featured)}
              onChange={(event) => update("featured", event.target.checked)}
            />
            Featured on the home page
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            Description
            <textarea
              rows={4}
              value={product.description}
              onChange={(event) => update("description", event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Details (one per line)
            <textarea
              rows={5}
              value={detailsText}
              onChange={(event) => setDetailsText(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Sizes (comma separated)
            <textarea
              rows={5}
              value={sizesText}
              onChange={(event) => setSizesText(event.target.value)}
              className={inputClass}
            />
          </label>
        </section>

        <section className="grid gap-4 rounded-md border border-white/10 bg-black/40 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl text-white">Colors and photos</h2>
              <p className="mt-1 text-sm text-steel">
                Each color has its own front and back photo. Click the picture or
                Replace to upload a JPEG, PNG, or WebP up to 8MB.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                update("colors", [...product.colors, { name: "New color", hex: "#111111" }])
              }
              className="rounded border border-white/20 px-3 py-2 font-display text-xs tracking-[0.14em] uppercase"
            >
              Add color
            </button>
          </div>
          {error ? <p className="text-sm text-flagRed">{error}</p> : null}
          {message ? <p className="text-sm text-chrome">{message}</p> : null}
          <div className="grid gap-6">
            {product.colors.map((color, index) => {
              const views = product.views?.[color.name] ?? { front: product.image, back: "" };
              return (
                <div
                  key={`${color.name}-${index}`}
                  className="grid gap-4 rounded border border-white/10 p-4 md:grid-cols-[160px_1fr]"
                >
                  <div className="grid gap-3">
                    <label className="grid gap-1 text-sm">
                      Color name
                      <input
                        value={color.name}
                        onChange={(event) => setColor(index, { name: event.target.value })}
                        className={inputClass}
                      />
                    </label>
                    <label className="grid gap-1 text-sm">
                      Hex
                      <input
                        value={color.hex}
                        onChange={(event) => setColor(index, { hex: event.target.value })}
                        className={inputClass}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        update(
                          "colors",
                          product.colors.filter((_, colorIndex) => colorIndex !== index),
                        )
                      }
                      className="text-left text-xs text-flagRed"
                    >
                      Remove color
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(["front", "back"] as const).map((view) => (
                      <PhotoSlot
                        key={view}
                        colorName={color.name}
                        view={view}
                        url={views[view] || ""}
                        busy={uploading === `${color.name}:${view}`}
                        disabled={Boolean(uploading) || busy}
                        onUrlChange={(url) => setView(color.name, view, url)}
                        onFile={(file) => void uploadView(color.name, view, file)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {error ? <p className="text-sm text-flagRed">{error}</p> : null}
        {message ? <p className="text-sm text-chrome">{message}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy || Boolean(uploading)}
            className="rounded bg-flagRed px-8 py-3 font-display tracking-[0.16em] text-white uppercase disabled:opacity-60"
          >
            {busy ? "Saving…" : uploading ? "Uploading…" : "Save product"}
          </button>
          {!isNew ? (
            <button
              type="button"
              disabled={busy || Boolean(uploading)}
              onClick={() => void onDelete()}
              className="rounded border border-flagRed px-8 py-3 font-display tracking-[0.16em] text-flagRed uppercase disabled:opacity-60"
            >
              Delete
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

async function readUploadPayload(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Upload failed. Try a JPEG, PNG, or WebP under 8MB.");
  }
}

function PhotoSlot({
  colorName,
  view,
  url,
  busy,
  disabled,
  onUrlChange,
  onFile,
}: {
  colorName: string;
  view: keyof ProductViews;
  url: string;
  busy: boolean;
  disabled: boolean;
  onUrlChange: (url: string) => void;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const blobRef = useRef("");
  const [preview, setPreview] = useState(url);

  useEffect(() => {
    if (!busy) setPreview(url);
  }, [busy, url]);

  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);

  function takeFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || disabled) return;
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    blobRef.current = URL.createObjectURL(file);
    setPreview(blobRef.current);
    onFile(file);
  }

  return (
    <div className="relative grid gap-2 text-sm">
      <p className="capitalize">{view} photo</p>
      <button
        type="button"
        disabled={disabled}
        aria-label={`Replace ${colorName} ${view} photo`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          takeFile(event.dataTransfer.files);
        }}
        className="relative block overflow-hidden rounded-sm border border-white/10 bg-black disabled:opacity-60"
      >
        {preview ? (
          <img
            src={preview}
            alt={`${colorName} ${view}`}
            className="h-28 w-full object-cover"
          />
        ) : (
          <span className="grid h-28 place-items-center text-xs text-steel">
            Drop a photo or click to upload
          </span>
        )}
        {busy ? (
          <span className="absolute inset-0 grid place-items-center bg-black/60 text-xs tracking-[0.14em] text-white uppercase">
            Uploading…
          </span>
        ) : null}
      </button>
      <label className="grid gap-1">
        Image URL
        <input
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="https://… or /designs/…"
          className={inputClass}
        />
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        tabIndex={-1}
        className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
        aria-label={`Upload ${colorName} ${view} photo`}
        onChange={(event) => {
          takeFile(event.target.files);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="w-fit rounded border border-white/20 px-3 py-2 font-display text-xs tracking-[0.14em] uppercase disabled:opacity-60"
      >
        Replace photo
      </button>
    </div>
  );
}
