-- CriticalThinkers.us cart + orders
-- Run this once in the Supabase SQL editor for project bfnodshuhelbkwroyxtj.

create extension if not exists "pgcrypto";

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_slug text not null,
  name text not null,
  image text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null check (quantity > 0 and quantity <= 12),
  size text not null,
  color_name text not null,
  color_hex text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_slug, size, color_name)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.carts(id) on delete set null,
  customer_name text not null,
  email text not null,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  subtotal numeric(10,2) not null default 0,
  status text not null default 'received',
  paid_with text not null default 'sample',
  paypal_order_id text,
  paypal_capture_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_slug text not null,
  name text not null,
  image text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null check (quantity > 0),
  size text not null,
  color_name text not null,
  color_hex text not null
);

create index if not exists cart_items_cart_id_idx on public.cart_items (cart_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
