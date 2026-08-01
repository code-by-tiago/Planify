-- Vincula materiais do marketplace a discussões da comunidade

create table if not exists public.community_post_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  material_id uuid not null references public.marketplace_materials(id) on delete cascade,
  file_name text not null,
  file_mime text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (post_id, material_id)
);

create index if not exists community_post_attachments_post_idx
  on public.community_post_attachments (post_id, sort_order);

alter table public.community_post_attachments enable row level security;

drop policy if exists "community_post_attachments_select_published" on public.community_post_attachments;
create policy "community_post_attachments_select_published"
on public.community_post_attachments for select
using (
  exists (
    select 1 from public.community_posts p
    where p.id = post_id and p.is_published = true
  )
);

drop policy if exists "community_post_attachments_insert_author" on public.community_post_attachments;
create policy "community_post_attachments_insert_author"
on public.community_post_attachments for insert
with check (
  exists (
    select 1 from public.community_posts p
    where p.id = post_id and p.author_id = auth.uid()
  )
);

alter type public.community_report_target add value if not exists 'post';
alter type public.community_report_target add value if not exists 'post_comment';
