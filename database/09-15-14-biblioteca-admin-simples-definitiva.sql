-- Planify 9.15.14 — Biblioteca Admin simples e definitiva
-- Rode no Supabase SQL Editor somente se o cadastro ainda der erro de tabela/coluna/bucket.
-- Seguro para rodar mais de uma vez.

create extension if not exists pgcrypto;

create table if not exists public.library_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  etapa text not null default 'Ensino Fundamental',
  area_conhecimento text,
  ano_serie text,
  categoria text not null default 'Material',
  tipo_material text,
  componente text not null default 'Multicomponente',
  tema text,
  finalidade text not null default 'Apoio pedagógico',
  nivel_dificuldade text,
  duracao text,
  habilidades_bncc text[] not null default '{}',
  observacoes text,
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

alter table public.library_materials
  add column if not exists area_conhecimento text,
  add column if not exists ano_serie text,
  add column if not exists tipo_material text,
  add column if not exists tema text,
  add column if not exists nivel_dificuldade text,
  add column if not exists duracao text,
  add column if not exists habilidades_bncc text[] not null default '{}',
  add column if not exists observacoes text;

create index if not exists library_materials_published_idx
  on public.library_materials (is_published, created_at desc);

create index if not exists library_materials_etapa_idx
  on public.library_materials (etapa);

create index if not exists library_materials_componente_idx
  on public.library_materials (componente);

alter table public.library_materials enable row level security;

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
    'application/zip',
    'application/x-zip-compressed'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
