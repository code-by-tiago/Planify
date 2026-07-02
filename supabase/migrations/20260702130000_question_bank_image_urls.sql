-- Banco de Questoes: imagens associadas a questoes extraidas de PDFs.

alter table public.question_bank_items
  add column if not exists image_urls text[] not null default '{}';

comment on column public.question_bank_items.image_urls is
  'URLs publicas ou caminhos relativos das imagens associadas ao enunciado da questao.';
