-- Pedagogical cache: reservatório didático modular (Wikipedia PT + BNCC + gov.br)

-- Table 1: pedagogical_sources
create table if not exists public.pedagogical_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  adapter_type text not null,
  base_url text not null,
  license_label text not null,
  attribution_template text,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  priority smallint not null default 100,
  robots_respected boolean not null default true,
  last_success_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table 2: pedagogical_cache_entries
create table if not exists public.pedagogical_cache_entries (
  id uuid primary key default gen_random_uuid(),
  topic_signature text not null,
  content_hash text not null,
  title text not null,
  summary text not null,
  body_markdown text not null,
  content_type text not null default 'context'
    check (content_type in ('context','definition','orientation','activity_seed','reference')),
  componente text,
  ano_serie text,
  etapa text,
  bncc_codigos text[] not null default '{}',
  tags text[] not null default '{}',
  source_id uuid not null references public.pedagogical_sources(id),
  source_url text,
  source_title text,
  source_license text,
  source_fetched_at timestamptz not null default now(),
  review_status text not null default 'pending'
    check (review_status in ('pending','approved','rejected','stale')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  format_applied boolean not null default false,
  ai_tokens_used integer not null default 0,
  hit_count integer not null default 0,
  last_hit_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pedagogical_cache_topic_source_uidx
  on public.pedagogical_cache_entries (topic_signature, source_id);

create index if not exists pedagogical_cache_lookup_idx
  on public.pedagogical_cache_entries (review_status, componente, etapa)
  where review_status = 'approved';

create index if not exists pedagogical_cache_bncc_gin
  on public.pedagogical_cache_entries using gin (bncc_codigos);

create index if not exists pedagogical_cache_topic_signature_idx
  on public.pedagogical_cache_entries (topic_signature)
  where review_status = 'approved';

-- Table 3: pedagogical_cache_aliases
create table if not exists public.pedagogical_cache_aliases (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.pedagogical_cache_entries(id) on delete cascade,
  alias_key text not null,
  alias_type text not null default 'tema'
);

create unique index if not exists pedagogical_cache_aliases_key_uidx
  on public.pedagogical_cache_aliases (alias_key);

-- Table 4: pedagogical_scrape_jobs
create table if not exists public.pedagogical_scrape_jobs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null,
  query jsonb not null,
  status text not null default 'queued'
    check (status in ('queued','running','completed','failed','skipped')),
  sources_attempted text[] not null default '{}',
  entries_created integer not null default 0,
  entries_updated integer not null default 0,
  error_code text,
  error_message text,
  duration_ms integer,
  requested_by uuid references public.profiles(id),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists pedagogical_scrape_jobs_status_idx
  on public.pedagogical_scrape_jobs (status, created_at desc);

-- Table 5: pedagogical_cache_usage
create table if not exists public.pedagogical_cache_usage (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references public.pedagogical_cache_entries(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  usage_type text not null,
  tokens_saved_estimate integer not null default 0,
  ai_tokens_spent integer not null default 0,
  tool_tipo text,
  created_at timestamptz not null default now()
);

create index if not exists pedagogical_cache_usage_created_idx
  on public.pedagogical_cache_usage (created_at desc);

-- updated_at triggers
drop trigger if exists set_pedagogical_sources_updated_at on public.pedagogical_sources;
create trigger set_pedagogical_sources_updated_at
before update on public.pedagogical_sources
for each row execute function public.set_updated_at();

drop trigger if exists set_pedagogical_cache_entries_updated_at on public.pedagogical_cache_entries;
create trigger set_pedagogical_cache_entries_updated_at
before update on public.pedagogical_cache_entries
for each row execute function public.set_updated_at();

-- Seeds v1
insert into public.pedagogical_sources (
  slug, name, adapter_type, base_url, license_label, attribution_template, config, priority
) values
  (
    'wikipedia-pt',
    'Wikipédia em Português',
    'mediawiki',
    'https://pt.wikipedia.org',
    'CC BY-SA 4.0',
    'Fonte: {title} — {url}',
    '{"rate_limit_ms": 1000, "lang": "pt", "ttl_days": 90}'::jsonb,
    50
  ),
  (
    'bncc-skills',
    'BNCC — Habilidades (catálogo local)',
    'bncc_local',
    'https://basenacionalcomum.mec.gov.br',
    'Dados Abertos BR',
    'Fonte: BNCC {title}',
    '{"auto_approve": true, "confidence_threshold": 0.95}'::jsonb,
    10
  ),
  (
    'bncc-gov-orientacoes',
    'BNCC — Orientações MEC',
    'html_scrape',
    'https://basenacionalcomum.mec.gov.br',
    'Dados Abertos BR',
    'Fonte: {title} — {url}',
    '{"seed_urls": ["https://basenacionalcomum.mec.gov.br/"], "rate_limit_ms": 2000}'::jsonb,
    80
  )
on conflict (slug) do nothing;

-- RLS
alter table public.pedagogical_sources enable row level security;
alter table public.pedagogical_cache_entries enable row level security;
alter table public.pedagogical_cache_aliases enable row level security;
alter table public.pedagogical_scrape_jobs enable row level security;
alter table public.pedagogical_cache_usage enable row level security;

-- pedagogical_sources: read for authenticated app users
drop policy if exists "pedagogical_sources_select" on public.pedagogical_sources;
create policy "pedagogical_sources_select"
on public.pedagogical_sources
for select
to authenticated
using (public.can_access_app() or public.is_admin(auth.uid()));

drop policy if exists "pedagogical_sources_admin_all" on public.pedagogical_sources;
create policy "pedagogical_sources_admin_all"
on public.pedagogical_sources
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- pedagogical_cache_entries: approved for users; pending/rejected/stale for admin
drop policy if exists "pedagogical_cache_entries_select_approved" on public.pedagogical_cache_entries;
create policy "pedagogical_cache_entries_select_approved"
on public.pedagogical_cache_entries
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or (
    public.can_access_app()
    and review_status = 'approved'
    and (expires_at is null or expires_at > now())
  )
);

drop policy if exists "pedagogical_cache_entries_admin_write" on public.pedagogical_cache_entries;
create policy "pedagogical_cache_entries_admin_write"
on public.pedagogical_cache_entries
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- pedagogical_cache_aliases: follow entry visibility
drop policy if exists "pedagogical_cache_aliases_select" on public.pedagogical_cache_aliases;
create policy "pedagogical_cache_aliases_select"
on public.pedagogical_cache_aliases
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or (
    public.can_access_app()
    and exists (
      select 1 from public.pedagogical_cache_entries e
      where e.id = entry_id
        and e.review_status = 'approved'
        and (e.expires_at is null or e.expires_at > now())
    )
  )
);

drop policy if exists "pedagogical_cache_aliases_admin_write" on public.pedagogical_cache_aliases;
create policy "pedagogical_cache_aliases_admin_write"
on public.pedagogical_cache_aliases
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- scrape jobs: admin read; insert via service (admin write policy)
drop policy if exists "pedagogical_scrape_jobs_admin" on public.pedagogical_scrape_jobs;
create policy "pedagogical_scrape_jobs_admin"
on public.pedagogical_scrape_jobs
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- usage: admin read
drop policy if exists "pedagogical_cache_usage_admin" on public.pedagogical_cache_usage;
create policy "pedagogical_cache_usage_admin"
on public.pedagogical_cache_usage
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

comment on table public.pedagogical_sources is
  'Allowlist de fontes didáticas plugáveis (adapters modulares)';
comment on table public.pedagogical_cache_entries is
  'Reservatório didático — snippets aprovados servidos sem IA';
comment on table public.pedagogical_cache_aliases is
  'Sinônimos de busca (tema, BNCC, keywords)';
comment on table public.pedagogical_scrape_jobs is
  'Auditoria de jobs de raspagem didática';
comment on table public.pedagogical_cache_usage is
  'Métricas de economia de tokens via cache didático';
