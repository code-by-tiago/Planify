-- Conteúdos em alta: materiais destacados pelo admin (site, importados ou publicados).
alter table public.marketplace_materials
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_at timestamptz,
  add column if not exists featured_source text not null default 'community',
  add column if not exists external_url text;

create index if not exists marketplace_materials_featured_idx
  on public.marketplace_materials (is_featured, featured_at desc)
  where is_featured = true and is_published = true;
