-- Planify — school year on generated_materials + backfill BNCC codes from legacy JSON.

alter table public.generated_materials
  add column if not exists school_year integer not null default 2026;

create index if not exists generated_materials_user_school_year_idx
  on public.generated_materials (user_id, school_year, created_at desc);

update public.generated_materials
set school_year = 2026
where school_year is null;

-- Backfill BNCC codes and discipline from credit-tracking JSON when persist missed them.
update public.generated_materials gm
set
  bncc_skill_codes = sub.codes,
  discipline = coalesce(nullif(trim(gm.discipline), ''), sub.discipline),
  school_year = 2026
from (
  select
    id,
    coalesce(
      (
        select array_agg(distinct code order by code)
        from (
          select upper(trim(elem->>'codigo')) as code
          from jsonb_array_elements(
            coalesce(request_payload->'habilidadesBncc', '[]'::jsonb)
          ) elem
          where coalesce(elem->>'codigo', '') ~ '^(EF|EM|EI)'
          union
          select upper(trim(elem->>'codigo')) as code
          from jsonb_array_elements(
            coalesce(response_json->'metadata'->'bncc', '[]'::jsonb)
          ) elem
          where coalesce(elem->>'codigo', '') ~ '^(EF|EM|EI)'
        ) codes
      ),
      '{}'::text[]
    ) as codes,
    nullif(trim(request_payload->>'componenteCurricular'), '') as discipline
  from public.generated_materials
) sub
where gm.id = sub.id
  and (gm.bncc_skill_codes is null or cardinality(gm.bncc_skill_codes) = 0)
  and cardinality(sub.codes) > 0;
