import Link from "next/link";
import type { PublicSite } from "@/lib/cms";

export function Footer({
  logoSrc = "/brand/logo.jpg",
  site,
  className = "mt-16",
}: {
  logoSrc?: string;
  site: PublicSite;
  className?: string;
}) {
  return (
    <footer className={`border-t border-white/10 bg-black/50 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div
          className="grid gap-8 rounded-md border border-white/10 bg-black/30 p-8 md:grid-cols-2"
          aria-labelledby="footer-story-heading"
        >
          <div>
            <h2 id="footer-story-heading" className="font-display text-3xl text-white">
              {site.homeStoryHeading}
            </h2>
            <p className="mt-4 leading-7 text-steel">{site.homeStoryBody}</p>
          </div>
          <div className="grid gap-2 self-center text-steel">
            <p className="text-white">{site.owner}</p>
            <a href={site.emailHref} className="hover:text-white">
              {site.email}
            </a>
            <a href={site.phoneHref} className="hover:text-white">
              {site.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2">
        <div>
          <img
            src={logoSrc}
            alt={site.name}
            className="mb-4 h-16 w-auto rounded-sm border border-white/10"
          />
          <p className="max-w-sm text-sm leading-6 text-steel">{site.footerBlurb}</p>
        </div>
        <div>
          <h2 className="font-display text-sm tracking-[0.2em] text-white uppercase">
            Visit
          </h2>
          <div className="mt-4 grid gap-2 text-sm text-steel">
            <Link href="/shop" className="hover:text-white">
              Shop
            </Link>
            <Link href="/about" className="hover:text-white">
              About
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
            <Link href="/cart" className="hover:text-white">
              Cart
            </Link>
          </div>
        </div>
      </div>
      <div className="star-bar mx-auto mb-8 flex max-w-6xl items-center justify-center gap-6 rounded-sm px-4 py-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index} className="text-lg text-white" aria-hidden>
            ★
          </span>
        ))}
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-steel">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </p>
    </footer>
  );
}
