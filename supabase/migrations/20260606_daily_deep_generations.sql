-- Planify — Cota diária de gerações profundas (Gemini Pro) por usuário.
-- Reset implícito por data (America/Sao_Paulo) na função de consumo.

create table if not exists public.daily_deep_generations (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create index if not exists daily_deep_generations_date_idx
  on public.daily_deep_generations (usage_date desc);

alter table public.daily_deep_generations enable row level security;

drop policy if exists daily_deep_generations_select_own on public.daily_deep_generations;
create policy daily_deep_generations_select_own
  on public.daily_deep_generations for select
  using (auth.uid() = user_id);

create or replace function public.planify_brazil_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

create or replace function public.planify_get_deep_generation_usage(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  select coalesce(d.count, 0)
    into v_count
    from public.daily_deep_generations d
   where d.user_id = p_user
     and d.usage_date = public.planify_brazil_today();

  return coalesce(v_count, 0);
end;
$$;

-- Consome 1 slot profundo. Retorna novo total ou -1 se limite atingido.
create or replace function public.planify_consume_deep_generation(
  p_user uuid,
  p_daily_limit integer
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.planify_brazil_today();
  v_count integer;
begin
  if p_daily_limit <= 0 then
    return -1;
  end if;

  insert into public.daily_deep_generations (user_id, usage_date, count, updated_at)
  values (p_user, v_today, 1, now())
  on conflict (user_id, usage_date) do update
    set count = public.daily_deep_generations.count + 1,
        updated_at = now()
    where public.daily_deep_generations.count < p_daily_limit
  returning count into v_count;

  if v_count is null then
    return -1;
  end if;

  return v_count;
end;
$$;

create or replace function public.planify_refund_deep_generation(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.planify_brazil_today();
begin
  update public.daily_deep_generations
     set count = greatest(0, count - 1),
         updated_at = now()
   where user_id = p_user
     and usage_date = v_today
     and count > 0;
end;
$$;
