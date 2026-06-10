-- Amizades e mensagens diretas na Comunidade Planify

create type public.community_friendship_status as enum (
  'pending',
  'accepted',
  'declined',
  'blocked'
);

create table if not exists public.community_friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status public.community_friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_friendships_not_self check (requester_id <> addressee_id),
  constraint community_friendships_unique_pair unique (requester_id, addressee_id)
);

create unique index if not exists community_friendships_canonical_pair_idx
  on public.community_friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

create index if not exists community_friendships_requester_idx
  on public.community_friendships (requester_id, status);

create index if not exists community_friendships_addressee_idx
  on public.community_friendships (addressee_id, status);

create table if not exists public.community_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references auth.users(id) on delete cascade,
  user_b_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_conversations_not_self check (user_a_id <> user_b_id),
  constraint community_conversations_ordered check (user_a_id < user_b_id),
  constraint community_conversations_unique_pair unique (user_a_id, user_b_id)
);

create index if not exists community_conversations_user_a_idx
  on public.community_conversations (user_a_id, updated_at desc);

create index if not exists community_conversations_user_b_idx
  on public.community_conversations (user_b_id, updated_at desc);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.community_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (
    char_length(trim(body)) >= 1
    and char_length(body) <= 4000
  ),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists community_messages_conversation_created_idx
  on public.community_messages (conversation_id, created_at desc);

create index if not exists community_messages_unread_idx
  on public.community_messages (conversation_id, read_at)
  where read_at is null;

-- RLS
alter table public.community_friendships enable row level security;
alter table public.community_conversations enable row level security;
alter table public.community_messages enable row level security;

drop policy if exists "community_friendships_select_participant" on public.community_friendships;
create policy "community_friendships_select_participant"
on public.community_friendships
for select
using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "community_friendships_insert_requester" on public.community_friendships;
create policy "community_friendships_insert_requester"
on public.community_friendships
for insert
with check (auth.uid() = requester_id);

drop policy if exists "community_friendships_update_participant" on public.community_friendships;
create policy "community_friendships_update_participant"
on public.community_friendships
for update
using (auth.uid() = requester_id or auth.uid() = addressee_id)
with check (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "community_friendships_delete_participant" on public.community_friendships;
create policy "community_friendships_delete_participant"
on public.community_friendships
for delete
using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "community_conversations_select_participant" on public.community_conversations;
create policy "community_conversations_select_participant"
on public.community_conversations
for select
using (auth.uid() = user_a_id or auth.uid() = user_b_id);

drop policy if exists "community_conversations_insert_participant" on public.community_conversations;
create policy "community_conversations_insert_participant"
on public.community_conversations
for insert
with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

drop policy if exists "community_conversations_update_participant" on public.community_conversations;
create policy "community_conversations_update_participant"
on public.community_conversations
for update
using (auth.uid() = user_a_id or auth.uid() = user_b_id)
with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

drop policy if exists "community_messages_select_participant" on public.community_messages;
create policy "community_messages_select_participant"
on public.community_messages
for select
using (
  exists (
    select 1
    from public.community_conversations c
    where c.id = conversation_id
      and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
  )
);

drop policy if exists "community_messages_insert_friends_only" on public.community_messages;
create policy "community_messages_insert_friends_only"
on public.community_messages
for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.community_conversations c
    inner join public.community_friendships f
      on f.status = 'accepted'
      and (
        (f.requester_id = c.user_a_id and f.addressee_id = c.user_b_id)
        or (f.requester_id = c.user_b_id and f.addressee_id = c.user_a_id)
      )
    where c.id = conversation_id
      and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
  )
);

drop policy if exists "community_messages_update_participant" on public.community_messages;
create policy "community_messages_update_participant"
on public.community_messages
for update
using (
  exists (
    select 1
    from public.community_conversations c
    where c.id = conversation_id
      and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.community_conversations c
    where c.id = conversation_id
      and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
  )
);
