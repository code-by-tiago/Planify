-- Comunidade Docente v3: materiais ocultos do feed (por usuário) e chat de grupos

create table if not exists public.community_hidden_feed_materials (
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.marketplace_materials(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, material_id)
);

create index if not exists community_hidden_feed_materials_user_idx
  on public.community_hidden_feed_materials (user_id, created_at desc);

create table if not exists public.community_group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.community_groups(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (
    char_length(trim(body)) >= 1
    and char_length(body) <= 4000
  ),
  created_at timestamptz not null default now()
);

create index if not exists community_group_messages_group_created_idx
  on public.community_group_messages (group_id, created_at desc);

create index if not exists community_group_messages_sender_idx
  on public.community_group_messages (sender_id, created_at desc);

alter table public.community_hidden_feed_materials enable row level security;
alter table public.community_group_messages enable row level security;

drop policy if exists "community_hidden_feed_materials_select_own" on public.community_hidden_feed_materials;
create policy "community_hidden_feed_materials_select_own"
on public.community_hidden_feed_materials
for select
using (auth.uid() = user_id);

drop policy if exists "community_hidden_feed_materials_insert_own" on public.community_hidden_feed_materials;
create policy "community_hidden_feed_materials_insert_own"
on public.community_hidden_feed_materials
for insert
with check (auth.uid() = user_id);

drop policy if exists "community_hidden_feed_materials_delete_own" on public.community_hidden_feed_materials;
create policy "community_hidden_feed_materials_delete_own"
on public.community_hidden_feed_materials
for delete
using (auth.uid() = user_id);

drop policy if exists "community_group_messages_select_member" on public.community_group_messages;
create policy "community_group_messages_select_member"
on public.community_group_messages
for select
using (
  exists (
    select 1
    from public.community_group_members m
    where m.group_id = community_group_messages.group_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "community_group_messages_insert_member" on public.community_group_messages;
create policy "community_group_messages_insert_member"
on public.community_group_messages
for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.community_group_members m
    where m.group_id = group_id
      and m.user_id = auth.uid()
  )
);
