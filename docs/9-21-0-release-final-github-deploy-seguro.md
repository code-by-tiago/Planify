# Planify — 9.21.0 — Release final, GitHub seguro e deploy

## Objetivo

Preparar o Planify para repositório, deploy e continuidade segura, sem quebrar as funcionalidades já validadas.

## O que esta etapa faz

```text
Cria/atualiza .gitignore
Cria .env.example sem chaves reais
Cria auditoria anti-vazamento
Cria auditoria de release final
Cria auditoria de prontidao Google Drive/Classroom
Cria checklist de deploy
Cria script de commit local seguro
```

## O que nao muda

```text
DOCX oficial
Planejamentos
BNCC
Editor funcional
Biblioteca real
Marketplace real
Admin
Stripe
Supabase
APIs
Banco
Login
Assinaturas
Premium Gate
```

## Aplicar

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install-9-21-0-release-final-github-deploy-seguro.ps1
```

Depois confirmar:

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

## Criar commit local seguro

Apenas depois de auditoria e build passarem:

```powershell
cd C:\planify
powershell -ExecutionPolicy Bypass -File scripts\planify\final\criar-commit-local-seguro-9-21-0.ps1
```

## Enviar para GitHub

Crie um repositorio privado no GitHub e depois rode:

```powershell
cd C:\planify
git remote add origin URL_DO_SEU_REPOSITORIO
git branch -M main
git push -u origin main
```

## Deploy

Use o checklist:

```text
docs/deploy/DEPLOY-CHECKLIST.md
```

Configure as variaveis do `.env.example` no painel do provedor de deploy.

## Google Drive/Classroom

Esta etapa nao implementa a integracao real para evitar risco de regressao. Ela prepara o ambiente, o `.env.example` e a auditoria de prontidao.

A ordem segura para a proxima etapa e:

```text
1. OAuth Google start/callback
2. Exportar DOCX ja gerado para Google Drive
3. Depois enviar/compartilhar via Google Classroom
4. Manter download DOCX como fallback
```
