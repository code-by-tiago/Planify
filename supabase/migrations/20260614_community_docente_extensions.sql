-- Comunidade Docente — membros de grupos, desafios e critérios de badges

create table if not exists public.community_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.community_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  constraint community_group_members_unique unique (group_id, user_id)
);

create index if not exists community_group_members_user_idx
  on public.community_group_members (user_id);

create index if not exists community_group_members_group_idx
  on public.community_group_members (group_id);

create table if not exists public.community_user_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_slug text not null check (char_length(challenge_slug) >= 2),
  completed_at timestamptz not null default now(),
  constraint community_user_challenges_unique unique (user_id, challenge_slug)
);

create index if not exists community_user_challenges_user_idx
  on public.community_user_challenges (user_id);

alter table public.community_badges
  add column if not exists criteria jsonb not null default '{}'::jsonb;

update public.community_badges
set criteria = case slug
  when 'colaborador' then '{"minMaterials":5,"minReputation":100}'::jsonb
  when 'mentor' then '{"minComments":25,"minReputation":500}'::jsonb
  when 'top-materiais' then '{"minMaxMaterialLikes":100,"minReputation":1000}'::jsonb
  when 'desafio-bncc' then '{"challengeSlug":"desafio-bncc","minReputation":300}'::jsonb
  else criteria
end
where criteria = '{}'::jsonb or criteria is null;

alter table public.community_group_members enable row level security;
alter table public.community_user_challenges enable row level security;

drop policy if exists "community_group_members_select_all" on public.community_group_members;
create policy "community_group_members_select_all"
on public.community_group_members for select using (true);

drop policy if exists "community_group_members_insert_own" on public.community_group_members;
create policy "community_group_members_insert_own"
on public.community_group_members for insert
with check (auth.uid() = user_id);

drop policy if exists "community_group_members_delete_own" on public.community_group_members;
create policy "community_group_members_delete_own"
on public.community_group_members for delete
using (auth.uid() = user_id);

drop policy if exists "community_user_challenges_select_own" on public.community_user_challenges;
create policy "community_user_challenges_select_own"
on public.community_user_challenges for select
using (auth.uid() = user_id);

drop policy if exists "community_user_challenges_insert_own" on public.community_user_challenges;
create policy "community_user_challenges_insert_own"
on public.community_user_challenges for insert
with check (auth.uid() = user_id);
