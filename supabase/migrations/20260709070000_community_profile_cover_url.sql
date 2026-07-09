-- Capa do perfil público da comunidade (banner editável).
alter table public.profiles
  add column if not exists cover_url text;
