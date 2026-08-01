alter table if exists public.profiles
add column if not exists email text,
add column if not exists full_name text,
add column if not exists role text not null default 'teacher',
add column if not exists is_admin boolean not null default false;

alter table if exists public.subscriptions
add column if not exists user_id uuid references auth.users(id) on delete cascade,
add column if not exists plan_id text,
add column if not exists status text not null default 'incomplete',
add column if not exists current_period_end timestamptz,
add column if not exists stripe_customer_id text,
add column if not exists stripe_subscription_id text,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_is_admin on public.profiles(is_admin);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_period_end on public.subscriptions(current_period_end desc);

alter table if exists public.profiles enable row level security;
alter table if exists public.subscriptions enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can read own subscriptions" on public.subscriptions;
create policy "Users can read own subscriptions"
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);
