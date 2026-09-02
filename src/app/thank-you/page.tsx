import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Thank you",
};

export default function ThankYouPage() {
  return (
    <div className="mx-auto max-w-2xl rounded-md border border-white/10 bg-black/30 p-10 text-center">
      <h1 className="font-display text-5xl text-white">Order received</h1>
      <p className="mt-4 leading-7 text-steel">
        This is a sample checkout. {site.owner} will follow up at{" "}
        {site.email} or {site.phoneDisplay} when live payment is connected.
      </p>
      <Link
        href="/shop"
        className="mt-8 inline-block rounded bg-flagRed px-6 py-3 font-display tracking-[0.16em] text-white uppercase"
      >
        Back to shop
      </Link>
    </div>
  );
}
