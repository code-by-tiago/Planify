-- Campos de perfil público na Comunidade Planify
alter table public.profiles
  add column if not exists bio text,
  add column if not exists community_public boolean not null default true;

comment on column public.profiles.bio is 'Biografia curta exibida no perfil da Comunidade';
comment on column public.profiles.community_public is 'Se o perfil aparece publicamente na Comunidade';
