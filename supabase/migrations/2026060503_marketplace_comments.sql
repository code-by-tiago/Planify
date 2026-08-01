-- Comentários em materiais do Marketplace (estilo rede social)

create table if not exists public.marketplace_material_comments (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.marketplace_materials(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null default 'Professor',
  author_email text,
  body text not null check (char_length(trim(body)) >= 2),
  created_at timestamptz not null default now()
);

create index if not exists marketplace_comments_material_idx
  on public.marketplace_material_comments (material_id, created_at desc);

alter table public.marketplace_material_comments enable row level security;

drop policy if exists "marketplace_comments_read_published_material" on public.marketplace_material_comments;
create policy "marketplace_comments_read_published_material"
on public.marketplace_material_comments
for select
using (
  exists (
    select 1 from public.marketplace_materials m
    where m.id = material_id and m.is_published = true
  )
);

drop policy if exists "marketplace_comments_insert_authenticated" on public.marketplace_material_comments;
create policy "marketplace_comments_insert_authenticated"
on public.marketplace_material_comments
for insert
with check (auth.uid() is not null);

-- Permite publicar HTML gerado pelo editor/ferramentas
update storage.buckets
set allowed_mime_types = array(
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
)
where id = 'marketplace-materiais';
