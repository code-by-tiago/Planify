# Planify — 9.14.11 — Trimestre 3 + Editor oficial

## Correções

### 1. Terceiro trimestre do anual

O 3º trimestre agora preenche todas as linhas do modelo anual até:

```text
1 a 10
11 a 20
21 a 30
31 a 40
```

Se a IA devolver poucos conteúdos para o 3º trimestre, o motor completa as linhas com desdobramentos pedagógicos do próprio conteúdo, preservando o padrão anual.

### 2. Habilidades BNCC

Mantém:

```text
Código — descrição completa
```

### 3. Editor

O botão **Enviar ao Editor** agora envia um HTML editável com o mesmo padrão estrutural do planejamento oficial:

```text
Identificação
Tabelas por trimestre
Unidade temática
Objetos de conhecimento
Habilidades BNCC
Expectativas
Carga horária
Aula nº
Projetos / temas integradores
Instrumentos de avaliação
```

Também salva em várias chaves de compatibilidade do localStorage para evitar tela vazia no Editor.

### 4. Página Editor

A página `/editor` foi reforçada para ler o documento enviado, exibir conteúdo editável e permitir:

```text
Salvar edição
Baixar HTML editável
Imprimir
Formatar texto básico
```

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Teste

Na tela `/planejamentos`:

```text
1. Sugerir BNCC
2. Gerar planejamento com IA
3. Baixar DOCX oficial
4. Enviar ao Editor
```
