# Correção — Login premium preso na tela

## Problema

O login validava o usuário premium/admin, mas a navegação ficava presa na tela de login.

## Correção

A tela agora usa navegação forçada com:

```ts
window.location.assign(destination)
```

Isso força o navegador a recarregar a próxima página já com o cookie premium gravado.

## Arquivo alterado

```text
src/app/login/LoginClient.tsx
```

## Teste

```text
1. Acesse /sair
2. Acesse /login
3. Entre com o usuário admin
4. Deve ir para /dashboard
```
