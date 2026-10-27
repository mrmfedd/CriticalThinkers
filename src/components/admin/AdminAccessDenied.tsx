import Link from "next/link";

export function AdminAccessDenied({ area }: { area: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-xs tracking-[0.22em] text-flagRed uppercase">Admin</p>
      <h1 className="mt-2 font-display text-3xl text-white">Owners only</h1>
      <p className="mt-3 text-sm text-steel">
        Your account can edit the website and products, but {area} is limited to
        owners.
      </p>
      <Link
        href="/admin"
        className="mt-8 inline-block rounded bg-flagRed px-6 py-3 font-display text-xs tracking-[0.14em] text-white uppercase"
      >
        Back to website
      </Link>
    </div>
  );
}
