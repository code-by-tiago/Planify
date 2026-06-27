-- Garimpo/RAG MVP: candidatos internos a partir de materiais gerados com qualidade.
-- PRIVACIDADE: sem IP, sem PII de alunos, sem HTML bruto — apenas previews sanitizados e metadados pedagógicos.

create table if not exists public.corpus_candidates (
  id uuid primary key default gen_random_uuid(),
  source_table text not null,
  source_id uuid not null,
  surface text not null default 'material',
  tipo text not null default '',
  bncc_codigos text[] not null default '{}',
  quality_score numeric,
  tema text not null default '',
  discipline text,
  topic_signature text not null default '',
  content_summary text not null default '',
  content_hash text not null,
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists corpus_candidates_content_hash_uidx
  on public.corpus_candidates (content_hash);

create unique index if not exists corpus_candidates_source_uidx
  on public.corpus_candidates (source_table, source_id);

create index if not exists corpus_candidates_review_status_idx
  on public.corpus_candidates (review_status, created_at desc);

create index if not exists corpus_candidates_quality_idx
  on public.corpus_candidates (quality_score desc nulls last)
  where review_status = 'pending';

create index if not exists corpus_candidates_topic_signature_idx
  on public.corpus_candidates (topic_signature)
  where review_status = 'approved';

create index if not exists corpus_candidates_bncc_gin
  on public.corpus_candidates using gin (bncc_codigos);

alter table public.corpus_candidates enable row level security;

drop policy if exists "corpus_candidates_admin_all" on public.corpus_candidates;
create policy "corpus_candidates_admin_all"
on public.corpus_candidates
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "corpus_candidates_service_insert" on public.corpus_candidates;
create policy "corpus_candidates_service_insert"
on public.corpus_candidates
for insert
to authenticated
with check (public.is_admin() or public.can_access_app());

-- Fonte interna para promoção opcional ao reservatório didático.
insert into public.pedagogical_sources (
  slug, name, adapter_type, base_url, license_label, attribution_template, config, priority
) values (
  'planify-corpus',
  'Planify — Materiais curados (garimpo interno)',
  'internal_corpus',
  'https://planify.com.br',
  'Planify — uso interno pedagógico',
  'Fonte: Planify — material curado internamente',
  '{"auto_approve": false, "ttl_days": 365}'::jsonb,
  30
) on conflict (slug) do nothing;
