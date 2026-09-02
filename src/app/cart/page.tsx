import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = {
  title: "Cart",
};

export default function CartPage() {
  return (
    <div>
      <p className="text-xs tracking-[0.22em] text-flagRed uppercase">Bag</p>
      <h1 className="mb-8 mt-2 font-display text-5xl text-white">Cart</h1>
      <CartView />
    </div>
  );
}
