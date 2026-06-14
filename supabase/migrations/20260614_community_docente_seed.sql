
-- Seed inicial: eventos, grupos e badges da Comunidade Docente
-- Executado apenas quando as tabelas estão vazias

insert into public.community_events (host_id, title, description, presenter_name, starts_at, is_online)
select
  (select id from auth.users order by created_at asc limit 1),
  v.title,
  v.description,
  v.presenter_name,
  v.starts_at,
  true
from (
  values
    (
      'BNCC na prática: competências gerais',
      'Webinar sobre aplicação das competências gerais da BNCC em sala de aula.',
      'Profª. Helena Ribeiro',
      (date_trunc('month', now()) + interval '23 days' + interval '19 hours')::timestamptz
    ),
    (
      'Avaliação formativa com feedback eficaz',
      'Estratégias práticas para avaliação formativa e devolutivas construtivas.',
      'Prof. Carlos Mendes',
      (date_trunc('month', now()) + interval '27 days' + interval '19 hours')::timestamptz
    ),
    (
      'IA para professores: ferramentas do dia a dia',
      'Como usar IA de forma pedagógica no planejamento e criação de materiais.',
      'Equipe Planify',
      (date_trunc('month', now()) + interval '1 month' + interval '4 days' + interval '19 hours')::timestamptz
    )
) as v(title, description, presenter_name, starts_at)
where exists (select 1 from auth.users limit 1)
  and not exists (select 1 from public.community_events limit 1);

insert into public.community_groups (owner_id, name, description, disciplina, members_count, is_public)
select
  (select id from auth.users order by created_at asc limit 1),
  v.name,
  v.description,
  v.disciplina,
  v.members_count,
  true
from (
  values
    ('Professores de Ciências', 'Grupo para troca de experiências e materiais de Ciências.', 'Ciências', 342),
    ('Matemática Ativa', 'Atividades lúdicas e sequências de Matemática.', 'Matemática', 518),
    ('Literatura e Leitura', 'Discussões sobre literatura, leitura e produção textual.', 'Língua Portuguesa', 276),
    ('História na Prática', 'Materiais e metodologias para Ensino de História.', 'História', 189)
) as v(name, description, disciplina, members_count)
where exists (select 1 from auth.users limit 1)
  and not exists (select 1 from public.community_groups limit 1);

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
