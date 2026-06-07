-- Backfill discipline and BNCC codes for Língua Portuguesa / Redação materials missed by prior persist.

update public.generated_materials gm
set discipline = coalesce(
  nullif(trim(gm.discipline), ''),
  nullif(trim(gm.request_payload->>'componenteCurricular'), ''),
  nullif(trim(gm.request_payload->>'componente'), ''),
  nullif(trim(gm.request_payload->>'disciplina'), ''),
  nullif(trim(gm.request_payload->>'discipline'), '')
)
where discipline is null
   or trim(discipline) = '';

update public.generated_materials gm
set
  bncc_skill_codes = sub.codes,
  school_year = coalesce(gm.school_year, 2026)
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
            coalesce(request_payload->'habilidadesSelecionadas', '[]'::jsonb)
          ) elem
          where coalesce(elem->>'codigo', '') ~ '^(EF|EM|EI)'
          union
          select upper(trim(elem->>'codigo')) as code
          from jsonb_array_elements(
            coalesce(response_json->'metadata'->'bncc', '[]'::jsonb)
          ) elem
          where coalesce(elem->>'codigo', '') ~ '^(EF|EM|EI)'
          union
          select upper(trim(elem::text)) as code
          from jsonb_array_elements(
            coalesce(request_payload->'habilidadesBnccCodigos', '[]'::jsonb)
          ) elem
          where trim(both '"' from elem::text) ~ '^(EF|EM|EI)'
        ) codes
      ),
      '{}'::text[]
    ) as codes
  from public.generated_materials
) sub
where gm.id = sub.id
  and (gm.bncc_skill_codes is null or cardinality(gm.bncc_skill_codes) = 0)
  and cardinality(sub.codes) > 0;
