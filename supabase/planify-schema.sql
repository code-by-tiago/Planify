-- =========================================================
-- PLANIFY | SUPABASE DATABASE SCHEMA
-- Execute manualmente no SQL Editor do Supabase.
-- Não coloque chaves secretas neste arquivo.
-- =========================================================

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('owner', 'admin', 'teacher', 'school_manager');
  end if;

  if not exists (select 1 from pg_type where typname = 'profile_status') then
    create type public.profile_status as enum ('active', 'inactive', 'pending', 'blocked');
  end if;

  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid');
  end if;

  if not exists (select 1 from pg_type where typname = 'plan_interval') then
    create type public.plan_interval as enum ('free', 'monthly', 'yearly');
  end if;

  if not exists (select 1 from pg_type where typname = 'document_status') then
    create type public.document_status as enum ('draft', 'ready', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'document_type') then
    create type public.document_type as enum (
      'planning_annual',
      'planning_quarterly',
      'teaching_material',
      'assessment',
      'activity',
      'editor_document'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'lesson_plan_type') then
    create type public.lesson_plan_type as enum ('annual', 'quarterly');
  end if;

  if not exists (select 1 from pg_type where typname = 'teaching_material_type') then
    create type public.teaching_material_type as enum (
      'activity',
      'assessment',
      'worksheet',
      'lesson_sequence',
      'pedagogical_game',
      'project',
      'reading_guide'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'history_action') then
    create type public.history_action as enum (
      'created',
      'updated',
      'opened',
      'downloaded',
      'archived',
      'duplicated'
    );
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role public.app_role not null default 'teacher',
  status public.profile_status not null default 'pending',
  is_admin boolean not null default false,
  is_owner boolean not null default false,
  school_name text,
  phone text,
  stripe_customer_id text unique,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_status_idx on public.profiles(status);
create index if not exists profiles_stripe_customer_id_idx on public.profiles(stripe_customer_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  price_in_cents integer not null default 0 check (price_in_cents >= 0),
  currency text not null default 'BRL',
  interval public.plan_interval not null,
  stripe_price_id text unique,
  document_limit_per_month integer,
  is_active boolean not null default true,
  is_popular boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plans_slug_idx on public.plans(slug);
create index if not exists plans_stripe_price_id_idx on public.plans(stripe_price_id);
create index if not exists plans_is_active_idx on public.plans(is_active);

drop trigger if exists set_plans_updated_at on public.plans;
create trigger set_plans_updated_at
before update on public.plans
for each row
execute function public.set_updated_at();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status public.subscription_status not null default 'incomplete',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_plan_id_idx on public.subscriptions(plan_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists subscriptions_period_end_idx on public.subscriptions(current_period_end);
create index if not exists subscriptions_stripe_subscription_id_idx on public.subscriptions(stripe_subscription_id);

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  type public.document_type not null,
  status public.document_status not null default 'draft',
  content_html text,
  content_text text,
  storage_path text,
  file_name text,
  file_format text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_id_idx on public.documents(user_id);
create index if not exists documents_type_idx on public.documents(type);
create index if not exists documents_status_idx on public.documents(status);
create index if not exists documents_created_at_idx on public.documents(created_at desc);

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  type public.lesson_plan_type not null,
  status public.document_status not null default 'draft',
  title text not null,
  school_name text,
  teacher_name text,
  subject text not null,
  grade text not null,
  school_stage text not null,
  academic_year text,
  quarter text,
  workload text,
  theme text,
  contents jsonb not null default '[]'::jsonb,
  selected_bncc_skill_codes text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lesson_plans_user_id_idx on public.lesson_plans(user_id);
create index if not exists lesson_plans_document_id_idx on public.lesson_plans(document_id);
create index if not exists lesson_plans_type_idx on public.lesson_plans(type);
create index if not exists lesson_plans_subject_idx on public.lesson_plans(subject);
create index if not exists lesson_plans_created_at_idx on public.lesson_plans(created_at desc);

drop trigger if exists set_lesson_plans_updated_at on public.lesson_plans;
create trigger set_lesson_plans_updated_at
before update on public.lesson_plans
for each row
execute function public.set_updated_at();

create table if not exists public.teaching_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  title text not null,
  type public.teaching_material_type not null,
  status public.document_status not null default 'draft',
  subject text not null,
  grade text not null,
  school_stage text not null,
  theme text not null,
  objectives text[] not null default '{}',
  instructions text[] not null default '{}',
  sections jsonb not null default '[]'::jsonb,
  selected_bncc_skill_codes text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists teaching_materials_user_id_idx on public.teaching_materials(user_id);
create index if not exists teaching_materials_document_id_idx on public.teaching_materials(document_id);
create index if not exists teaching_materials_type_idx on public.teaching_materials(type);
create index if not exists teaching_materials_subject_idx on public.teaching_materials(subject);
create index if not exists teaching_materials_created_at_idx on public.teaching_materials(created_at desc);

drop trigger if exists set_teaching_materials_updated_at on public.teaching_materials;
create trigger set_teaching_materials_updated_at
before update on public.teaching_materials
for each row
execute function public.set_updated_at();

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

create index if not exists bncc_skills_code_idx on public.bncc_skills(code);
create index if not exists bncc_skills_stage_idx on public.bncc_skills(education_stage);
create index if not exists bncc_skills_subject_idx on public.bncc_skills(subject);
create index if not exists bncc_skills_grade_idx on public.bncc_skills(grade);
create index if not exists bncc_skills_active_idx on public.bncc_skills(is_active);

drop trigger if exists set_bncc_skills_updated_at on public.bncc_skills;
create trigger set_bncc_skills_updated_at
before update on public.bncc_skills
for each row
execute function public.set_updated_at();

create table if not exists public.user_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entity_id uuid,
  entity_type text not null,
  action public.history_action not null,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_history_user_id_idx on public.user_history(user_id);
create index if not exists user_history_entity_idx on public.user_history(entity_id, entity_type);
create index if not exists user_history_created_at_idx on public.user_history(created_at desc);

create table if not exists public.marketplace_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  title text not null,
  description text,
  category text not null,
  subject text,
  grade text,
  school_stage text,
  tags text[] not null default '{}',
  is_published boolean not null default false,
  is_featured boolean not null default false,
  download_count integer not null default 0 check (download_count >= 0),
  rating_average numeric(3,2) not null default 0 check (rating_average >= 0 and rating_average <= 5),
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketplace_items_user_id_idx on public.marketplace_items(user_id);
create index if not exists marketplace_items_document_id_idx on public.marketplace_items(document_id);
create index if not exists marketplace_items_category_idx on public.marketplace_items(category);
create index if not exists marketplace_items_published_idx on public.marketplace_items(is_published);
create index if not exists marketplace_items_featured_idx on public.marketplace_items(is_featured);

drop trigger if exists set_marketplace_items_updated_at on public.marketplace_items;
create trigger set_marketplace_items_updated_at
before update on public.marketplace_items
for each row
execute function public.set_updated_at();

create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  title text not null,
  description text,
  category text not null,
  subject text,
  grade text,
  school_stage text,
  tags text[] not null default '{}',
  is_premium boolean not null default true,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists library_items_created_by_idx on public.library_items(created_by);
create index if not exists library_items_document_id_idx on public.library_items(document_id);
create index if not exists library_items_category_idx on public.library_items(category);
create index if not exists library_items_premium_idx on public.library_items(is_premium);
create index if not exists library_items_published_idx on public.library_items(is_published);
create index if not exists library_items_featured_idx on public.library_items(is_featured);

drop trigger if exists set_library_items_updated_at on public.library_items;
create trigger set_library_items_updated_at
before update on public.library_items
for each row
execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role in ('owner', 'admin')
        or p.is_admin = true
        or p.is_owner = true
      )
  );
$$;

create or replace function public.has_active_subscription(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.subscriptions s
    join public.plans p on p.id = s.plan_id
    where s.user_id = target_user_id
      and s.status = 'active'
      and coalesce(s.current_period_end, now() + interval '1 day') > now()
      and p.is_active = true
      and p.price_in_cents > 0
  );
$$;

create or replace function public.has_active_subscription()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.has_active_subscription(auth.uid());
$$;

create or replace function public.can_access_app()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_admin() or public.has_active_subscription();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    status,
    is_admin,
    is_owner
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    'teacher',
    'pending',
    false,
    false
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.documents enable row level security;
alter table public.lesson_plans enable row level security;
alter table public.teaching_materials enable row level security;
alter table public.bncc_skills enable row level security;
alter table public.user_history enable row level security;
alter table public.marketplace_items enable row level security;
alter table public.library_items enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "plans_select_active" on public.plans;
create policy "plans_select_active"
on public.plans
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "plans_admin_all" on public.plans;
create policy "plans_admin_all"
on public.plans
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "subscriptions_select_own_or_admin" on public.subscriptions;
create policy "subscriptions_select_own_or_admin"
on public.subscriptions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "subscriptions_admin_all" on public.subscriptions;
create policy "subscriptions_admin_all"
on public.subscriptions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "documents_owner_premium_select" on public.documents;
create policy "documents_owner_premium_select"
on public.documents
for select
to authenticated
using (public.is_admin() or (user_id = auth.uid() and public.can_access_app()));

drop policy if exists "documents_owner_premium_insert" on public.documents;
create policy "documents_owner_premium_insert"
on public.documents
for insert
to authenticated
with check (user_id = auth.uid() and public.can_access_app());

drop policy if exists "documents_owner_premium_update" on public.documents;
create policy "documents_owner_premium_update"
on public.documents
for update
to authenticated
using (public.is_admin() or (user_id = auth.uid() and public.can_access_app()))
with check (public.is_admin() or (user_id = auth.uid() and public.can_access_app()));

drop policy if exists "documents_owner_premium_delete" on public.documents;
create policy "documents_owner_premium_delete"
on public.documents
for delete
to authenticated
using (public.is_admin() or (user_id = auth.uid() and public.can_access_app()));

drop policy if exists "lesson_plans_owner_premium_all" on public.lesson_plans;
create policy "lesson_plans_owner_premium_all"
on public.lesson_plans
for all
to authenticated
using (public.is_admin() or (user_id = auth.uid() and public.can_access_app()))
with check (public.is_admin() or (user_id = auth.uid() and public.can_access_app()));

drop policy if exists "teaching_materials_owner_premium_all" on public.teaching_materials;
create policy "teaching_materials_owner_premium_all"
on public.teaching_materials
for all
to authenticated
using (public.is_admin() or (user_id = auth.uid() and public.can_access_app()))
with check (public.is_admin() or (user_id = auth.uid() and public.can_access_app()));

drop policy if exists "bncc_skills_select_premium" on public.bncc_skills;
create policy "bncc_skills_select_premium"
on public.bncc_skills
for select
to authenticated
using (is_active = true and public.can_access_app());

drop policy if exists "bncc_skills_admin_all" on public.bncc_skills;
create policy "bncc_skills_admin_all"
on public.bncc_skills
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "user_history_owner_premium_all" on public.user_history;
create policy "user_history_owner_premium_all"
on public.user_history
for all
to authenticated
using (public.is_admin() or (user_id = auth.uid() and public.can_access_app()))
with check (public.is_admin() or (user_id = auth.uid() and public.can_access_app()));

drop policy if exists "marketplace_items_select_published_or_owner" on public.marketplace_items;
create policy "marketplace_items_select_published_or_owner"
on public.marketplace_items
for select
to authenticated
using (public.is_admin() or (public.can_access_app() and (is_published = true or user_id = auth.uid())));

drop policy if exists "marketplace_items_owner_premium_all" on public.marketplace_items;
create policy "marketplace_items_owner_premium_all"
on public.marketplace_items
for all
to authenticated
using (public.is_admin() or (user_id = auth.uid() and public.can_access_app()))
with check (public.is_admin() or (user_id = auth.uid() and public.can_access_app()));

drop policy if exists "library_items_select_published_premium" on public.library_items;
create policy "library_items_select_published_premium"
on public.library_items
for select
to authenticated
using (public.is_admin() or (is_published = true and public.can_access_app()));

drop policy if exists "library_items_admin_all" on public.library_items;
create policy "library_items_admin_all"
on public.library_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.plans (
  slug,
  name,
  description,
  price_in_cents,
  currency,
  interval,
  stripe_price_id,
  document_limit_per_month,
  is_active,
  is_popular,
  metadata
)
values
  (
    'professor-start',
    'Professor Start',
    'Plano inicial para organização da conta.',
    0,
    'BRL',
    'free',
    null,
    0,
    true,
    false,
    '{"access":"limited"}'::jsonb
  ),
  (
    'professor-pro-monthly',
    'Professor Pro',
    'Plano mensal para professores.',
    4990,
    'BRL',
    'monthly',
    null,
    30,
    true,
    true,
    '{"access":"premium"}'::jsonb
  ),
  (
    'professor-pro-yearly',
    'Professor Pro Anual',
    'Plano anual para professores.',
    47990,
    'BRL',
    'yearly',
    null,
    30,
    true,
    false,
    '{"access":"premium"}'::jsonb
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  price_in_cents = excluded.price_in_cents,
  currency = excluded.currency,
  interval = excluded.interval,
  document_limit_per_month = excluded.document_limit_per_month,
  is_active = excluded.is_active,
  is_popular = excluded.is_popular,
  metadata = excluded.metadata,
  updated_at = now();

select 'Planify schema created successfully' as status;
