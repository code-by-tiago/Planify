-- Sprint 4: eventos operacionais (falhas de bundle, OCR vazio, import zero)

create table if not exists public.operational_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  tool_tipo text not null default '',
  ok boolean not null default true,
  error_code text,
  duration_ms integer,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists operational_events_created_at_idx
  on public.operational_events (created_at desc);

create index if not exists operational_events_type_created_idx
  on public.operational_events (event_type, tool_tipo, created_at desc);

alter table public.operational_events enable row level security;

drop policy if exists "operational_events_admin_select" on public.operational_events;
create policy "operational_events_admin_select"
on public.operational_events
for select
to authenticated
using (public.is_admin());

drop policy if exists "operational_events_service_insert" on public.operational_events;
create policy "operational_events_service_insert"
on public.operational_events
for insert
to authenticated
with check (public.is_admin() or public.can_access_app());
