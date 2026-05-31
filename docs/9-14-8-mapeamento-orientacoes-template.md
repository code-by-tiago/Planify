# Planify — 9.14.8 — Mapeamento por orientações do template

## Objetivo

Preencher os modelos oficiais conforme as próprias orientações/cabeçalhos existentes no DOCX.

## Regra aplicada

```text
Não recriar documento.
Não criar layout novo.
Não trocar seções.
Não mudar margens.
Não substituir o corpo inteiro.
Preencher somente células existentes.
```

## Como preenche

### Modelo anual

Detecta tabelas que contêm:

```text
Unidade Temática
Objetos de Conhecimento
Habilidades
Expectativas de aprendizagem
Previsão de carga horária
Aula nº
```

E distribui conteúdos por trimestre.

Cada linha recebe:

```text
Unidade Temática -> gerada por componente + conteúdo
Objetos de Conhecimento -> conteúdo informado
Habilidades -> códigos BNCC selecionados
Expectativas de aprendizagem -> objetivo/expectativa gerada pela IA
Previsão de carga horária -> períodos do conteúdo
Aula nº -> intervalo de aulas
```

Também preenche, quando existirem:

```text
Projetos interdisciplinares
Temas integradores
Instrumentos de avaliação
Observações
```

### Modelo trimestral

Detecta a tabela oficial do próprio modelo e preenche conforme os rótulos/orientações existentes:

```text
Objetos de Conhecimento
Habilidades BNCC
Objetivos / expectativas
Metodologia / etapas
Recursos
Evidências / avaliação
Projetos interdisciplinares
Temas integradores
```

## Diagnóstico gerado

```text
C:\planify\tmp\orientacoes-docx-detectadas.md
```

Se ainda sobrar campo sem preencher, envie esse arquivo para ajustar o mapeamento com precisão absoluta.

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```
