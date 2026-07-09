-- Comunidade redesign:
--  * Remove Grupos e Eventos por completo (tabelas + dependências)
--  * Adicionar suporte a posts de "conquista" (badge) no feed

-- 1) Novos campos em community_posts para diferenciar tipos de publicação
alter table public.community_posts
  add column if not exists post_kind text not null default 'discussion',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  alter table public.community_posts
    add constraint community_posts_post_kind_check
    check (post_kind in ('discussion', 'achievement'));
exception
  when duplicate_object then null;
end $$;

-- 2) Remover vínculo de posts a grupos
alter table public.community_posts
  drop column if exists group_id;

-- 3) Remover realtime da tabela de mensagens de grupo (ignora se não estiver publicada)
do $$
begin
  alter publication supabase_realtime drop table public.community_group_messages;
exception
  when undefined_object then null;
  when undefined_table then null;
end $$;

-- 4) Drop das tabelas de grupos e eventos (cascade cobre policies, índices e FKs)
drop table if exists public.community_group_messages cascade;
drop table if exists public.community_group_members cascade;
drop table if exists public.community_event_participants cascade;
drop table if exists public.community_events cascade;
drop table if exists public.community_groups cascade;
