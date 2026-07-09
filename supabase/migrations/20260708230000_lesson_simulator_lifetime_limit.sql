-- Planify — Limite vitalício do simulador público (1 uso por dispositivo/IP).
-- Remove a janela de 24h das RPCs; o primeiro used_at permanece permanente.

create or replace function public.planify_get_lesson_simulator_usage(
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
    from public.lesson_simulator_rate_limits r
   where r.rate_key = v_effective_ip || ':' || v_fp
      or (v_ip is not null and r.rate_key = 'ip:' || v_ip);

  if v_max is null then
    return 0;
  end if;

  return (extract(epoch from v_max) * 1000)::bigint;
end;
$$;

create or replace function public.planify_consume_lesson_simulator_usage(
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
  v_existing timestamptz;
begin
  if v_fp is null then
    return 0;
  end if;

  -- Preserva o primeiro used_at (limite vitalício).
  insert into public.lesson_simulator_rate_limits (rate_key, used_at)
  values (v_effective_ip || ':' || v_fp, v_now)
  on conflict (rate_key) do update
    set used_at = public.lesson_simulator_rate_limits.used_at;

  if v_ip is not null then
    insert into public.lesson_simulator_rate_limits (rate_key, used_at)
    values ('ip:' || v_ip, v_now)
    on conflict (rate_key) do update
      set used_at = public.lesson_simulator_rate_limits.used_at;
  end if;

  select max(r.used_at)
    into v_existing
    from public.lesson_simulator_rate_limits r
   where r.rate_key = v_effective_ip || ':' || v_fp
      or (v_ip is not null and r.rate_key = 'ip:' || v_ip);

  if v_existing is null then
    return (extract(epoch from v_now) * 1000)::bigint;
  end if;

  return (extract(epoch from v_existing) * 1000)::bigint;
end;
$$;

revoke all on function public.planify_get_lesson_simulator_usage(text, text) from public;
revoke all on function public.planify_consume_lesson_simulator_usage(text, text) from public;
grant execute on function public.planify_get_lesson_simulator_usage(text, text) to service_role;
grant execute on function public.planify_consume_lesson_simulator_usage(text, text) to service_role;
