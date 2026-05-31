# Planify — 9.15.1 — Biblioteca Admin robusta

## Correções

### 1. Upload não anexou

A tela mostrou:

```text
Faça login para continuar.
```

Isso indica que a API não reconheceu o cookie/admin no momento do upload.

A correção faz:

```text
- fetch com credentials: include
- validação de admin mais flexível
- mensagens mais claras
- botão para login quando a sessão não for reconhecida
```

### 2. Campos limitados

O formulário agora tem lógica pedagógica:

```text
Etapa
Ano/Série
Área do conhecimento
Componente curricular
Tipo de material
Categoria compatível
Tema/conteúdo principal
Finalidade pedagógica
Nível de dificuldade
Duração sugerida
Habilidades BNCC
Observações
Tags
Anexo
```

### 3. Compatibilidade

Ao trocar a etapa, o sistema ajusta automaticamente:

```text
Educação Infantil -> campos de experiência
Ensino Fundamental -> anos e componentes adequados
Ensino Médio -> séries, áreas e componentes adequados
```

## SQL obrigatório

Rode no Supabase SQL Editor:

```text
C:\planify\database\09-15-1-biblioteca-premium-robusta.sql
```

Pode rodar mesmo se você já rodou a 9.15.

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Teste

```text
1. Faça login no Planify como admin.
2. Abra /admin/biblioteca.
3. Cadastre material com todos os campos principais.
4. Anexe um DOCX/PDF.
5. Clique em Cadastrar na Biblioteca.
6. Abra /biblioteca.
7. Confira se o material aparece e se o download abre.
```

## O que não foi alterado

```text
DOCX oficial
Editor validado
Planejamentos
BNCC
Stripe
Marketplace
```
