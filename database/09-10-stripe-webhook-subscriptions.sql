create table if not exists public.subscriptions (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  plan_id text,
  plan_key text,
  price_id text,
  status text not null default 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  stripe_customer_id text,
  stripe_customer_email text,
  stripe_subscription_id text,
  last_stripe_event_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
add column if not exists user_id uuid references auth.users(id) on delete set null,
add column if not exists plan_id text,
add column if not exists plan_key text,
add column if not exists price_id text,
add column if not exists status text not null default 'incomplete',
add column if not exists current_period_start timestamptz,
add column if not exists current_period_end timestamptz,
add column if not exists cancel_at_period_end boolean not null default false,
add column if not exists canceled_at timestamptz,
add column if not exists stripe_customer_id text,
add column if not exists stripe_customer_email text,
add column if not exists stripe_subscription_id text,
add column if not exists last_stripe_event_type text,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_customer_id on public.subscriptions(stripe_customer_id);
create index if not exists idx_subscriptions_customer_email on public.subscriptions(stripe_customer_email);
create index if not exists idx_subscriptions_period_end on public.subscriptions(current_period_end desc);

alter table public.subscriptions enable row level security;

drop policy if exists "Subscriptions read own or admin" on public.subscriptions;
create policy "Subscriptions read own or admin"
on public.subscriptions
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and (profiles.is_admin = true or profiles.role = 'admin')
  )
);

drop policy if exists "Subscriptions admin insert" on public.subscriptions;
create policy "Subscriptions admin insert"
on public.subscriptions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and (profiles.is_admin = true or profiles.role = 'admin')
  )
);

drop policy if exists "Subscriptions admin update" on public.subscriptions;
create policy "Subscriptions admin update"
on public.subscriptions
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and (profiles.is_admin = true or profiles.role = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and (profiles.is_admin = true or profiles.role = 'admin')
  )
);
