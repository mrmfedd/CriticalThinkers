import Link from "next/link";
import { getFeaturedProducts, getSiteSettings } from "@/lib/cms";
import { ProductCard } from "@/components/ProductCard";

export default async function HomePage() {
  const [featured, site] = await Promise.all([getFeaturedProducts(), getSiteSettings()]);

  return (
    <div className="grid gap-16">
      <section className="relative overflow-hidden rounded-md border border-white/10">
        <img
          src={site.heroUrl}
          alt="American flag"
          className="h-[520px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-end px-6 pb-12 text-center">
          <img
            src={site.logoUrl}
            alt={site.name}
            className="mb-6 h-24 w-auto rounded-sm border border-white/20 shadow-metal md:h-32"
          />
          <p className="font-display text-sm tracking-[0.35em] text-white uppercase">
            {site.heroKicker}
          </p>
          <h1 className="chrome-text mt-3 max-w-4xl font-display text-4xl leading-tight tracking-wide md:text-6xl">
            {site.heroHeadline.toUpperCase()}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-chrome">{site.heroSubhead}</p>
          <Link
            href="/shop"
            className="mt-8 rounded bg-flagRed px-8 py-3 font-display tracking-[0.2em] text-white uppercase"
          >
            {site.heroCta}
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-flagRed uppercase">
              {site.featuredLabel}
            </p>
            <h2 className="mt-2 font-display text-4xl text-white">{site.featuredHeading}</h2>
          </div>
          <Link href="/shop" className="text-sm tracking-[0.12em] text-steel uppercase hover:text-white">
            View all
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product, index) => (
            <ProductCard
              key={product.slug}
              product={product}
              defaultColor={product.colors[index % product.colors.length]?.name}
              view="back"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
