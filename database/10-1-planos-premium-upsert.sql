-- Planify | Etapa 10.1
-- Use este arquivo apenas como modelo: troque os price_... pelos IDs reais do Stripe.

insert into subscription_plan_credits (
  plan_key,
  stripe_price_id,
  name,
  credits_per_cycle,
  billing_cycle,
  active
)
values
(
  'professor_pro',
  'price_COLE_AQUI_O_PRICE_ID_DO_PRO_MENSAL',
  'Professor Pro',
  350,
  'monthly',
  true
),
(
  'professor_premium',
  'price_COLE_AQUI_O_PRICE_ID_DO_PREMIUM_MENSAL',
  'Professor Premium',
  800,
  'monthly',
  true
),
(
  'professor_pro_anual',
  'price_COLE_AQUI_O_PRICE_ID_DO_PRO_ANUAL',
  'Professor Pro Anual',
  4500,
  'yearly',
  true
)
on conflict (plan_key) do update set
  stripe_price_id = excluded.stripe_price_id,
  name = excluded.name,
  credits_per_cycle = excluded.credits_per_cycle,
  billing_cycle = excluded.billing_cycle,
  active = excluded.active,
  updated_at = now();

select
  plan_key,
  stripe_price_id,
  name,
  credits_per_cycle,
  billing_cycle,
  active
from subscription_plan_credits
order by credits_per_cycle;
