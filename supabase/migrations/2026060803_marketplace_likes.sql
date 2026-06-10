-- Curtidas em materiais da Comunidade

create table if not exists public.marketplace_material_likes (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.marketplace_materials(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (material_id, user_id)
);

create index if not exists marketplace_material_likes_material_idx
  on public.marketplace_material_likes (material_id);

create index if not exists marketplace_material_likes_user_idx
  on public.marketplace_material_likes (user_id, created_at desc);

alter table public.marketplace_material_likes enable row level security;

drop policy if exists "marketplace_likes_read_published_material" on public.marketplace_material_likes;
create policy "marketplace_likes_read_published_material"
on public.marketplace_material_likes
for select
using (
  exists (
    select 1 from public.marketplace_materials m
    where m.id = material_id and m.is_published = true
  )
);

drop policy if exists "marketplace_likes_insert_authenticated" on public.marketplace_material_likes;
create policy "marketplace_likes_insert_authenticated"
on public.marketplace_material_likes
for insert
with check (auth.uid() = user_id);

drop policy if exists "marketplace_likes_delete_own" on public.marketplace_material_likes;
create policy "marketplace_likes_delete_own"
on public.marketplace_material_likes
for delete
using (auth.uid() = user_id);

-- Bucket público para avatares da Comunidade
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
