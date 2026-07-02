-- Bucket publico para imagens extraidas de PDFs de provas.
-- Uploads sao feitos pelo backend com service role; leitura usa URL publica.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-extract-assets',
  'question-extract-assets',
  true,
  10485760,
  array['image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
