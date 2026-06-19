alter table public.profiles
  add column if not exists teaching_context jsonb;

comment on column public.profiles.teaching_context is
  'Contexto docente padrão: etapa, série, componente, turma (professor-first)';
