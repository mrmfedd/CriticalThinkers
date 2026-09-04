import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/cms";

export const metadata: Metadata = {
  title: "About",
};

export default async function AboutPage() {
  const site = await getSiteSettings();
  return (
    <article className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
      <div>
        <p className="text-xs tracking-[0.22em] text-flagRed uppercase">{site.aboutKicker}</p>
        <h1 className="mt-2 font-display text-5xl text-white">{site.aboutHeading}</h1>
        <p className="mt-6 leading-8 text-steel">{site.aboutBody}</p>
        <p className="mt-4 leading-8 text-steel">{site.aboutBody2}</p>
        <Link
          href="/shop"
          className="mt-8 inline-block rounded bg-flagRed px-6 py-3 font-display tracking-[0.16em] text-white uppercase"
        >
          {site.heroCta}
        </Link>
      </div>
      <aside className="h-fit rounded-md border border-white/10 bg-black/40 p-6">
        <img
          src={site.logoUrl}
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
