import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-md border border-white/10 bg-black/30 p-10 text-center">
      <h1 className="font-display text-5xl text-white">Page not found</h1>
      <p className="mt-3 text-steel">That route is not in the collection.</p>
      <Link
        href="/shop"
        className="mt-6 inline-block rounded bg-flagRed px-6 py-3 font-display tracking-[0.16em] text-white uppercase"
      >
        Back to shop
      </Link>
    </div>
  );
}
