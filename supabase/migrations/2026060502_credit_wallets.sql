-- Planify — Carteira de créditos por usuário + ledger de uso.
-- Os créditos são concedidos por ciclo de assinatura (Stripe) e gastos a cada
-- geração de material. Funções SECURITY DEFINER garantem débito atômico.

create table if not exists public.credit_wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0,
  monthly_limit integer not null default 0,
  plan_key text,
  cycle_started_at timestamptz not null default now(),
  cycle_ends_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,
  reason text not null,
  tipo_material text,
  balance_after integer,
  created_at timestamptz not null default now()
);

create index if not exists credit_usage_user_idx
  on public.credit_usage (user_id, created_at desc);

alter table public.credit_wallets enable row level security;
alter table public.credit_usage enable row level security;

-- Leitura apenas da própria carteira/uso. Escrita só via service role (sem policy).
drop policy if exists credit_wallets_select_own on public.credit_wallets;
create policy credit_wallets_select_own
  on public.credit_wallets for select
  using (auth.uid() = user_id);

drop policy if exists credit_usage_select_own on public.credit_usage;
create policy credit_usage_select_own
  on public.credit_usage for select
  using (auth.uid() = user_id);

-- Concede/renova créditos do ciclo (reseta o saldo para o total do plano).
create or replace function public.planify_grant_credits(
  p_user uuid,
  p_plan_key text,
  p_credits integer,
  p_cycle_start timestamptz,
  p_cycle_end timestamptz
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.credit_wallets (
    user_id, balance, monthly_limit, plan_key, cycle_started_at, cycle_ends_at, updated_at
  )
  values (
    p_user, p_credits, p_credits, p_plan_key, coalesce(p_cycle_start, now()), p_cycle_end, now()
  )
  on conflict (user_id) do update set
    balance = excluded.balance,
    monthly_limit = excluded.monthly_limit,
    plan_key = excluded.plan_key,
    cycle_started_at = excluded.cycle_started_at,
    cycle_ends_at = excluded.cycle_ends_at,
    updated_at = now();

  insert into public.credit_usage (user_id, delta, reason, balance_after)
  values (p_user, p_credits, 'grant', p_credits);
end;
$$;

-- Débito atômico. Retorna o novo saldo, ou -1 se não houver créditos suficientes.
create or replace function public.planify_spend_credits(
  p_user uuid,
  p_cost integer,
  p_tipo text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  update public.credit_wallets
    set balance = balance - p_cost, updated_at = now()
    where user_id = p_user and balance >= p_cost
    returning balance into new_balance;

  if new_balance is null then
    return -1;
  end if;

  insert into public.credit_usage (user_id, delta, reason, tipo_material, balance_after)
  values (p_user, -p_cost, 'spend', p_tipo, new_balance);

  return new_balance;
end;
$$;

-- Reembolsa créditos (ex.: a geração falhou após o débito).
create or replace function public.planify_refund_credits(
  p_user uuid,
  p_amount integer,
  p_tipo text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  update public.credit_wallets
    set balance = balance + p_amount, updated_at = now()
    where user_id = p_user
    returning balance into new_balance;

  if new_balance is not null then
    insert into public.credit_usage (user_id, delta, reason, tipo_material, balance_after)
    values (p_user, p_amount, 'refund', p_tipo, new_balance);
  end if;
end;
$$;
