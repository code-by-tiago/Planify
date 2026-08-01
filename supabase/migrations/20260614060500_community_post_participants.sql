-- Participantes convidados em discussões da Comunidade Docente

create table if not exists public.community_post_participants (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  invited_at timestamptz not null default now(),
  constraint community_post_participants_unique unique (post_id, user_id)
);

create index if not exists community_post_participants_user_idx
  on public.community_post_participants (user_id);

create index if not exists community_post_participants_post_idx
  on public.community_post_participants (post_id);

alter table public.community_post_participants enable row level security;

drop policy if exists "community_post_participants_select_all" on public.community_post_participants;
create policy "community_post_participants_select_all"
on public.community_post_participants for select using (true);

drop policy if exists "community_post_participants_insert_inviter" on public.community_post_participants;
create policy "community_post_participants_insert_inviter"
on public.community_post_participants for insert
with check (
  exists (
    select 1 from public.community_posts p
    where p.id = post_id and p.author_id = auth.uid()
  )
);

drop policy if exists "community_post_participants_delete_own" on public.community_post_participants;
create policy "community_post_participants_delete_own"
on public.community_post_participants for delete
using (auth.uid() = user_id);
