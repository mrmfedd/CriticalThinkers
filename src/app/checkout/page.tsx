import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getPayPalPublicConfig } from "@/lib/paypal";

export const metadata: Metadata = {
  title: "Checkout",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CheckoutPage() {
  return <CheckoutForm paypal={getPayPalPublicConfig()} />;
}
