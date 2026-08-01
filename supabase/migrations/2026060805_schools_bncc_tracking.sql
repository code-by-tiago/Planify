-- Planify — Schools, memberships, classes, and generated_materials for BNCC tracking.
-- Director panel reads aggregated teacher outputs; teachers persist own generations via API (service role).

-- ─── Enums ───────────────────────────────────────────────────────────────────

do $$ begin
  create type public.school_membership_role as enum ('director', 'teacher', 'coordinator');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.school_membership_status as enum ('active', 'inactive');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.generated_material_surface as enum ('material', 'planning', 'inclusao');
exception when duplicate_object then null;
end $$;

-- ─── Schools ─────────────────────────────────────────────────────────────────

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  city text,
  state text,
  director_user_id uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists schools_name_idx on public.schools (lower(name));
create index if not exists schools_director_user_id_idx on public.schools (director_user_id);

-- ─── School classes ────────────────────────────────────────────────────────────

create table if not exists public.school_classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  grade_level text,
  year integer,
  discipline text,
  created_at timestamptz not null default now()
);

create index if not exists school_classes_school_id_idx
  on public.school_classes (school_id, created_at desc);

-- ─── School memberships ────────────────────────────────────────────────────────

create table if not exists public.school_memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.school_membership_role not null default 'teacher',
  status public.school_membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, user_id)
);

create index if not exists school_memberships_user_id_idx
  on public.school_memberships (user_id, status);

create index if not exists school_memberships_school_role_idx
  on public.school_memberships (school_id, role, status);

-- ─── Generated materials (AI outputs) ────────────────────────────────────────

create table if not exists public.generated_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  school_id uuid references public.schools (id) on delete set null,
  class_id uuid references public.school_classes (id) on delete set null,
  tipo text not null default '',
  title text not null default '',
  bncc_skill_codes text[] not null default '{}',
  bncc_skills jsonb not null default '[]'::jsonb,
  content_preview text not null default '',
  content_html text,
  raw jsonb not null default '{}'::jsonb,
  pipeline text,
  quality_score numeric,
  surface public.generated_material_surface not null default 'material',
  created_at timestamptz not null default now()
);

-- Legacy installs already have generated_materials (credit-tracking schema) without BNCC/school columns.
alter table public.generated_materials
  add column if not exists school_id uuid references public.schools (id) on delete set null;

alter table public.generated_materials
  add column if not exists class_id uuid references public.school_classes (id) on delete set null;

alter table public.generated_materials
  add column if not exists tipo text not null default '';

alter table public.generated_materials
  add column if not exists bncc_skill_codes text[] not null default '{}';

alter table public.generated_materials
  add column if not exists bncc_skills jsonb not null default '[]'::jsonb;

alter table public.generated_materials
  add column if not exists content_preview text not null default '';

alter table public.generated_materials
  add column if not exists content_html text;

alter table public.generated_materials
  add column if not exists raw jsonb not null default '{}'::jsonb;

alter table public.generated_materials
  add column if not exists pipeline text;

alter table public.generated_materials
  add column if not exists quality_score numeric;

alter table public.generated_materials
  add column if not exists surface public.generated_material_surface not null default 'material';

create index if not exists generated_materials_user_id_idx
  on public.generated_materials (user_id, created_at desc);

create index if not exists generated_materials_school_id_idx
  on public.generated_materials (school_id, created_at desc)
  where school_id is not null;

create index if not exists generated_materials_bncc_codes_gin_idx
  on public.generated_materials using gin (bncc_skill_codes);

create index if not exists generated_materials_surface_tipo_idx
  on public.generated_materials (surface, tipo, created_at desc);

-- ─── updated_at trigger ──────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists schools_set_updated_at on public.schools;
create trigger schools_set_updated_at
  before update on public.schools
  for each row execute function public.set_updated_at();

drop trigger if exists school_memberships_set_updated_at on public.school_memberships;
create trigger school_memberships_set_updated_at
  before update on public.school_memberships
  for each row execute function public.set_updated_at();

-- ─── RLS helpers ─────────────────────────────────────────────────────────────

create or replace function public.is_active_school_member(p_school_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.school_memberships sm
    where sm.school_id = p_school_id
      and sm.user_id = auth.uid()
      and sm.status = 'active'
  );
$$;

create or replace function public.is_school_director(p_school_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.school_memberships sm
    where sm.school_id = p_school_id
      and sm.user_id = auth.uid()
      and sm.role = 'director'
      and sm.status = 'active'
  );
$$;

-- ─── Row level security ──────────────────────────────────────────────────────

alter table public.schools enable row level security;
alter table public.school_classes enable row level security;
alter table public.school_memberships enable row level security;
alter table public.generated_materials enable row level security;

-- schools: members read; directors manage
drop policy if exists schools_select_member on public.schools;
create policy schools_select_member
  on public.schools for select
  using (public.is_active_school_member(id));

drop policy if exists schools_insert_director on public.schools;
create policy schools_insert_director
  on public.schools for insert
  with check (director_user_id = auth.uid());

drop policy if exists schools_update_director on public.schools;
create policy schools_update_director
  on public.schools for update
  using (public.is_school_director(id))
  with check (public.is_school_director(id));

-- school_classes: members read; directors write
drop policy if exists school_classes_select_member on public.school_classes;
create policy school_classes_select_member
  on public.school_classes for select
  using (public.is_active_school_member(school_id));

drop policy if exists school_classes_insert_director on public.school_classes;
create policy school_classes_insert_director
  on public.school_classes for insert
  with check (public.is_school_director(school_id));

drop policy if exists school_classes_update_director on public.school_classes;
create policy school_classes_update_director
  on public.school_classes for update
  using (public.is_school_director(school_id))
  with check (public.is_school_director(school_id));

-- school_memberships: own row + directors see school roster
drop policy if exists school_memberships_select_own on public.school_memberships;
create policy school_memberships_select_own
  on public.school_memberships for select
  using (user_id = auth.uid());

drop policy if exists school_memberships_select_director on public.school_memberships;
create policy school_memberships_select_director
  on public.school_memberships for select
  using (public.is_school_director(school_id));

drop policy if exists school_memberships_insert_director on public.school_memberships;
create policy school_memberships_insert_director
  on public.school_memberships for insert
  with check (public.is_school_director(school_id));

drop policy if exists school_memberships_update_director on public.school_memberships;
create policy school_memberships_update_director
  on public.school_memberships for update
  using (public.is_school_director(school_id))
  with check (public.is_school_director(school_id));

-- generated_materials: teachers own; directors read school materials
drop policy if exists "generated_materials_select_own" on public.generated_materials;
drop policy if exists generated_materials_select_own on public.generated_materials;
create policy generated_materials_select_own
  on public.generated_materials for select
  using (user_id = auth.uid());

drop policy if exists generated_materials_select_director on public.generated_materials;
create policy generated_materials_select_director
  on public.generated_materials for select
  using (
    school_id is not null
    and public.is_school_director(school_id)
  );

drop policy if exists generated_materials_insert_own on public.generated_materials;
create policy generated_materials_insert_own
  on public.generated_materials for insert
  with check (user_id = auth.uid());
