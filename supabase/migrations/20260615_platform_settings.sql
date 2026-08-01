-- Planify — Configurações globais da plataforma (kill switch, modelo IA padrão).
-- Escrita apenas via service role (API admin). Sem policies para anon/authenticated.

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value)
values
  ('registrations_enabled', 'true'::jsonb),
  ('default_ai_model', '"gemini-2.5-flash"'::jsonb)
on conflict (key) do nothing;

alter table public.platform_settings enable row level security;

-- Sem policies: leitura/escrita exclusiva via service_role no backend.
