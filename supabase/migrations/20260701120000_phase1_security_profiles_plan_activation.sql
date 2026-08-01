-- Phase 1 security: prevent self-service profiles.plan escalation + atomic activation claims.

create or replace function public.profiles_guard_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.plan is distinct from old.plan then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'profiles.plan is read-only for non-admin users';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_columns on public.profiles;
create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row
  execute function public.profiles_guard_privileged_columns();

create table if not exists public.subscription_activation_claims (
  email text primary key,
  claimed_at timestamptz not null default now(),
  user_id uuid null references auth.users (id) on delete set null,
  checkout_session_id text null
);

comment on table public.subscription_activation_claims is
  'Reserves payer email during post-checkout account creation (service role only).';

alter table public.subscription_activation_claims enable row level security;
