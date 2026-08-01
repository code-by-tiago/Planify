-- Colunas de perfil usadas pela Comunidade (avatar e escola)
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists school_name text;

comment on column public.profiles.avatar_url is 'URL pública da foto de perfil (Comunidade)';
comment on column public.profiles.school_name is 'Nome da escola exibido no perfil público';
