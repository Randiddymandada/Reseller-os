-- ─── ResellerOS Supabase Schema ───────────────────────────────────────────────
-- Run this in your Supabase SQL editor (Database → SQL Editor → New query)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── User Plans ───────────────────────────────────────────────────────────────
create table if not exists public.user_plans (
  id                      uuid default uuid_generate_v4() primary key,
  user_id                 uuid references auth.users(id) on delete cascade not null unique,
  plan                    text not null default 'free' check (plan in ('free', 'pro', 'premium')),
  stripe_subscription_id  text,
  stripe_customer_id      text,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- Auto-create plan row when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_plans (user_id, plan)
  values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.user_plans enable row level security;

create policy "Users can read own plan" on public.user_plans
  for select using (auth.uid() = user_id);

create policy "Service role can update plans" on public.user_plans
  for all using (true) with check (true);

-- ─── Inventory ────────────────────────────────────────────────────────────────
create table if not exists public.inventory (
  id                  uuid default uuid_generate_v4() primary key,
  user_id             uuid references auth.users(id) on delete cascade not null,
  name                text not null,
  category            text not null default '',
  size                text not null default 'N/A',
  condition           text not null default 'New',
  buy_price           numeric(10,2) not null default 0,
  expected_sell_price numeric(10,2) not null default 0,
  quantity            int not null default 1,
  source              text default '',
  date_bought         date,
  status              text not null default 'In Stock' check (status in ('In Stock','Listed','Sold','Shipped')),
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.inventory enable row level security;
create policy "Users manage own inventory" on public.inventory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Customers ────────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  email       text not null,
  phone       text,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.customers enable row level security;
create policy "Users manage own customers" on public.customers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Orders ───────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id               uuid default uuid_generate_v4() primary key,
  user_id          uuid references auth.users(id) on delete cascade not null,
  order_number     text not null,
  customer_id      uuid references public.customers(id) on delete set null,
  customer_name    text not null,
  item_id          uuid references public.inventory(id) on delete set null,
  item_name        text not null,
  sale_price       numeric(10,2) not null default 0,
  shipping_cost    numeric(10,2) not null default 0,
  payment_method   text not null default 'Other',
  status           text not null default 'Pending' check (status in ('Pending','Paid','Packed','Shipped','Delivered','Cancelled')),
  date             date not null default now(),
  tracking_number  text,
  receipt_id       uuid,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.orders enable row level security;
create policy "Users manage own orders" on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Receipts ─────────────────────────────────────────────────────────────────
create table if not exists public.receipts (
  id               uuid default uuid_generate_v4() primary key,
  user_id          uuid references auth.users(id) on delete cascade not null,
  receipt_number   text not null,
  customer_name    text not null,
  customer_email   text,
  item_id          uuid references public.inventory(id) on delete set null,
  item_name        text not null,
  sale_price       numeric(10,2) not null default 0,
  shipping_cost    numeric(10,2) not null default 0,
  tax              numeric(10,2) not null default 0,
  total            numeric(10,2) not null default 0,
  payment_method   text not null default 'Other',
  date             date not null default now(),
  seller_name      text not null,
  seller_email     text,
  seller_phone     text,
  notes            text,
  verified         boolean default true,
  order_id         uuid references public.orders(id) on delete set null,
  created_at       timestamptz default now()
);

alter table public.receipts enable row level security;

-- Receipts have public read for verification by receipt number
create policy "Anyone can verify receipts" on public.receipts
  for select using (true);

create policy "Users manage own receipts" on public.receipts
  for insert with check (auth.uid() = user_id);

create policy "Users update own receipts" on public.receipts
  for update using (auth.uid() = user_id);

create policy "Users delete own receipts" on public.receipts
  for delete using (auth.uid() = user_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_inventory_user_id  on public.inventory(user_id);
create index if not exists idx_customers_user_id  on public.customers(user_id);
create index if not exists idx_orders_user_id     on public.orders(user_id);
create index if not exists idx_receipts_user_id   on public.receipts(user_id);
create index if not exists idx_receipts_number    on public.receipts(receipt_number);
create index if not exists idx_user_plans_user    on public.user_plans(user_id);
