# Proteção de rotas (Next.js 16)

O Planify usa **`src/proxy.ts`** como camada oficial de proteção server-side (equivalente ao middleware clássico).

- Não crie `middleware.ts` na raiz — o build do Next.js 16 registra `proxy.ts` como `ƒ Proxy (Middleware)`.
- Rotas autenticadas e premium passam pelo proxy antes do render.
- O cookie `planify_access` e o grace period são avaliados no proxy.

Validação local: `npm run verify:go-live` (checa presença de `export async function proxy`).

Documentos antigos que citam `middleware.ts` referem-se a versões anteriores do projeto.
