# Planify — 9.15.8 — Navegação correta + Login Admin contextual

## Correção de navegação

O botão Voltar não fica mais perdido no topo principal.

Agora as páginas internas têm uma faixa própria com:

```text
Voltar
Início
Painel
```

## Comportamento do Voltar

```text
Se houver histórico:
volta para a página anterior.

Se não houver histórico:
vai para /dashboard.
```

O botão Início sempre leva para `/`.

## Correção Admin

Clicar em Admin abre `/admin`.

Se não estiver logado:

```text
/admin
→ tela segura
→ Entrar como Admin
→ /login?mode=admin&redirect=/admin
```

## Login contextual

O login agora muda o texto conforme o modo:

```text
/login
→ login de professor

/login?mode=admin&redirect=/admin
→ login administrativo
```

A autenticação continua usando a mesma base segura. A diferença é o fluxo e a validação.

## Segurança

Sem login ou sem permissão:

```text
não mostra opções internas do Admin
```

## O que não foi alterado

```text
DOCX oficial
Editor
Planejamentos
BNCC
Stripe
Biblioteca
Marketplace
Downloads anual/trimestral
```

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Teste

```text
1. Clique Admin
2. Clique Entrar como Admin
3. Confirme que abriu login administrativo
4. Faça login com o e-mail admin
5. Confirme que /admin liberou o painel
6. Teste Voltar, Início e Painel nas páginas internas
```
