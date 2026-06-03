-- Seeds iniciais. Expanda pelo painel Admin futuramente.
insert into pedagogical_quality_gates (gate, severity) values
('Se pediu N questões, entregar exatamente N questões.', 'hard'),
('Gabarito não pode ser genérico ou repetido.', 'hard'),
('Questão não pode ter comando colado no título.', 'hard'),
('Atividade/lista/prova não pode vir como parágrafo corrido.', 'hard'),
('Apostila deve ter capítulos/unidades, exemplos, síntese e exercícios.', 'hard')
on conflict do nothing;
