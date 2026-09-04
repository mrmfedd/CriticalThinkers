import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { getSiteSettings } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Contact",
};

export default async function ContactPage() {
  const site = await getSiteSettings();
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div>
        <p className="text-xs tracking-[0.22em] text-flagRed uppercase">
          {site.contactKicker}
        </p>
        <h1 className="mt-2 font-display text-5xl text-white">{site.contactHeading}</h1>
        <p className="mt-4 max-w-md leading-7 text-steel">{site.contactIntro}</p>
        <dl className="mt-8 grid gap-4 text-steel">
          <div>
            <dt className="text-xs tracking-[0.16em] uppercase">Owner</dt>
            <dd className="text-white">{site.owner}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.16em] uppercase">Email</dt>
            <dd>
              <a href={site.emailHref} className="text-white hover:underline">
                {site.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.16em] uppercase">Phone</dt>
            <dd>
              <a href={site.phoneHref} className="text-white hover:underline">
                {site.phoneDisplay}
              </a>
            </dd>
          </div>
        </dl>
      </div>
      <ContactForm owner={site.owner} email={site.email} emailHref={site.emailHref} />
    </div>
  );
}
