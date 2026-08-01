create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'teacher',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  plan_id text,
  status text not null default 'incomplete',
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists email text,
add column if not exists full_name text,
add column if not exists role text not null default 'teacher',
add column if not exists is_admin boolean not null default false,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

alter table public.subscriptions
add column if not exists user_id uuid references auth.users(id) on delete cascade,
add column if not exists plan_id text,
add column if not exists status text not null default 'incomplete',
add column if not exists current_period_end timestamptz,
add column if not exists stripe_customer_id text,
add column if not exists stripe_subscription_id text,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_is_admin on public.profiles(is_admin);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_period_end on public.subscriptions(current_period_end desc);

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user_id
      and (is_admin = true or role = 'admin')
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    is_admin,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'teacher',
    false,
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "Profiles read own or admin" on public.profiles;
create policy "Profiles read own or admin"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "Profiles update own or admin" on public.profiles;
create policy "Profiles update own or admin"
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_admin(auth.uid()))
with check (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "Subscriptions read own or admin" on public.subscriptions;
create policy "Subscriptions read own or admin"
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Subscriptions update admin only" on public.subscriptions;
create policy "Subscriptions update admin only"
on public.subscriptions
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Subscriptions delete admin only" on public.subscriptions;
create policy "Subscriptions delete admin only"
on public.subscriptions
for delete
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Subscriptions insert admin only" on public.subscriptions;
create policy "Subscriptions insert admin only"
on public.subscriptions
for insert
to authenticated
with check (public.is_admin(auth.uid()));

-- Opcional: políticas admin para histórico, caso a tabela user_history exista.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'user_history'
  ) then
    execute 'drop policy if exists "History admin read all" on public.user_history';
    execute 'create policy "History admin read all" on public.user_history for select to authenticated using (public.is_admin(auth.uid()))';

    execute 'drop policy if exists "History admin update all" on public.user_history';
    execute 'create policy "History admin update all" on public.user_history for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))';

    execute 'drop policy if exists "History admin delete all" on public.user_history';
    execute 'create policy "History admin delete all" on public.user_history for delete to authenticated using (public.is_admin(auth.uid()))';
  end if;
end $$;
