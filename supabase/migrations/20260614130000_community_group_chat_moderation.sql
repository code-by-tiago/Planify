-- Group chat moderation + realtime

alter table public.community_group_messages
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz;

create index if not exists community_group_messages_active_idx
  on public.community_group_messages (group_id, created_at desc)
  where deleted_at is null;

drop policy if exists "community_group_messages_update_moderation" on public.community_group_messages;
create policy "community_group_messages_update_moderation"
on public.community_group_messages
for update
using (
  deleted_at is null
  and exists (
    select 1
    from public.community_group_members m
    where m.group_id = community_group_messages.group_id
      and m.user_id = auth.uid()
  )
  and (
    auth.uid() = sender_id
    or exists (
      select 1
      from public.community_groups g
      where g.id = community_group_messages.group_id
        and g.owner_id = auth.uid()
    )
  )
)
with check (
  exists (
    select 1
    from public.community_group_members m
    where m.group_id = community_group_messages.group_id
      and m.user_id = auth.uid()
  )
);

do $$
begin
  alter publication supabase_realtime add table public.community_group_messages;
exception
  when duplicate_object then null;
end $$;
