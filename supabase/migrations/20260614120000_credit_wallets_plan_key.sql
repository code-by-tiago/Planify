-- Align production credit_wallets with planify_grant_credits / credit-service.
-- Production had an older table (id PK, used_this_cycle) without plan_key,
-- which caused planify_grant_credits and wallet reads to fail silently.

alter table public.credit_wallets
  add column if not exists plan_key text;

comment on column public.credit_wallets.plan_key is
  'Billing plan key (monthly/premium/yearly) for the active credit cycle.';

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
declare
  v_cycle_start timestamptz := coalesce(p_cycle_start, now());
  v_cycle_end timestamptz := coalesce(
    p_cycle_end,
    v_cycle_start + interval '1 month'
  );
begin
  insert into public.credit_wallets (
    user_id, balance, monthly_limit, plan_key, cycle_started_at, cycle_ends_at, updated_at
  )
  values (
    p_user, p_credits, p_credits, p_plan_key, v_cycle_start, v_cycle_end, now()
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

-- Backfill plan_key on existing wallets from active subscriptions when missing.
update public.credit_wallets cw
set
  plan_key = coalesce(
    nullif(trim(s.plan_key), ''),
    nullif(trim(s.plan_id), ''),
    cw.plan_key
  ),
  updated_at = now()
from public.subscriptions s
where
  s.user_id = cw.user_id
  and s.status in ('active', 'trialing')
  and cw.plan_key is null;

-- Provision wallets for active subscribers missing one.
do $$
declare
  rec record;
  plan_credits integer;
begin
  for rec in
    select
      s.user_id,
      coalesce(nullif(trim(s.plan_key), ''), nullif(trim(s.plan_id), ''), 'monthly') as plan_key,
      s.current_period_start,
      s.current_period_end
    from public.subscriptions s
    where
      s.status in ('active', 'trialing')
      and s.user_id is not null
      and not exists (
        select 1 from public.credit_wallets w where w.user_id = s.user_id
      )
  loop
    plan_credits := case
      when rec.plan_key in ('yearly', 'anual', 'professor_pro_anual', 'pro_anual') then 4500
      else 800
    end;

    perform public.planify_grant_credits(
      rec.user_id,
      rec.plan_key,
      plan_credits,
      rec.current_period_start,
      rec.current_period_end
    );
  end loop;
end;
$$;
