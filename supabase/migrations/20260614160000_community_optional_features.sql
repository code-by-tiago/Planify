-- Opcionais: arquivos no chat, moderação de denúncias, realtime em comentários

alter table public.community_group_messages
  add column if not exists file_name text,
  add column if not exists file_mime text,
  add column if not exists file_path text,
  add column if not exists file_size bigint;

alter table public.community_group_messages
  drop constraint if exists community_group_messages_body_check;

alter table public.community_group_messages
  add constraint community_group_messages_body_check
  check (
    char_length(body) <= 4000
    and (
      char_length(trim(body)) >= 1
      or file_path is not null
    )
  );

do $$
begin
  create type public.community_report_status as enum ('open', 'resolved', 'dismissed');
exception
  when duplicate_object then null;
end $$;

alter table public.community_reports
  add column if not exists status public.community_report_status not null default 'open',
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by uuid references auth.users(id) on delete set null,
  add column if not exists admin_note text;

create index if not exists community_reports_status_idx
  on public.community_reports (status, created_at desc);

do $$
begin
  alter publication supabase_realtime add table public.community_comments;
exception
  when duplicate_object then null;
end $$;
