-- Autonomous teacher class history + optional class name on generated materials.

create table if not exists public.teacher_classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists teacher_classes_user_name_unique
  on public.teacher_classes (user_id, lower(btrim(name)));

create index if not exists teacher_classes_user_id_idx
  on public.teacher_classes (user_id, updated_at desc);

alter table public.generated_materials
  add column if not exists class_name text;

alter table public.teacher_classes enable row level security;

drop policy if exists teacher_classes_select_own on public.teacher_classes;
create policy teacher_classes_select_own
  on public.teacher_classes for select
  using (user_id = auth.uid());

drop policy if exists teacher_classes_insert_own on public.teacher_classes;
create policy teacher_classes_insert_own
  on public.teacher_classes for insert
  with check (user_id = auth.uid());

drop policy if exists teacher_classes_update_own on public.teacher_classes;
create policy teacher_classes_update_own
  on public.teacher_classes for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists teacher_classes_delete_own on public.teacher_classes;
create policy teacher_classes_delete_own
  on public.teacher_classes for delete
  using (user_id = auth.uid());
