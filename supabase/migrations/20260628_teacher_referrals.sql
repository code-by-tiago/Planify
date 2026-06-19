-- Fase 5G: programa de indicação professor → professor

alter table public.profiles
  add column if not exists referral_code text;

create unique index if not exists profiles_referral_code_uidx
  on public.profiles (referral_code)
  where referral_code is not null;

comment on column public.profiles.referral_code is
  'Código público de indicação (professor convida professor).';

create table if not exists public.teacher_referrals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade,
  referral_code text not null,
  constraint teacher_referrals_referred_unique unique (referred_id),
  constraint teacher_referrals_no_self check (referrer_id <> referred_id)
);

create index if not exists teacher_referrals_referrer_idx
  on public.teacher_referrals (referrer_id, created_at desc);

comment on table public.teacher_referrals is
  'Indicações entre professores. Crédito/benefício futuro — apenas rastreamento por ora.';

alter table public.teacher_referrals enable row level security;

drop policy if exists "teacher_referrals_select_own" on public.teacher_referrals;
create policy "teacher_referrals_select_own"
on public.teacher_referrals
for select
to authenticated
using (
  referrer_id = auth.uid()
  or referred_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "teacher_referrals_service_insert" on public.teacher_referrals;
create policy "teacher_referrals_service_insert"
on public.teacher_referrals
for insert
to authenticated
with check (public.is_admin() or public.can_access_app());

create or replace function public.planify_generate_referral_code(p_user_id uuid)
returns text
language plpgsql
immutable
as $$
declare
  raw text;
begin
  raw := upper(translate(encode(digest(p_user_id::text, 'sha256'), 'hex'), '0123456789abcdef', 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'));
  return substring(raw from 1 for 8);
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_referral_code text;
begin
  v_referral_code := public.planify_generate_referral_code(new.id);

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    status,
    is_admin,
    is_owner,
    referral_code
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    'teacher',
    'pending',
    false,
    false,
    v_referral_code
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    referral_code = coalesce(public.profiles.referral_code, excluded.referral_code),
    updated_at = now();

  return new;
end;
$$;

update public.profiles
set referral_code = public.planify_generate_referral_code(id)
where referral_code is null or referral_code = '';
