# Padrões capturados na Teachy (sessão ao vivo)

## Formulário — Lista de Exercícios (`?aiTool=quiz-generator`)

- Campos: **Disciplina**, **Ano escolar**, **Assunto** (autocomplete BNCC rico)
- Fluxo pós-submit: escolher **Lista automática** vs Banco de questões
- Quantidade: botões **5 / 10 / 15 / 20**
- CTA: **Criar lista** (100 créditos)
- Subtítulo da ferramenta: *"Crie questões objetivas/dissertativas com gabarito e nível de dificuldade."*

## Documento gerado (padrão esperado Teachy)

- Cabeçalho compacto (disciplina, série, aluno, data)
- Questões em cards numerados — enunciado direto
- Sem blocos pedagógicos longos antes das questões
- Gabarito separado, respostas curtas
- Tipografia limpa, espaçamento generoso

## URLs de ferramentas Teachy (para benchmark manual)

| Planify | Teachy `aiTool` |
|---------|-----------------|
| lista | `quiz-generator` |
| prova | `assignment-generator` (verificar) |
| slides | `slides-generator` |
| plano-aula | `lesson-plan-generator` |
| sequencia | `learning-sequence` |
| resumo | `summary-generator` |
| aula-completa | `lessons` |

## Conta usada na sessão

- Teachy já logado (perfil existente no browser)
- Planify: `ts162351@gmail.com` para comparação local

## Aplicado no Planify (código)

- `src/lib/materiais/teachy-document-contract.ts` — contrato compartilhado
- Prompts + qualidade + layout + CSS editor alinhados ao contrato Teachy
