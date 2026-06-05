-- Backfill: concede créditos do ciclo para assinaturas ativas sem carteira
-- ou com saldo zerado (pós-migração / webhook perdido).

do $$
declare
  rec record;
  plan_credits integer;
  resolved_plan text;
begin
  for rec in
    select
      s.user_id,
      s.plan_key,
      s.plan_id,
      s.price_id,
      s.current_period_start,
      s.current_period_end
    from public.subscriptions s
    where s.user_id is not null
      and s.status in ('active', 'trialing')
  loop
    resolved_plan := coalesce(
      nullif(trim(rec.plan_key), ''),
      nullif(trim(rec.plan_id), '')
    );

    plan_credits := case
      when resolved_plan ilike any (array['%premium%', '%professor_premium%']) then 800
      when resolved_plan ilike any (array['%anual%', '%yearly%', '%annual%', '%pro_anual%']) then 4500
      when resolved_plan ilike any (array['%pro%', '%mensal%', '%monthly%']) then 350
      else 350
    end;

    if not exists (
      select 1
      from public.credit_wallets w
      where w.user_id = rec.user_id
        and w.balance > 0
    ) then
      perform public.planify_grant_credits(
        rec.user_id,
        resolved_plan,
        plan_credits,
        coalesce(rec.current_period_start, now()),
        rec.current_period_end
      );
    end if;
  end loop;
end $$;
