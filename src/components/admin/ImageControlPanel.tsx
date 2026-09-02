"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/Modal";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { Product } from "@/lib/products";

type BrandImages = {
  logo: string;
  hero: string;
};

type Draft = {
  kind: "brand" | "product";
  key: string;
  title: string;
  file: File;
  preview: string;
};

type ImageControlPanelProps = {
  products: Product[];
  brand: BrandImages;
  originals: {
    brand: BrandImages;
    products: Record<string, string>;
  };
};

export function ImageControlPanel({
  products,
  brand,
  originals,
}: ImageControlPanelProps) {
  const [brandUrls, setBrandUrls] = useState(brand);
  const [productUrls, setProductUrls] = useState(() =>
    Object.fromEntries(products.map((product) => [product.slug, product.image])),
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const previewUrl = draft?.preview ?? "";

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const closeDraft = useCallback(() => {
    setDraft((current) => {
      if (current?.preview.startsWith("blob:")) {
        URL.revokeObjectURL(current.preview);
      }
      return null;
    });
  }, []);

  function openDraft(
    kind: "brand" | "product",
    key: string,
    title: string,
    file: File,
  ) {
    if (!file.type.startsWith("image/")) {
      setMessage("Choose an image file.");
      return;
    }
    setMessage("");
    setDraft({
      kind,
      key,
      title,
      file,
      preview: URL.createObjectURL(file),
    });
  }

  async function saveDraft() {
    if (!draft) return;
    setBusy(true);
    const form = new FormData();
    form.set("file", draft.file);
    form.set("kind", draft.kind);
    form.set("key", draft.key);
    const response = await fetch("/api/admin/images", {
      method: "POST",
      body: form,
    });
    const payload = (await response.json()) as { url?: string; error?: string };
    setBusy(false);
    if (!response.ok || !payload.url) {
      setMessage(payload.error || "Upload failed.");
      return;
    }
    if (draft.kind === "brand") {
      setBrandUrls((current) => ({ ...current, [draft.key]: payload.url }));
    } else {
      setProductUrls((current) => ({ ...current, [draft.key]: payload.url! }));
    }
    setMessage(`Updated ${draft.title}.`);
    closeDraft();
  }

  async function revert(kind: "brand" | "product", key: string, title: string) {
    setBusy(true);
    const response = await fetch("/api/admin/images/revert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, key }),
    });
    const payload = (await response.json()) as { url?: string; error?: string };
    setBusy(false);
    if (!response.ok || !payload.url) {
      setMessage(payload.error || "Could not revert that image.");
      return;
    }
    if (kind === "brand") {
      setBrandUrls((current) => ({ ...current, [key]: payload.url }));
    } else {
      setProductUrls((current) => ({ ...current, [key]: payload.url! }));
    }
    setMessage(`Restored the original ${title} image.`);
  }

  const slots = useMemo(
    () => [
      {
        kind: "brand" as const,
        key: "logo",
        title: "Logo",
        current: brandUrls.logo,
        original: originals.brand.logo,
        wide: false,
      },
      {
        kind: "brand" as const,
        key: "hero",
        title: "Homepage hero",
        current: brandUrls.hero,
        original: originals.brand.hero,
        wide: true,
      },
    ],
    [brandUrls, originals.brand],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AdminHeader
        title="Edit images"
        description="Replace the logo, homepage flag, or any shop photo. JPEG, PNG, or WebP up to 8MB."
      />

      {message ? (
        <p className="mb-6 rounded border border-white/10 bg-black/40 px-4 py-3 text-sm text-chrome">
          {message}
        </p>
      ) : null}

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white">Brand</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {slots.map((slot) => (
            <ImageSlotCard
              key={slot.key}
              title={slot.title}
              image={slot.current}
              custom={slot.current !== slot.original}
              wide={slot.wide}
              disabled={busy}
              active={dragging === `${slot.kind}:${slot.key}`}
              onPick={(file) => openDraft(slot.kind, slot.key, slot.title, file)}
              onDragState={(on) =>
                setDragging(on ? `${slot.kind}:${slot.key}` : null)
              }
              onRevert={() => revert(slot.kind, slot.key, slot.title)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl text-white">Shop products</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const current = productUrls[product.slug] || product.image;
            return (
              <ImageSlotCard
                key={product.slug}
                title={product.name}
                image={current}
                custom={current !== originals.products[product.slug]}
                disabled={busy}
                active={dragging === `product:${product.slug}`}
                onPick={(file) =>
                  openDraft("product", product.slug, product.name, file)
                }
                onDragState={(on) =>
                  setDragging(on ? `product:${product.slug}` : null)
                }
                onRevert={() => revert("product", product.slug, product.name)}
              />
            );
          })}
        </div>
      </section>

      <ReplaceModal
        draft={draft}
        busy={busy}
        onClose={closeDraft}
        onSave={saveDraft}
      />
    </div>
  );
}

function ImageSlotCard({
  title,
  image,
  custom,
  wide = false,
  disabled,
  active,
  onPick,
  onDragState,
  onRevert,
}: {
  title: string;
  image: string;
  custom: boolean;
  wide?: boolean;
  disabled: boolean;
  active: boolean;
  onPick: (file: File) => void;
  onDragState: (on: boolean) => void;
  onRevert: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function takeFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (file) onPick(file);
  }

  return (
    <article
      className={`overflow-hidden rounded-md border bg-black/40 ${
        active ? "border-flagRed" : "border-white/10"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        onDragState(true);
      }}
      onDragLeave={() => onDragState(false)}
      onDrop={(event) => {
        event.preventDefault();
        onDragState(false);
        takeFile(event.dataTransfer.files);
      }}
    >
      <img
        src={image}
        alt={title}
        className={`w-full object-cover ${wide ? "h-48" : "aspect-square"}`}
      />
      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg text-white">{title}</h3>
          {custom ? (
            <span className="text-[11px] tracking-[0.14em] text-flagRed uppercase">
              Custom
            </span>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          aria-label={`Replace ${title} image`}
          onChange={(event) => {
            takeFile(event.target.files);
            event.currentTarget.value = "";
          }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex-1 rounded bg-flagRed px-3 py-2 font-display text-xs tracking-[0.14em] text-white uppercase disabled:opacity-60"
          >
            Replace image
          </button>
          {custom ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onRevert}
              className="rounded border border-white/20 px-3 py-2 font-display text-xs tracking-[0.14em] uppercase disabled:opacity-60"
            >
              Revert
            </button>
          ) : null}
        </div>
        <p className="text-xs text-steel">Or drop a file onto this card.</p>
      </div>
    </article>
  );
}

function ReplaceModal({
  draft,
  busy,
  onClose,
  onSave,
}: {
  draft: Draft | null;
  busy: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      open={Boolean(draft)}
      title={draft ? `Replace ${draft.title}` : "Replace image"}
      onClose={busy ? () => undefined : onClose}
    >
      {draft ? (
        <div>
          <img
            src={draft.preview}
            alt={`Preview of new ${draft.title} image`}
            className="mb-4 max-h-72 w-full rounded object-contain bg-black"
          />
          <p className="text-sm text-steel">{draft.file.name}</p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={onSave}
              className="flex-1 rounded bg-flagRed px-4 py-3 font-display tracking-[0.12em] text-white uppercase disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save image"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="flex-1 rounded border border-white/20 px-4 py-3 font-display tracking-[0.12em] uppercase disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
