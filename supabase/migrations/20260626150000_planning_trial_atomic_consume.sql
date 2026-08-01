-- Atomic first-consume for planning trial (returns 0 if already used).

create or replace function public.planify_try_consume_planning_trial_usage(
  p_ip text,
  p_fingerprint text
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_ts bigint;
  v_effective_ip text := coalesce(nullif(trim(p_ip), ''), 'dev-local');
  v_fp text := nullif(trim(p_fingerprint), '');
  v_ip text := nullif(trim(p_ip), '');
  v_composite text;
begin
  if v_fp is null then
    return 0;
  end if;

  v_composite := v_effective_ip || ':' || v_fp;

  if exists (
    select 1
      from public.planning_trial_rate_limits r
     where r.rate_key = v_composite
        or (v_ip is not null and r.rate_key = 'ip:' || v_ip)
  ) then
    return 0;
  end if;

  insert into public.planning_trial_rate_limits (rate_key, used_at)
  values (v_composite, v_now);

  if v_ip is not null then
    insert into public.planning_trial_rate_limits (rate_key, used_at)
    values ('ip:' || v_ip, v_now)
    on conflict (rate_key) do nothing;
  end if;

  v_ts := (extract(epoch from v_now) * 1000)::bigint;
  return v_ts;
exception
  when unique_violation then
    return 0;
end;
$$;

revoke all on function public.planify_try_consume_planning_trial_usage(text, text) from public;
grant execute on function public.planify_try_consume_planning_trial_usage(text, text) to service_role;
