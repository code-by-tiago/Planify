alter table public.profiles
  add column if not exists correction_profile jsonb;

comment on column public.profiles.correction_profile is
  'Perfil de devolutiva IA: tom, rigor, foco, exemplosFeedback';
