import type { ProductColor } from "@/lib/products";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size: string;
  color: ProductColor;
};

export type StoredOrderItem = {
  name: string;
  quantity: number;
  size: string;
  color_name: string;
  unit_price: number;
};

export type StoredOrder = {
  id: string;
  customer_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  subtotal: number;
  status: string;
  paid_with: string;
  paypal_capture_id: string | null;
  created_at: string;
  items: StoredOrderItem[];
};

