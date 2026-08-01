-- Comunidade Docente Planify — posts, materiais, grupos, eventos, badges e seguidores

-- ---------------------------------------------------------------------------
-- Posts e interações
-- ---------------------------------------------------------------------------

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 3 and char_length(title) <= 300),
  body text not null default '' check (char_length(body) <= 8000),
  disciplina text not null default 'Multicomponente',
  tags text[] not null default '{}',
  likes_count integer not null default 0 check (likes_count >= 0),
  comments_count integer not null default 0 check (comments_count >= 0),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_author_idx
  on public.community_posts (author_id, created_at desc);

create index if not exists community_posts_disciplina_idx
  on public.community_posts (disciplina, created_at desc);

create index if not exists community_posts_published_idx
  on public.community_posts (created_at desc)
  where is_published = true;

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.community_posts(id) on delete cascade,
  material_id uuid,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (
    char_length(trim(body)) >= 1
    and char_length(body) <= 4000
  ),
  created_at timestamptz not null default now(),
  constraint community_comments_target_check check (
    (post_id is not null and material_id is null)
    or (post_id is null and material_id is not null)
  )
);

create index if not exists community_comments_post_idx
  on public.community_comments (post_id, created_at asc);

create index if not exists community_comments_material_idx
  on public.community_comments (material_id, created_at asc);

create table if not exists public.community_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.community_posts(id) on delete cascade,
  material_id uuid,
  created_at timestamptz not null default now(),
  constraint community_likes_target_check check (
    (post_id is not null and material_id is null)
    or (post_id is null and material_id is not null)
  ),
  constraint community_likes_unique_post unique (user_id, post_id),
  constraint community_likes_unique_material unique (user_id, material_id)
);

create index if not exists community_likes_post_idx
  on public.community_likes (post_id);

create index if not exists community_likes_material_idx
  on public.community_likes (material_id);

-- ---------------------------------------------------------------------------
-- Materiais da comunidade (uploads PDF, DOCX, PPTX, imagens)
-- ---------------------------------------------------------------------------

create table if not exists public.community_materials (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 3 and char_length(title) <= 300),
  description text not null default '' check (char_length(description) <= 4000),
  disciplina text not null default 'Multicomponente',
  ano_serie text not null default 'Geral',
  tags text[] not null default '{}',
  cover_url text,
  file_path text,
  file_name text,
  file_mime text,
  file_size bigint not null default 0 check (file_size >= 0),
  views_count integer not null default 0 check (views_count >= 0),
  likes_count integer not null default 0 check (likes_count >= 0),
  downloads_count integer not null default 0 check (downloads_count >= 0),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_materials_author_idx
  on public.community_materials (author_id, created_at desc);

create index if not exists community_materials_disciplina_idx
  on public.community_materials (disciplina, views_count desc);

create index if not exists community_materials_published_idx
  on public.community_materials (views_count desc)
  where is_published = true;

alter table public.community_comments
  add constraint community_comments_material_fk
  foreign key (material_id) references public.community_materials(id) on delete cascade;

alter table public.community_likes
  add constraint community_likes_material_fk
  foreign key (material_id) references public.community_materials(id) on delete cascade;

-- ---------------------------------------------------------------------------
-- Seguidores, grupos, eventos, badges
-- ---------------------------------------------------------------------------

create table if not exists public.community_followers (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint community_followers_not_self check (follower_id <> following_id),
  constraint community_followers_unique_pair unique (follower_id, following_id)
);

create index if not exists community_followers_following_idx
  on public.community_followers (following_id);

create table if not exists public.community_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 3 and char_length(name) <= 120),
  description text not null default '' check (char_length(description) <= 2000),
  disciplina text not null default 'Multicomponente',
  cover_url text,
  members_count integer not null default 1 check (members_count >= 0),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_groups_disciplina_idx
  on public.community_groups (disciplina, members_count desc);

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 3 and char_length(title) <= 200),
  description text not null default '' check (char_length(description) <= 4000),
  presenter_name text not null default '',
  starts_at timestamptz not null,
  is_online boolean not null default true,
  location text,
  max_attendees integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_events_starts_at_idx
  on public.community_events (starts_at asc);

create table if not exists public.community_badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) >= 2 and char_length(slug) <= 60),
  name text not null check (char_length(trim(name)) >= 2 and char_length(name) <= 80),
  description text not null default '' check (char_length(description) <= 500),
  icon text not null default 'star',
  color text not null default '#06B6D4',
  min_reputation integer not null default 0 check (min_reputation >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.community_user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.community_badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  constraint community_user_badges_unique unique (user_id, badge_id)
);

create index if not exists community_user_badges_user_idx
  on public.community_user_badges (user_id);

-- Reputação no perfil (coluna opcional)
alter table public.profiles
  add column if not exists community_reputation integer not null default 0;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes enable row level security;
alter table public.community_materials enable row level security;
alter table public.community_followers enable row level security;
alter table public.community_groups enable row level security;
alter table public.community_events enable row level security;
alter table public.community_badges enable row level security;
alter table public.community_user_badges enable row level security;

-- Posts
drop policy if exists "community_posts_select_published" on public.community_posts;
create policy "community_posts_select_published"
on public.community_posts for select
using (is_published = true or auth.uid() = author_id);

drop policy if exists "community_posts_insert_own" on public.community_posts;
create policy "community_posts_insert_own"
on public.community_posts for insert
with check (auth.uid() = author_id);

drop policy if exists "community_posts_update_own" on public.community_posts;
create policy "community_posts_update_own"
on public.community_posts for update
using (auth.uid() = author_id);

drop policy if exists "community_posts_delete_own" on public.community_posts;
create policy "community_posts_delete_own"
on public.community_posts for delete
using (auth.uid() = author_id);

-- Comments
drop policy if exists "community_comments_select_all" on public.community_comments;
create policy "community_comments_select_all"
on public.community_comments for select using (true);

drop policy if exists "community_comments_insert_own" on public.community_comments;
create policy "community_comments_insert_own"
on public.community_comments for insert
with check (auth.uid() = author_id);

drop policy if exists "community_comments_delete_own" on public.community_comments;
create policy "community_comments_delete_own"
on public.community_comments for delete
using (auth.uid() = author_id);

-- Likes
drop policy if exists "community_likes_select_all" on public.community_likes;
create policy "community_likes_select_all"
on public.community_likes for select using (true);

drop policy if exists "community_likes_insert_own" on public.community_likes;
create policy "community_likes_insert_own"
on public.community_likes for insert
with check (auth.uid() = user_id);

drop policy if exists "community_likes_delete_own" on public.community_likes;
create policy "community_likes_delete_own"
on public.community_likes for delete
using (auth.uid() = user_id);

-- Materials
drop policy if exists "community_materials_select_published" on public.community_materials;
create policy "community_materials_select_published"
on public.community_materials for select
using (is_published = true or auth.uid() = author_id);

drop policy if exists "community_materials_insert_own" on public.community_materials;
create policy "community_materials_insert_own"
on public.community_materials for insert
with check (auth.uid() = author_id);

drop policy if exists "community_materials_update_own" on public.community_materials;
create policy "community_materials_update_own"
on public.community_materials for update
using (auth.uid() = author_id);

drop policy if exists "community_materials_delete_own" on public.community_materials;
create policy "community_materials_delete_own"
on public.community_materials for delete
using (auth.uid() = author_id);

-- Followers
drop policy if exists "community_followers_select_all" on public.community_followers;
create policy "community_followers_select_all"
on public.community_followers for select using (true);

drop policy if exists "community_followers_insert_own" on public.community_followers;
create policy "community_followers_insert_own"
on public.community_followers for insert
with check (auth.uid() = follower_id);

drop policy if exists "community_followers_delete_own" on public.community_followers;
create policy "community_followers_delete_own"
on public.community_followers for delete
using (auth.uid() = follower_id);

-- Groups
drop policy if exists "community_groups_select_public" on public.community_groups;
create policy "community_groups_select_public"
on public.community_groups for select
using (is_public = true or auth.uid() = owner_id);

drop policy if exists "community_groups_insert_own" on public.community_groups;
create policy "community_groups_insert_own"
on public.community_groups for insert
with check (auth.uid() = owner_id);

drop policy if exists "community_groups_update_own" on public.community_groups;
create policy "community_groups_update_own"
on public.community_groups for update
using (auth.uid() = owner_id);

-- Events
drop policy if exists "community_events_select_all" on public.community_events;
create policy "community_events_select_all"
on public.community_events for select using (true);

drop policy if exists "community_events_insert_own" on public.community_events;
create policy "community_events_insert_own"
on public.community_events for insert
with check (auth.uid() = host_id);

-- Badges (leitura pública, atribuição via service role)
drop policy if exists "community_badges_select_all" on public.community_badges;
create policy "community_badges_select_all"
on public.community_badges for select using (true);

drop policy if exists "community_user_badges_select_all" on public.community_user_badges;
create policy "community_user_badges_select_all"
on public.community_user_badges for select using (true);
