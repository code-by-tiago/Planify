-- Planify 9.19.1 — Marketplace real entre professores
-- Rode no Supabase SQL Editor antes/depois da etapa se o Marketplace der erro de tabela, coluna ou bucket.
-- Seguro para rodar mais de uma vez.

create extension if not exists pgcrypto;

create table if not exists public.marketplace_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  owner_email text,
  author_name text,
  title text not null,
  description text not null default '',
  etapa text not null default 'Ensino Fundamental',
  ano_serie text not null default 'Geral',
  componente text not null default 'Multicomponente',
  tipo_material text not null default 'Material de apoio',
  tema text,
  tags text[] not null default '{}',
  file_name text,
  file_path text,
  file_mime text,
  file_size bigint not null default 0,
  is_published boolean not null default true,
  downloads_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketplace_materials
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists owner_email text,
  add column if not exists author_name text,
  add column if not exists description text not null default '',
  add column if not exists etapa text not null default 'Ensino Fundamental',
  add column if not exists ano_serie text not null default 'Geral',
  add column if not exists componente text not null default 'Multicomponente',
  add column if not exists tipo_material text not null default 'Material de apoio',
  add column if not exists tema text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists file_name text,
  add column if not exists file_path text,
  add column if not exists file_mime text,
  add column if not exists file_size bigint not null default 0,
  add column if not exists is_published boolean not null default true,
  add column if not exists downloads_count bigint not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists marketplace_materials_published_idx
  on public.marketplace_materials (is_published, created_at desc);

create index if not exists marketplace_materials_user_idx
  on public.marketplace_materials (user_id, created_at desc);

create index if not exists marketplace_materials_etapa_idx
  on public.marketplace_materials (etapa);

create index if not exists marketplace_materials_componente_idx
  on public.marketplace_materials (componente);

alter table public.marketplace_materials enable row level security;

drop policy if exists "Marketplace read published" on public.marketplace_materials;
create policy "Marketplace read published"
on public.marketplace_materials
for select
using (is_published = true);

drop policy if exists "Marketplace owner read own" on public.marketplace_materials;
create policy "Marketplace owner read own"
on public.marketplace_materials
for select
using (auth.uid() = user_id);

drop policy if exists "Marketplace owner insert own" on public.marketplace_materials;
create policy "Marketplace owner insert own"
on public.marketplace_materials
for insert
with check (auth.uid() = user_id);

drop policy if exists "Marketplace owner update own" on public.marketplace_materials;
create policy "Marketplace owner update own"
on public.marketplace_materials
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Marketplace owner delete own" on public.marketplace_materials;
create policy "Marketplace owner delete own"
on public.marketplace_materials
for delete
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'marketplace-materiais',
  'marketplace-materiais',
  false,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain',
    'text/html',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
