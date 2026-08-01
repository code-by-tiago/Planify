-- Optional teacher assignment per school class (gestor dashboard).

alter table public.school_classes
  add column if not exists teacher_user_id uuid references auth.users (id) on delete set null;

create index if not exists school_classes_teacher_user_id_idx
  on public.school_classes (teacher_user_id)
  where teacher_user_id is not null;

comment on column public.school_classes.teacher_user_id is
  'Professor responsável pela turma. Quando nulo, o painel infere pelo docente com mais materiais na turma.';
