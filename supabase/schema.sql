-- ProductSprint — Supabase Schema
-- Run this in the Supabase SQL editor to set up the database.

-- ─────────────────────────────────────────────────
-- 1. users
--    Mirrors auth.users; stores plan + Stripe link.
-- ─────────────────────────────────────────────────
create table if not exists public.users (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null,
  plan              text not null default 'free' check (plan in ('free', 'premium')),
  stripe_customer_id text unique,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Auto-update updated_at on every row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────
-- 2. usage_events
--    One row per feature use; roll up daily in queries.
-- ─────────────────────────────────────────────────
create table if not exists public.usage_events (
  id         bigserial primary key,
  user_id    uuid not null references public.users(id) on delete cascade,
  feature    text not null,
  used_at    timestamptz not null default now()
);

create index if not exists usage_events_user_feature_date
  on public.usage_events (user_id, feature, used_at);

-- ─────────────────────────────────────────────────
-- 3. subscriptions
--    Synced from Stripe webhooks.
-- ─────────────────────────────────────────────────
create table if not exists public.subscriptions (
  stripe_subscription_id text primary key,
  stripe_customer_id     text not null,
  user_id                uuid references public.users(id) on delete set null,
  status                 text not null,
  price_id               text,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_user_id
  on public.subscriptions (user_id);

create index if not exists subscriptions_customer_id
  on public.subscriptions (stripe_customer_id);

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────
-- 4. analytics_events
--    Anonymous event tracking for pre-monetization
--    validation. No auth required — session_id is a
--    random UUID persisted in localStorage.
-- ─────────────────────────────────────────────────
create table if not exists public.analytics_events (
  id          uuid default gen_random_uuid() primary key,
  session_id  text,
  event_name  text not null,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists analytics_events_name_date
  on public.analytics_events (event_name, created_at desc);

create index if not exists analytics_events_session
  on public.analytics_events (session_id);

-- ─────────────────────────────────────────────────
-- 5. early_access
--    Emails collected from the fake-paywall modal
--    during pre-monetization validation.
-- ─────────────────────────────────────────────────
create table if not exists public.early_access (
  id         uuid default gen_random_uuid() primary key,
  email      text not null,
  source     text not null default 'unknown',
  created_at timestamptz not null default now(),
  constraint early_access_email_unique unique (email)
);

create index if not exists early_access_source
  on public.early_access (source);

-- ─────────────────────────────────────────────────
-- 6. Row-level security
--    All DB operations go through the service-role
--    admin client, so RLS is disabled for simplicity.
--    Re-enable and add policies if you add direct
--    client-side DB access in the future.
-- ─────────────────────────────────────────────────
alter table public.users             disable row level security;
alter table public.usage_events      disable row level security;
alter table public.subscriptions     disable row level security;
alter table public.analytics_events  disable row level security;
alter table public.early_access      disable row level security;
