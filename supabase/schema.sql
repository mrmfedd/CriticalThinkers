-- CriticalThinkers.us cart, orders, and CMS
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
  shipping numeric(10,2) not null default 0,
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

create table if not exists public.site_settings (
  id text primary key default 'main',
  name text not null,
  tagline text not null,
  owner text not null,
  email text not null,
  phone text not null,
  phone_display text not null,
  url text not null default 'https://criticalthinkers.us',
  hero_kicker text not null default '',
  hero_headline text not null default '',
  hero_subhead text not null default '',
  hero_cta text not null default '',
  featured_heading text not null default '',
  featured_label text not null default '',
  home_story_heading text not null default '',
  home_story_body text not null default '',
  footer_blurb text not null default '',
  shop_heading text not null default '',
  shop_intro text not null default '',
  about_kicker text not null default '',
  about_heading text not null default '',
  about_body text not null default '',
  about_body_2 text not null default '',
  contact_kicker text not null default '',
  contact_heading text not null default '',
  contact_intro text not null default '',
  logo_url text not null default '/brand/logo.jpg',
  hero_url text not null default '/products/hero-flag.png',
  meta_description text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price numeric(10,2) not null,
  category text not null default 'T-shirts',
  description text not null default '',
  details jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  views jsonb not null default '{}'::jsonb,
  image text not null default '',
  featured boolean not null default false,
  sort_order integer not null default 0,
  blend_mode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cart_items_cart_id_idx on public.cart_items (cart_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists shop_products_sort_idx on public.shop_products (sort_order, name);

alter table public.orders add column if not exists shipping numeric(10,2) not null default 0;

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.site_settings enable row level security;
alter table public.shop_products enable row level security;

do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit)
  values ('media', 'media', true, 8388608)
  on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit;

  insert into storage.buckets (id, name, public)
  values ('cms', 'cms', false)
  on conflict (id) do nothing;

  drop policy if exists "Public read media" on storage.objects;
  create policy "Public read media"
  on storage.objects for select
  to public
  using (bucket_id = 'media');
exception when others then
  raise notice 'Storage setup skipped: %', sqlerrm;
end $$;
