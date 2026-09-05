"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/lib/cart-types";
import { withShipping } from "@/lib/commerce";

export type { CartItem };

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "quantity">, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  databaseConnected: boolean;
};

const STORAGE_KEY = "ct-cart-v2";
const CartContext = createContext<CartContextValue | null>(null);

function makeId(slug: string, size: string, color: string) {
  return `${slug}::${size}::${color}`;
}

function readLocalCart() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const persistGeneration = useRef(0);

  useEffect(() => {
    const local = readLocalCart();
    let cancelled = false;

    async function hydrate() {
      try {
        const response = await fetch("/api/cart");
        const payload = (await response.json()) as {
          items?: CartItem[];
          connected?: boolean;
        };
        if (cancelled) return;
        setDatabaseConnected(Boolean(payload.connected));
        if (payload.connected && Array.isArray(payload.items) && payload.items.length) {
          setItems(payload.items);
        } else {
          setItems(local);
        }
      } catch {
        if (!cancelled) {
          setDatabaseConnected(false);
          setItems(local);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    const generation = persistGeneration.current;
    const timer = window.setTimeout(() => {
      if (generation !== persistGeneration.current) return;
      void fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
        .then(async (response) => {
          const payload = (await response.json().catch(() => null)) as
            | { connected?: boolean }
            | null;
          if (generation === persistGeneration.current) {
            setDatabaseConnected(Boolean(payload?.connected));
          }
        })
        .catch(() => {
          if (generation === persistGeneration.current) {
            setDatabaseConnected(false);
          }
        });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [items, ready]);

  const addItem = useCallback(
    (item: Omit<CartItem, "id" | "quantity">, quantity = 1) => {
      setItems((current) => {
        const id = makeId(item.slug, item.size, item.color.name);
        const existing = current.find((entry) => entry.id === id);
        if (existing) {
          return current.map((entry) =>
            entry.id === id
              ? { ...entry, quantity: Math.min(12, entry.quantity + quantity) }
              : entry,
          );
        }
        return [...current, { ...item, id, quantity }];
      });
    },
    [],
  );

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    persistGeneration.current += 1;
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const totals = withShipping(subtotal, items.length > 0);
    return {
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      itemCount,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.total,
      databaseConnected,
    };
  }, [items, addItem, updateQuantity, removeItem, clearCart, databaseConnected]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
