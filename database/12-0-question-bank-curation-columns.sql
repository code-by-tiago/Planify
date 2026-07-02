-- 12-0 Question bank curation metadata
-- Safe to run multiple times in Supabase SQL Editor.

alter table public.question_bank_items
  add column if not exists collection text not null default 'geral',
  add column if not exists source_url text,
  add column if not exists source_license text,
  add column if not exists review_status text not null default 'community',
  add column if not exists quality_score numeric,
  add column if not exists reviewed_at timestamptz;

update public.question_bank_items
set
  collection = coalesce(nullif(collection, ''), 'geral'),
  review_status = coalesce(nullif(review_status, ''), 'community')
where collection is null
   or collection = ''
   or review_status is null
   or review_status = '';

create index if not exists question_bank_items_collection_idx
  on public.question_bank_items (collection);

create index if not exists question_bank_items_review_status_idx
  on public.question_bank_items (review_status);

create index if not exists question_bank_items_quality_score_idx
  on public.question_bank_items (quality_score);
