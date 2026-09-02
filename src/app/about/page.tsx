import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { getBrandImages } from "@/lib/image-store";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  const brand = getBrandImages();
  return (
    <article className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
      <div>
        <p className="text-xs tracking-[0.22em] text-flagRed uppercase">Mission</p>
        <h1 className="mt-2 font-display text-5xl text-white">
          Make America Think Again
        </h1>
        <p className="mt-6 leading-8 text-steel">
          CriticalThinkers.us exists because slogans are easy and thinking is
          not. {site.owner} built this shop for people who still read the
          source, test the claim, and refuse to outsource their judgment.
        </p>
        <p className="mt-4 leading-8 text-steel">
          The merch is the uniform. The work is the argument. If you want a
          flag on your chest and a question in your mouth, you are in the right
          store.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block rounded bg-flagRed px-6 py-3 font-display tracking-[0.16em] text-white uppercase"
        >
          Shop the collection
        </Link>
      </div>
      <aside className="h-fit rounded-md border border-white/10 bg-black/40 p-6">
        <img
          src={brand.logo}
          alt={site.name}
          className="mb-5 w-full rounded-sm border border-white/10"
        />
        <p className="font-display text-xl text-white">{site.owner}</p>
        <p className="mt-2 text-sm text-steel">Founder, {site.name}</p>
        <a href={site.emailHref} className="mt-4 block text-sm hover:text-white">
          {site.email}
        </a>
        <a href={site.phoneHref} className="mt-1 block text-sm hover:text-white">
          {site.phoneDisplay}
        </a>
      </aside>
    </article>
  );
}
