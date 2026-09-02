import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getPayPalPublicConfig } from "@/lib/paypal";

export const metadata: Metadata = {
  title: "Checkout",
};

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return <CheckoutForm paypal={getPayPalPublicConfig()} />;
}
