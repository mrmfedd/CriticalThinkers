import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Thank you",
};

type Props = {
  searchParams: Promise<{ paid?: string; id?: string }>;
};

export default async function ThankYouPage({ searchParams }: Props) {
  const { paid, id } = await searchParams;
  const paypal = paid === "paypal";

  return (
    <div className="mx-auto max-w-2xl rounded-md border border-white/10 bg-black/30 p-10 text-center">
      <h1 className="font-display text-5xl text-white">
        {paypal ? "Payment received" : "Order received"}
      </h1>
      <p className="mt-4 leading-7 text-steel">
        {paypal
          ? `PayPal captured this order${id ? ` (${id})` : ""}. ${site.owner} will follow up at ${site.email} or ${site.phoneDisplay}.`
          : `This was a sample checkout. Connect PayPal in Admin to take live payment. ${site.owner} is at ${site.email}.`}
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
