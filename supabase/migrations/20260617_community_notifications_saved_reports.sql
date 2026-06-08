-- Notificações, materiais salvos e denúncias da Comunidade Planify

create type public.community_notification_type as enum (
  'comment',
  'like',
  'friend_request',
  'friend_accepted',
  'message'
);

create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.community_notification_type not null,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid references public.marketplace_materials(id) on delete cascade,
  conversation_id uuid references public.community_conversations(id) on delete cascade,
  friendship_id uuid references public.community_friendships(id) on delete cascade,
  body_preview text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists community_notifications_user_created_idx
  on public.community_notifications (user_id, created_at desc);

create index if not exists community_notifications_user_unread_idx
  on public.community_notifications (user_id, read_at)
  where read_at is null;

create table if not exists public.community_saved_materials (
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.marketplace_materials(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, material_id)
);

create index if not exists community_saved_materials_user_idx
  on public.community_saved_materials (user_id, created_at desc);

create type public.community_report_target as enum (
  'material',
  'comment',
  'user'
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  target_type public.community_report_target not null,
  target_id uuid not null,
  reason text not null check (char_length(trim(reason)) >= 3),
  created_at timestamptz not null default now()
);

create index if not exists community_reports_reporter_idx
  on public.community_reports (reporter_user_id, created_at desc);

-- RLS
alter table public.community_notifications enable row level security;
alter table public.community_saved_materials enable row level security;
alter table public.community_reports enable row level security;

drop policy if exists "community_notifications_select_own" on public.community_notifications;
create policy "community_notifications_select_own"
on public.community_notifications
for select
using (auth.uid() = user_id);

drop policy if exists "community_notifications_update_own" on public.community_notifications;
create policy "community_notifications_update_own"
on public.community_notifications
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "community_saved_materials_select_own" on public.community_saved_materials;
create policy "community_saved_materials_select_own"
on public.community_saved_materials
for select
using (auth.uid() = user_id);

drop policy if exists "community_saved_materials_insert_own" on public.community_saved_materials;
create policy "community_saved_materials_insert_own"
on public.community_saved_materials
for insert
with check (auth.uid() = user_id);

drop policy if exists "community_saved_materials_delete_own" on public.community_saved_materials;
create policy "community_saved_materials_delete_own"
on public.community_saved_materials
for delete
using (auth.uid() = user_id);

drop policy if exists "community_reports_insert_own" on public.community_reports;
create policy "community_reports_insert_own"
on public.community_reports
for insert
with check (auth.uid() = reporter_user_id);

drop policy if exists "community_reports_select_own" on public.community_reports;
create policy "community_reports_select_own"
on public.community_reports
for select
using (auth.uid() = reporter_user_id);

-- Realtime para mensagens (ignorado se já estiver na publicação)
do $$
begin
  alter publication supabase_realtime add table public.community_messages;
exception
  when duplicate_object then null;
end $$;
