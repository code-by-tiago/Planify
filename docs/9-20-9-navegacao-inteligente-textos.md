# Planify — 9.20.9 — Navegação inteligente e textos profissionais

## Objetivo

Corrigir os pontos apontados após o refinamento visual:

```text
Campos de Planejamentos simples demais
Falta de opções roláveis compatíveis
Texto quebrado por encoding
Textos da Biblioteca falando "administrador"
Card único de Biblioteca + Marketplace
```

## O que esta etapa faz

```text
Adiciona PlanifyFieldEnhancer global
Mostra opções roláveis em campos compatíveis
Sugere Ano/Série conforme Etapa
Sugere Área conforme Etapa
Sugere Componente conforme Etapa + Área
Sugere Tipo e Trimestre quando aplicável
Corrige textos quebrados visualmente
Corrige textos de fonte em src/app quando possível
Separa Biblioteca Premium e Marketplace em cards distintos na Home
```

## Compatibilidade pedagógica

```text
Educação Infantil
- Campos de experiências
- Berçário, Maternal, Pré I, Pré II

Ensino Fundamental
- Linguagens, Matemática, Ciências da Natureza, Ciências Humanas, Ensino Religioso
- Componentes filtrados por área

Ensino Médio
- Linguagens e suas Tecnologias
- Matemática e suas Tecnologias
- Ciências da Natureza e suas Tecnologias
- Ciências Humanas e Sociais Aplicadas
- Componentes filtrados por área
```

## O que não muda

```text
DOCX oficial
Geração de planejamento
BNCC backend
IA
Stripe
Supabase
APIs
Banco de dados
Login
Assinaturas
Admin real
Biblioteca real
Marketplace real
Editor funcional
```

## Aplicar

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install-9-20-9-navegacao-inteligente-textos.ps1
```

Depois:

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Testar

```text
/planejamentos
- Clique em Etapa
- Clique em Ano/Série
- Clique em Área de conhecimento
- Clique em Componente curricular

/materiais
- Clique em Etapa
- Clique em Ano/Série
- Clique em Componente
- Clique em Tipo de material

/biblioteca
- Textos devem estar profissionais

/
- Biblioteca e Marketplace devem estar separados
```
