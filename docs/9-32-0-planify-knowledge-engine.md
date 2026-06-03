# Planify — Etapa 9.32.0

## Planify Knowledge Engine Pedagógico

Esta etapa eleva o Gerador de Materiais para uma arquitetura de conhecimento pedagógico curado.

### Objetivo

Transformar o gerador em um motor especialista que usa padrões educacionais seguros e reais como referência estrutural, sem copiar conteúdo protegido da web.

### O que foi feito

- Criado `material-knowledge-engine.ts` com fontes e critérios internos curados:
  - BNCC/MEC;
  - MEC RED/REA;
  - UNESCO/OER;
  - Creative Commons;
  - Design Universal para Aprendizagem;
  - Taxonomia de Bloom revisada.
- Criado `material-quality-auditor.ts` para reforçar:
  - quantidade exata de questões;
  - questão separada do título;
  - gabarito completo;
  - critérios de correção;
  - seções mínimas para apostila;
  - estrutura compatível com o tipo de material.
- O prompt principal passou a receber o bloco `PLANIFY KNOWLEDGE ENGINE`.
- O prompt de sugestões passou a orientar conteúdos com base em padrões educacionais abertos, estrutura original e curadoria.
- A tela de geração informa que está usando base pedagógica curada e auditoria de qualidade.

### Preservações

Esta etapa não altera:

- Planejamentos;
- DOCX oficial;
- BNCC de planejamentos;
- Stripe;
- Biblioteca;
- Marketplace;
- Admin;
- Editor;
- Autenticação.

### Regra ética e técnica

O Planify pode usar conhecimento educacional amplo como referência, mas não deve copiar apostilas, provas, atividades ou livros protegidos. A entrega deve ser original, rastreável em critérios e pronta para o professor.
