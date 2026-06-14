-- Comunidade Docente: group posts, event RSVP, saved posts, notification deep links

-- Posts linked to groups
alter table public.community_posts
  add column if not exists group_id uuid references public.community_groups(id) on delete set null;

create index if not exists community_posts_group_idx
  on public.community_posts (group_id, created_at desc)
  where group_id is not null;

-- Event participants (confirmar presença / tenho interesse)
create table if not exists public.community_event_participants (
  event_id uuid not null references public.community_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'going' check (status in ('going', 'interested')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists community_event_participants_event_idx
  on public.community_event_participants (event_id, status);

create index if not exists community_event_participants_user_idx
  on public.community_event_participants (user_id, created_at desc);

-- Saved discussion posts
create table if not exists public.community_saved_posts (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists community_saved_posts_user_idx
  on public.community_saved_posts (user_id, created_at desc);

-- Notification deep links
alter table public.community_notifications
  add column if not exists target_type text;

alter table public.community_notifications
  add column if not exists target_id uuid;

alter table public.community_notifications
  add column if not exists href text;

-- RLS
alter table public.community_event_participants enable row level security;
alter table public.community_saved_posts enable row level security;

drop policy if exists "community_event_participants_select_all" on public.community_event_participants;
create policy "community_event_participants_select_all"
on public.community_event_participants for select using (true);

drop policy if exists "community_event_participants_insert_own" on public.community_event_participants;
create policy "community_event_participants_insert_own"
on public.community_event_participants for insert
with check (auth.uid() = user_id);

drop policy if exists "community_event_participants_update_own" on public.community_event_participants;
create policy "community_event_participants_update_own"
on public.community_event_participants for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "community_event_participants_delete_own" on public.community_event_participants;
create policy "community_event_participants_delete_own"
on public.community_event_participants for delete
using (auth.uid() = user_id);

drop policy if exists "community_saved_posts_select_own" on public.community_saved_posts;
create policy "community_saved_posts_select_own"
on public.community_saved_posts for select
using (auth.uid() = user_id);

drop policy if exists "community_saved_posts_insert_own" on public.community_saved_posts;
create policy "community_saved_posts_insert_own"
on public.community_saved_posts for insert
with check (auth.uid() = user_id);

drop policy if exists "community_saved_posts_delete_own" on public.community_saved_posts;
create policy "community_saved_posts_delete_own"
on public.community_saved_posts for delete
using (auth.uid() = user_id);
