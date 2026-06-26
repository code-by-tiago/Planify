-- Planify — Trial público de planejamento (1 geração vitalícia por dispositivo/IP).

create table if not exists public.planning_trial_rate_limits (
  rate_key text primary key,
  used_at timestamptz not null default now()
);

create index if not exists planning_trial_rate_limits_used_at_idx
  on public.planning_trial_rate_limits (used_at desc);

alter table public.planning_trial_rate_limits enable row level security;

revoke all on table public.planning_trial_rate_limits from anon, authenticated;

create or replace function public.planify_get_planning_trial_usage(
  p_ip text,
  p_fingerprint text
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max timestamptz;
  v_effective_ip text := coalesce(nullif(trim(p_ip), ''), 'dev-local');
  v_fp text := nullif(trim(p_fingerprint), '');
  v_ip text := nullif(trim(p_ip), '');
begin
  if v_fp is null then
    return 0;
  end if;

  select max(r.used_at)
    into v_max
    from public.planning_trial_rate_limits r
   where r.rate_key = v_effective_ip || ':' || v_fp
      or (v_ip is not null and r.rate_key = 'ip:' || v_ip);

  if v_max is null then
    return 0;
  end if;

  return (extract(epoch from v_max) * 1000)::bigint;
end;
$$;

create or replace function public.planify_consume_planning_trial_usage(
  p_ip text,
  p_fingerprint text
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_effective_ip text := coalesce(nullif(trim(p_ip), ''), 'dev-local');
  v_fp text := nullif(trim(p_fingerprint), '');
  v_ip text := nullif(trim(p_ip), '');
begin
  if v_fp is null then
    return 0;
  end if;

  insert into public.planning_trial_rate_limits (rate_key, used_at)
  values (v_effective_ip || ':' || v_fp, v_now)
  on conflict (rate_key) do update
    set used_at = excluded.used_at;

  if v_ip is not null then
    insert into public.planning_trial_rate_limits (rate_key, used_at)
    values ('ip:' || v_ip, v_now)
    on conflict (rate_key) do update
      set used_at = excluded.used_at;
  end if;

  return (extract(epoch from v_now) * 1000)::bigint;
end;
$$;

revoke all on function public.planify_get_planning_trial_usage(text, text) from public;
revoke all on function public.planify_consume_planning_trial_usage(text, text) from public;

grant execute on function public.planify_get_planning_trial_usage(text, text) to service_role;
grant execute on function public.planify_consume_planning_trial_usage(text, text) to service_role;
