"use client";

import { useEffect, useRef, useState } from "react";
import type { CartItem } from "@/lib/cart-context";

type PayPalNamespace = {
  Buttons: (options: {
    style?: { color?: string; shape?: string; label?: string };
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError?: (error: unknown) => void;
  }) => { render: (target: HTMLElement) => Promise<void> };
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

type PayPalButtonsProps = {
  clientId: string;
  items: CartItem[];
  disabled?: boolean;
  validate?: () => void;
  onPaid: (captureId: string) => void;
  onError: (message: string) => void;
};

export function PayPalButtons({
  clientId,
  items,
  disabled,
  validate,
  onPaid,
  onError,
}: PayPalButtonsProps) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const existing = document.getElementById("paypal-sdk");
    if (window.paypal) {
      setReady(true);
      return;
    }
    if (existing) {
      existing.addEventListener("load", () => setReady(true), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId,
    )}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => onError("PayPal failed to load. Refresh and try again.");
    document.body.appendChild(script);
  }, [clientId, onError]);

  useEffect(() => {
    if (!ready || !host.current || disabled || !window.paypal) return;
    const node = host.current;
    node.innerHTML = "";
    const buttons = window.paypal.Buttons({
      style: { color: "gold", shape: "rect", label: "paypal" },
      createOrder: async () => {
        validate?.();
        const response = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              slug: item.slug,
              name: item.name,
              quantity: item.quantity,
              size: item.size,
              color: item.color.name,
            })),
          }),
        });
        const payload = (await response.json()) as { id?: string; error?: string };
        if (!response.ok || !payload.id) {
          throw new Error(payload.error || "Could not start PayPal checkout.");
        }
        return payload.id;
      },
      onApprove: async (data) => {
        const response = await fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderID: data.orderID }),
        });
        const payload = (await response.json()) as {
          captureId?: string;
          orderId?: string;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error || "PayPal could not finish the payment.");
        }
        onPaid(payload.captureId || payload.orderId || data.orderID);
      },
      onError: (error) => {
        onError(error instanceof Error ? error.message : "PayPal checkout failed.");
      },
    });
    void buttons.render(node);
    return () => {
      node.innerHTML = "";
    };
  }, [ready, disabled, items, onPaid, onError, validate]);

  return (
    <div>
      {!ready ? (
        <p className="text-sm text-steel">Loading PayPal…</p>
      ) : null}
      <div ref={host} className="min-h-12" />
    </div>
  );
}
