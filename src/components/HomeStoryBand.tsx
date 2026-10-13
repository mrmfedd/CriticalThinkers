import type { PublicSite } from "@/lib/cms";

export function HomeStoryBand({ site }: { site: PublicSite }) {
  return (
    <section
      aria-labelledby="home-story-heading"
      className="border-t border-white/10 bg-black/30"
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2">
        <div>
          <h2 id="home-story-heading" className="font-display text-3xl text-white">
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
    </section>
  );
}
