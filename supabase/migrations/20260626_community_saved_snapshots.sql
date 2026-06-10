-- Saved community materials: independent snapshot copies survive owner deletion

alter table public.marketplace_materials
  add column if not exists is_saved_snapshot boolean not null default false,
  add column if not exists source_material_id uuid references public.marketplace_materials(id) on delete set null;

create index if not exists marketplace_materials_saved_snapshot_idx
  on public.marketplace_materials (is_saved_snapshot)
  where is_saved_snapshot = true;

create index if not exists marketplace_materials_source_material_idx
  on public.marketplace_materials (source_material_id)
  where source_material_id is not null;

alter table public.community_saved_materials
  add column if not exists source_material_id uuid references public.marketplace_materials(id) on delete set null;

update public.community_saved_materials
set source_material_id = material_id
where source_material_id is null;

create index if not exists community_saved_materials_source_idx
  on public.community_saved_materials (user_id, source_material_id)
  where source_material_id is not null;
