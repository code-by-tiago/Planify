-- Shared viral materials (public /s/[id]) + material folders (Escola → Turma)

create table if not exists public.shared_materials (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  title text not null,
  html text not null,
  tool_id text,
  view_count integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists shared_materials_owner_created_idx
  on public.shared_materials (owner_user_id, created_at desc);

alter table public.shared_materials enable row level security;

drop policy if exists "shared_materials_public_read" on public.shared_materials;
create policy "shared_materials_public_read"
on public.shared_materials
for select
using (expires_at is null or expires_at > now());

drop policy if exists "shared_materials_owner_insert" on public.shared_materials;
create policy "shared_materials_owner_insert"
on public.shared_materials
for insert
with check (auth.uid() = owner_user_id);

create table if not exists public.material_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_label text not null default '',
  class_label text not null default '',
  parent_id uuid references public.material_folders(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, school_label, class_label)
);

create index if not exists material_folders_user_idx
  on public.material_folders (user_id, school_label, class_label);

alter table public.material_folders enable row level security;

drop policy if exists "material_folders_own" on public.material_folders;
create policy "material_folders_own"
on public.material_folders
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.generated_materials
  add column if not exists folder_id uuid references public.material_folders(id) on delete set null;

create index if not exists generated_materials_folder_idx
  on public.generated_materials (folder_id);
