-- Texto de apoio/leitura separado do enunciado da questão

alter table public.question_bank_items
  add column if not exists texto_apoio text;

comment on column public.question_bank_items.texto_apoio is
  'Texto de leitura ou apoio compartilhado entre questões do mesmo pacote — não repetido no enunciado.';
