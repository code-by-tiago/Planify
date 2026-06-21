-- Banco de Questões: proveniência e curadoria para fontes oficiais/licenciadas.
-- Não altera nem remove questões existentes; campos novos têm defaults seguros.

alter table public.question_bank_items
  add column if not exists collection text not null default 'geral'
    check (collection in ('escolar', 'enem', 'vestibular', 'concurso', 'superior', 'geral')),
  add column if not exists source_url text,
  add column if not exists source_license text,
  add column if not exists review_status text not null default 'community'
    check (review_status in ('community', 'automated', 'human-reviewed', 'pending')),
  add column if not exists quality_score numeric(3,1)
    check (quality_score is null or (quality_score >= 0 and quality_score <= 10)),
  add column if not exists reviewed_at timestamptz;

create index if not exists question_bank_items_curated_idx
  on public.question_bank_items (collection, review_status, updated_at desc)
  where visibility = 'community' and is_published = true;

comment on column public.question_bank_items.collection is
  'Recorte editorial: escolar, ENEM, vestibular, concurso ou ensino superior.';
comment on column public.question_bank_items.review_status is
  'Proveniência da revisão: comunidade, automatizada, humana revisada ou pendente.';
comment on column public.question_bank_items.source_license is
  'Licença/termo verificado antes da ingestão automática.';
