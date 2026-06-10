-- Sprint 3: banco de questões persistente com comunidade básica

create table if not exists public.question_bank_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  enunciado text not null,
  tipo text not null default 'discursiva',
  alternativas jsonb not null default '[]'::jsonb,
  resposta_esperada text not null default '',
  criterio_correcao text not null default '',
  componente text not null,
  ano_serie text not null default 'Geral',
  etapa text not null default '',
  tema text not null default '',
  bncc_codigos text[] not null default '{}',
  tags text[] not null default '{}',
  source_title text,
  source_type text,
  content_hash text not null,
  visibility text not null default 'private'
    check (visibility in ('private', 'community', 'school')),
  is_published boolean not null default false,
  published_at timestamptz,
  usage_count integer not null default 0 check (usage_count >= 0),
  author_display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists question_bank_items_user_hash_uidx
  on public.question_bank_items (user_id, content_hash);

create index if not exists question_bank_items_community_idx
  on public.question_bank_items (is_published, visibility, componente, ano_serie)
  where visibility = 'community' and is_published = true;

create index if not exists question_bank_items_user_updated_idx
  on public.question_bank_items (user_id, updated_at desc);

drop trigger if exists set_question_bank_items_updated_at on public.question_bank_items;
create trigger set_question_bank_items_updated_at
before update on public.question_bank_items
for each row execute function public.set_updated_at();

alter table public.question_bank_items enable row level security;

-- SELECT: owner; community published; school members; admin
drop policy if exists "question_bank_items_select" on public.question_bank_items;
create policy "question_bank_items_select"
on public.question_bank_items
for select
to authenticated
using (
  public.is_admin()
  or user_id = auth.uid()
  or (
    public.can_access_app()
    and visibility = 'community'
    and is_published = true
  )
  or (
    public.can_access_app()
    and visibility = 'school'
    and school_id is not null
    and public.is_active_school_member(school_id)
  )
);

-- INSERT/UPDATE/DELETE: owner + can_access_app; admin full access
drop policy if exists "question_bank_items_owner_all" on public.question_bank_items;
create policy "question_bank_items_owner_all"
on public.question_bank_items
for all
to authenticated
using (public.is_admin() or (user_id = auth.uid() and public.can_access_app()))
with check (public.is_admin() or (user_id = auth.uid() and public.can_access_app()));

drop policy if exists "question_bank_items_admin_all" on public.question_bank_items;
create policy "question_bank_items_admin_all"
on public.question_bank_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

comment on table public.question_bank_items is
  'Banco de questões pessoal e comunidade — sync híbrido com localStorage no cliente';
