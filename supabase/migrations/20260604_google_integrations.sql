-- Planify: tokens OAuth Google (servidor apenas — service role)

create table if not exists public.google_integrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_email text,
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists google_integrations_google_email_idx
  on public.google_integrations(google_email);

drop trigger if exists set_google_integrations_updated_at on public.google_integrations;
create trigger set_google_integrations_updated_at
before update on public.google_integrations
for each row
execute function public.set_updated_at();

alter table public.google_integrations enable row level security;

-- Nenhuma policy para usuários autenticados: apenas service role grava/lê.
