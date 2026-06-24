-- Áreas de atuação escolhidas pelo professor no perfil da Comunidade
alter table public.profiles
  add column if not exists teaching_areas text[] default '{}';

comment on column public.profiles.teaching_areas is
  'Disciplinas/componentes escolhidos pelo professor para exibição no perfil da Comunidade';
