-- Planify 10.0 — Créditos e histórico real para o Gerador IA de Materiais Didáticos
-- Execute no Supabase SQL Editor antes de liberar o gerador para usuários comuns.

create extension if not exists pgcrypto;

create table if not exists public.credit_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  monthly_limit integer not null default 0 check (monthly_limit >= 0),
  used_this_cycle integer not null default 0 check (used_this_cycle >= 0),
  cycle_started_at timestamptz not null default now(),
  cycle_ends_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  type text not null check (type in ('grant', 'reserve', 'commit', 'refund', 'adjustment')),
  reason text not null,
  request_hash text,
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  material_type text not null,
  request_payload jsonb not null,
  response_json jsonb not null,
  html_editor text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  credit_cost integer not null default 0,
  request_hash text not null,
  idempotency_key text not null,
  status text not null default 'completed' check (status in ('completed', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists generated_materials_user_request_hash_idx
  on public.generated_materials(user_id, request_hash);

create unique index if not exists generated_materials_user_idempotency_idx
  on public.generated_materials(user_id, idempotency_key);

create index if not exists credit_ledger_user_created_idx
  on public.credit_ledger(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists credit_wallets_set_updated_at on public.credit_wallets;
create trigger credit_wallets_set_updated_at
before update on public.credit_wallets
for each row execute function public.set_updated_at();

drop trigger if exists generated_materials_set_updated_at on public.generated_materials;
create trigger generated_materials_set_updated_at
before update on public.generated_materials
for each row execute function public.set_updated_at();

create or replace function public.planify_grant_monthly_credits(
  p_user_id uuid,
  p_amount integer,
  p_monthly_limit integer default null,
  p_reason text default 'monthly_grant'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_limit integer;
begin
  if p_amount <= 0 then
    return jsonb_build_object('ok', false, 'message', 'A quantidade de créditos precisa ser maior que zero.');
  end if;

  v_limit := coalesce(p_monthly_limit, p_amount);

  insert into public.credit_wallets(user_id, balance, monthly_limit, used_this_cycle, cycle_started_at, cycle_ends_at)
  values (p_user_id, p_amount, v_limit, 0, now(), now() + interval '30 days')
  on conflict (user_id) do update set
    balance = p_amount,
    monthly_limit = v_limit,
    used_this_cycle = 0,
    cycle_started_at = now(),
    cycle_ends_at = now() + interval '30 days',
    updated_at = now()
  returning balance into v_balance;

  insert into public.credit_ledger(user_id, amount, type, reason)
  values (p_user_id, p_amount, 'grant', p_reason);

  return jsonb_build_object('ok', true, 'balance_after', v_balance, 'monthly_limit', v_limit);
end;
$$;

create or replace function public.planify_reserve_material_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_request_hash text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.credit_wallets%rowtype;
  v_balance_after integer;
begin
  if p_amount <= 0 then
    return jsonb_build_object('ok', false, 'message', 'Custo de créditos inválido.');
  end if;

  select * into v_wallet
  from public.credit_wallets
  where user_id = p_user_id
  for update;

  if not found then
    insert into public.credit_wallets(user_id, balance, monthly_limit, used_this_cycle)
    values (p_user_id, 0, 0, 0)
    returning * into v_wallet;
  end if;

  if v_wallet.cycle_ends_at < now() and v_wallet.monthly_limit > 0 then
    update public.credit_wallets
    set balance = monthly_limit,
        used_this_cycle = 0,
        cycle_started_at = now(),
        cycle_ends_at = now() + interval '30 days',
        updated_at = now()
    where user_id = p_user_id
    returning * into v_wallet;
  end if;

  if v_wallet.balance < p_amount then
    return jsonb_build_object(
      'ok', false,
      'message', 'Créditos insuficientes.',
      'balance', v_wallet.balance,
      'required', p_amount
    );
  end if;

  update public.credit_wallets
  set balance = balance - p_amount,
      used_this_cycle = used_this_cycle + p_amount,
      updated_at = now()
  where user_id = p_user_id
  returning balance into v_balance_after;

  insert into public.credit_ledger(user_id, amount, type, reason, request_hash, idempotency_key)
  values (p_user_id, -p_amount, 'reserve', p_reason, p_request_hash, p_idempotency_key);

  return jsonb_build_object(
    'ok', true,
    'message', 'Créditos reservados com sucesso.',
    'balance_after', v_balance_after
  );
end;
$$;

create or replace function public.planify_commit_material_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_request_hash text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.credit_ledger(user_id, amount, type, reason, request_hash, idempotency_key)
  values (p_user_id, 0, 'commit', p_reason, p_request_hash, p_idempotency_key);

  return jsonb_build_object('ok', true, 'message', 'Consumo de créditos confirmado.');
end;
$$;

create or replace function public.planify_refund_material_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_request_hash text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance_after integer;
begin
  if p_amount <= 0 then
    return jsonb_build_object('ok', false, 'message', 'Valor de estorno inválido.');
  end if;

  update public.credit_wallets
  set balance = balance + p_amount,
      used_this_cycle = greatest(0, used_this_cycle - p_amount),
      updated_at = now()
  where user_id = p_user_id
  returning balance into v_balance_after;

  insert into public.credit_ledger(user_id, amount, type, reason, request_hash, idempotency_key)
  values (p_user_id, p_amount, 'refund', p_reason, p_request_hash, p_idempotency_key);

  return jsonb_build_object('ok', true, 'message', 'Créditos estornados.', 'balance_after', v_balance_after);
end;
$$;

alter table public.credit_wallets enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.generated_materials enable row level security;

drop policy if exists "credit_wallets_select_own" on public.credit_wallets;
create policy "credit_wallets_select_own"
on public.credit_wallets for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "credit_ledger_select_own" on public.credit_ledger;
create policy "credit_ledger_select_own"
on public.credit_ledger for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "generated_materials_select_own" on public.generated_materials;
create policy "generated_materials_select_own"
on public.generated_materials for select
to authenticated
using (auth.uid() = user_id);

-- Escrita é feita pelo backend com service role. Usuários autenticados leem apenas os próprios registros.
