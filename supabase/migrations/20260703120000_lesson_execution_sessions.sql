create extension if not exists pgcrypto;

create table if not exists public.lesson_execution_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  title text not null,
  document_type text not null default 'material:plano-aula',
  source_html text not null default '',
  slides jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  active_slide_index integer not null default 0,
  active_question_id text,
  status text not null default 'ready' check (status in ('ready', 'live', 'paused', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '8 hours'),
  constraint lesson_execution_sessions_code_format
    check (code ~ '^[A-Z0-9]{5,8}$'),
  constraint lesson_execution_sessions_active_slide_nonnegative
    check (active_slide_index >= 0)
);

create table if not exists public.lesson_execution_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.lesson_execution_sessions(id) on delete cascade,
  device_token text not null,
  display_name text not null default 'Aluno',
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (session_id, device_token)
);

create table if not exists public.lesson_execution_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.lesson_execution_sessions(id) on delete cascade,
  participant_id uuid not null references public.lesson_execution_participants(id) on delete cascade,
  question_id text not null,
  answer text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, participant_id, question_id)
);

create index if not exists lesson_execution_sessions_teacher_created_idx
  on public.lesson_execution_sessions (teacher_id, created_at desc);

create index if not exists lesson_execution_sessions_code_idx
  on public.lesson_execution_sessions (code);

create index if not exists lesson_execution_participants_session_idx
  on public.lesson_execution_participants (session_id, last_seen_at desc);

create index if not exists lesson_execution_responses_session_question_idx
  on public.lesson_execution_responses (session_id, question_id, created_at desc);

create or replace function public.set_lesson_execution_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lesson_execution_sessions_updated_at
  on public.lesson_execution_sessions;
create trigger lesson_execution_sessions_updated_at
before update on public.lesson_execution_sessions
for each row execute function public.set_lesson_execution_updated_at();

drop trigger if exists lesson_execution_responses_updated_at
  on public.lesson_execution_responses;
create trigger lesson_execution_responses_updated_at
before update on public.lesson_execution_responses
for each row execute function public.set_lesson_execution_updated_at();

alter table public.lesson_execution_sessions enable row level security;
alter table public.lesson_execution_participants enable row level security;
alter table public.lesson_execution_responses enable row level security;

drop policy if exists "Teachers manage own lesson sessions"
  on public.lesson_execution_sessions;
create policy "Teachers manage own lesson sessions"
on public.lesson_execution_sessions
for all
using (auth.uid() = teacher_id)
with check (auth.uid() = teacher_id);

-- Public student access is intentionally mediated by Next.js API routes using
-- the service role. No direct anon policies are granted for participants or
-- responses, which keeps codes from becoming database credentials.
