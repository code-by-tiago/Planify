-- Planify — dedup persistente e rate limit para export Google Classroom (serverless-safe).

create table if not exists public.google_classroom_export_dedup (
  dedup_key text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists google_classroom_export_dedup_user_created_idx
  on public.google_classroom_export_dedup (user_id, created_at desc);

create index if not exists google_classroom_export_dedup_created_idx
  on public.google_classroom_export_dedup (created_at);

alter table public.google_classroom_export_dedup enable row level security;

revoke all on table public.google_classroom_export_dedup from anon, authenticated;

comment on table public.google_classroom_export_dedup is
  'Bloqueia reenvio duplicado de material ao Classroom entre instâncias serverless.';

create or replace function public.planify_assert_classroom_export_dedup(
  p_user_id uuid,
  p_dedup_key text,
  p_ttl_seconds int default 180
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := nullif(trim(p_dedup_key), '');
  v_existing timestamptz;
  v_ttl interval := make_interval(secs => greatest(coalesce(p_ttl_seconds, 180), 30));
begin
  if p_user_id is null or v_key is null then
    return;
  end if;

  select d.created_at
    into v_existing
    from public.google_classroom_export_dedup d
   where d.dedup_key = v_key
     and d.created_at > now() - v_ttl
   limit 1;

  if v_existing is not null then
    raise exception 'CLASSROOM_EXPORT_DEDUP'
      using detail = format(
        'Este material já foi enviado para esta turma há pouco. Aguarde %s segundos antes de reenviar.',
        greatest(
          1,
          ceil(extract(epoch from (v_existing + v_ttl - now())))::int
        )
      );
  end if;
end;
$$;

create or replace function public.planify_record_classroom_export_dedup(
  p_user_id uuid,
  p_dedup_key text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := nullif(trim(p_dedup_key), '');
begin
  if p_user_id is null or v_key is null then
    return;
  end if;

  insert into public.google_classroom_export_dedup (dedup_key, user_id, created_at)
  values (v_key, p_user_id, now())
  on conflict (dedup_key) do update
    set user_id = excluded.user_id,
        created_at = excluded.created_at;
end;
$$;

revoke all on function public.planify_assert_classroom_export_dedup(uuid, text, int) from public;
revoke all on function public.planify_record_classroom_export_dedup(uuid, text) from public;

grant execute on function public.planify_assert_classroom_export_dedup(uuid, text, int) to service_role;
grant execute on function public.planify_record_classroom_export_dedup(uuid, text) to service_role;
