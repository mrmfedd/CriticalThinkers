import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div>
        <p className="text-xs tracking-[0.22em] text-flagRed uppercase">Reach us</p>
        <h1 className="mt-2 font-display text-5xl text-white">Contact</h1>
        <p className="mt-4 max-w-md leading-7 text-steel">
          Questions about an order, a wholesale run, or the next drop? Write or
          call {site.owner} directly.
        </p>
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
      <ContactForm />
    </div>
  );
}
