-- Planify — BNCC skills catalog, school invites, and discipline on generated_materials.
-- Full BNCC import is a separate data pipeline; this seeds a minimal sample for dev/demo.

-- ─── BNCC skills catalog ─────────────────────────────────────────────────────

create table if not exists public.bncc_skills (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null,
  education_stage text not null,
  grade text,
  subject text,
  knowledge_area text,
  thematic_unit text,
  knowledge_object text,
  keywords text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bncc_skills_code_idx on public.bncc_skills (code);
create index if not exists bncc_skills_stage_idx on public.bncc_skills (education_stage);
create index if not exists bncc_skills_subject_idx on public.bncc_skills (subject);
create index if not exists bncc_skills_grade_idx on public.bncc_skills (grade);
create index if not exists bncc_skills_active_idx on public.bncc_skills (is_active);

drop trigger if exists set_bncc_skills_updated_at on public.bncc_skills;
create trigger set_bncc_skills_updated_at
  before update on public.bncc_skills
  for each row execute function public.set_updated_at();

alter table public.bncc_skills enable row level security;

drop policy if exists bncc_skills_select_premium on public.bncc_skills;
create policy bncc_skills_select_premium
  on public.bncc_skills for select
  to authenticated
  using (is_active = true and public.can_access_app());

drop policy if exists bncc_skills_admin_all on public.bncc_skills;
create policy bncc_skills_admin_all
  on public.bncc_skills for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Minimal sample skills (EF09HI01 style). Idempotent via ON CONFLICT.
insert into public.bncc_skills (
  code, description, education_stage, grade, subject, knowledge_area, is_active
) values
  (
    'EF09HI01',
    'Identificar e analisar processos de disputa pelo poder e formas de organização da sociedade.',
    'Ensino Fundamental',
    '9º ano',
    'História',
    'Ciências Humanas',
    true
  ),
  (
    'EF09HI02',
    'Identificar e analisar as relações entre diferentes grupos sociais e étnicos no Brasil.',
    'Ensino Fundamental',
    '9º ano',
    'História',
    'Ciências Humanas',
    true
  ),
  (
    'EF09MA01',
    'Reconhecer que, uma vez fixadas uma unidade de medida e uma unidade de tempo, o cálculo da velocidade média de qualquer movimento pode ser feito.',
    'Ensino Fundamental',
    '9º ano',
    'Matemática',
    'Matemática',
    true
  ),
  (
    'EF09LP01',
    'Analisar, em textos de diferentes gêneros, marcas que expressam a posição do enunciador frente ao tema.',
    'Ensino Fundamental',
    '9º ano',
    'Língua Portuguesa',
    'Linguagens',
    true
  ),
  (
    'EF09CI01',
    'Investigar as mudanças de estado físico da matéria e explicar essas transformações com base no modelo de constituição submicroscópica.',
    'Ensino Fundamental',
    '9º ano',
    'Ciências',
    'Natureza',
    true
  )
on conflict (code) do nothing;

-- ─── Discipline on generated materials ───────────────────────────────────────

alter table public.generated_materials
  add column if not exists discipline text;

-- ─── School invites ────────────────────────────────────────────────────────────

do $$ begin
  create type public.school_invite_status as enum ('pending', 'accepted', 'revoked');
exception when duplicate_object then null;
end $$;

create table if not exists public.school_invites (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  email text not null,
  status public.school_invite_status not null default 'pending',
  invited_by uuid references auth.users (id) on delete set null,
  accepted_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, email)
);

create index if not exists school_invites_school_id_idx
  on public.school_invites (school_id, status);

create index if not exists school_invites_email_idx
  on public.school_invites (lower(email));

drop trigger if exists school_invites_set_updated_at on public.school_invites;
create trigger school_invites_set_updated_at
  before update on public.school_invites
  for each row execute function public.set_updated_at();

alter table public.school_invites enable row level security;

drop policy if exists school_invites_select_director on public.school_invites;
create policy school_invites_select_director
  on public.school_invites for select
  using (public.is_school_director(school_id));

drop policy if exists school_invites_insert_director on public.school_invites;
create policy school_invites_insert_director
  on public.school_invites for insert
  with check (public.is_school_director(school_id));

drop policy if exists school_invites_update_director on public.school_invites;
create policy school_invites_update_director
  on public.school_invites for update
  using (public.is_school_director(school_id))
  with check (public.is_school_director(school_id));
