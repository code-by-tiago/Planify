-- Espelho de supabase/migrations/20260607_generation_events.sql

create table if not exists public.generation_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  surface text not null check (surface in ('material', 'planning')),
  tipo text not null default '',
  pipeline text not null default '',
  quality_score_bucket text not null default 'unknown'
    check (quality_score_bucket in ('90+', '75+', '<75', 'unknown')),
  elevar_qualidade boolean not null default false,
  used_ai boolean not null default false,
  daily_quota_consumed boolean not null default false
);

create index if not exists generation_events_created_at_idx
  on public.generation_events (created_at desc);

create index if not exists generation_events_surface_tipo_idx
  on public.generation_events (surface, tipo, created_at desc);

alter table public.generation_events enable row level security;
