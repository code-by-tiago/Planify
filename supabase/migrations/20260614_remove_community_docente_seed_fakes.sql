-- Remove seed/demo community data with inflated counts and no real members.
-- Sync group member counts with actual membership rows.

delete from public.community_groups g
where not exists (
  select 1
  from public.community_group_members m
  where m.group_id = g.id
);

delete from public.community_events
where title in (
  'BNCC na prática: competências gerais',
  'Avaliação formativa com feedback eficaz',
  'IA para professores: ferramentas do dia a dia'
);

update public.community_groups g
set members_count = coalesce((
  select count(*)::int
  from public.community_group_members m
  where m.group_id = g.id
), 0);
