
-- Seed inicial: apenas badges da Comunidade Docente (sem grupos/eventos fictícios)

insert into public.community_badges (slug, name, description, icon, color, min_reputation)
select v.slug, v.name, v.description, v.icon, v.color, v.min_reputation
from (
  values
    ('colaborador', 'Colaborador', 'Publicou 5+ materiais na comunidade.', 'star', '#06B6D4', 100),
    ('mentor', 'Mentor', 'Ajudou colegas com comentários e respostas.', 'mentor', '#0F172A', 500),
    ('top-materiais', 'Top Materiais', 'Material com 100+ curtidas.', 'trophy', '#F59E0B', 1000),
    ('desafio-bncc', 'Desafio BNCC', 'Completou desafio pedagógico BNCC.', 'badge', '#8B5CF6', 300)
) as v(slug, name, description, icon, color, min_reputation)
where not exists (select 1 from public.community_badges limit 1);
