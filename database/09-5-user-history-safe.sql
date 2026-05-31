create table if not exists public.user_history (
  id text primary key,
  user_id uuid null references auth.users(id) on delete cascade,
  title text not null,
  subtitle text null,
  source text not null default 'manual',
  type text not null default 'documento',
  status text not null default 'rascunho',
  content_preview text not null default '',
  content text not null default '',
  raw jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_history_user_id on public.user_history(user_id);
create index if not exists idx_user_history_updated_at on public.user_history(updated_at desc);
create index if not exists idx_user_history_source on public.user_history(source);
create index if not exists idx_user_history_type on public.user_history(type);

alter table public.user_history enable row level security;

drop policy if exists "Users can read own history" on public.user_history;
create policy "Users can read own history"
on public.user_history
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own history" on public.user_history;
create policy "Users can insert own history"
on public.user_history
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own history" on public.user_history;
create policy "Users can update own history"
on public.user_history
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own history" on public.user_history;
create policy "Users can delete own history"
on public.user_history
for delete
to authenticated
using (auth.uid() = user_id);
