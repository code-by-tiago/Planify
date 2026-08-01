-- Planify 9.15 — Biblioteca Premium administrável
-- Rode este SQL no Supabase SQL Editor antes de testar o upload pela página /admin/biblioteca.

create extension if not exists pgcrypto;

create table if not exists public.library_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  etapa text not null default 'Ensino Fundamental',
  categoria text not null default 'Material',
  componente text not null default 'Multicomponente',
  finalidade text not null default '',
  tags text[] not null default '{}',
  file_name text,
  file_path text,
  file_mime text,
  file_size bigint not null default 0,
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists library_materials_published_idx
  on public.library_materials (is_published, created_at desc);

create index if not exists library_materials_categoria_idx
  on public.library_materials (categoria);

alter table public.library_materials enable row level security;

drop policy if exists "library_materials_no_direct_select" on public.library_materials;
drop policy if exists "library_materials_no_direct_insert" on public.library_materials;
drop policy if exists "library_materials_no_direct_update" on public.library_materials;
drop policy if exists "library_materials_no_direct_delete" on public.library_materials;

-- O acesso público direto fica fechado por RLS.
-- A aplicação acessa por API server-side validando admin/premium com planify_access e service role.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'biblioteca-materiais',
  'biblioteca-materiais',
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
    'application/zip'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
