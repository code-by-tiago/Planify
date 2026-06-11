-- Jobs de geração unificados (material, planejamento, pacote, inclusão).
-- Persistência para progresso real, recuperação e observabilidade.

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  surface text not null
    check (surface in ('material', 'planning', 'inclusao', 'bundle', 'correction')),
  tipo text not null default '',
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed')),
  stage text not null default 'queued',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  message text not null default '',
  pipeline text not null default '',
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists generation_jobs_user_created_idx
  on public.generation_jobs (user_id, created_at desc);

create index if not exists generation_jobs_status_idx
  on public.generation_jobs (status, created_at desc);

drop trigger if exists set_generation_jobs_updated_at on public.generation_jobs;
create trigger set_generation_jobs_updated_at
before update on public.generation_jobs
for each row execute function public.set_updated_at();

alter table public.generation_jobs enable row level security;

-- Leitura: dono do job ou admin
drop policy if exists "generation_jobs_select_owner" on public.generation_jobs;
create policy "generation_jobs_select_owner"
on public.generation_jobs
for select
to authenticated
using (public.is_admin() or user_id = auth.uid());

-- Escrita apenas via service role (API server)
