# Planify — 9.15.15 — Biblioteca usuário + Premium Gate

## Problemas corrigidos

```text
1. Material cadastrado no Admin não aparecia na Biblioteca do usuário.
2. A Biblioteca pública precisava ler exatamente a tabela de uploads do Admin.
3. Páginas premium não podiam ficar liberadas direto pelos cards da home.
4. Home deve ser vitrine/amostra, não acesso livre às ferramentas pagas.
```

## Biblioteca do usuário

A rota:

```text
/api/biblioteca/materiais
```

agora lê:

```text
public.library_materials
```

somente com:

```text
is_published = true
```

e gera link temporário do anexo no bucket:

```text
biblioteca-materiais
```

## Acesso Premium

Criado:

```text
/api/access/status
src/components/PremiumRouteGuard.tsx
```

Páginas protegidas:

```text
/dashboard
/planejamentos
/materiais
/editor
/historico
/biblioteca
/marketplace
```

Se não houver login premium:

```text
redireciona para /login?premium=required&redirect=...
```

## Home inicial

O script ajusta links premium diretos da home para irem ao login premium.

Assim os cards ficam como vitrine, mas não liberam a ferramenta.

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Teste correto

```text
1. Entre como Admin.
2. Cadastre material em /admin/biblioteca e deixe Publicar marcado.
3. Clique Sair Admin.
4. Entre como usuário com plano premium.
5. Abra /biblioteca.
6. O material deve aparecer.
```

## Observação importante

Se você abrir /biblioteca sem usuário premium, ela deve pedir login/plano. Isso é correto.

## O que não foi alterado

```text
DOCX oficial
Editor motor
Planejamentos
BNCC
Stripe
Sessão Admin por aba
Botão Sair Admin
Marketplace interno
Downloads anual/trimestral
```
