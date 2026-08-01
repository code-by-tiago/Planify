# Planify — Auditoria anti-vazamento 9.21.0

Data: 31/05/2026, 11:57:16

[OK] Seguro para preparar GitHub.


## Git ignore and env protection
[OK] .gitignore contains: .env
[OK] .gitignore contains: .env.*
[OK] .gitignore contains: !.env.example
[OK] .gitignore contains: node_modules/
[OK] .gitignore contains: .next/
[OK] .gitignore contains: .vercel/
[OK] .env.example exists.
[OK] .env.local exists locally.
[OK] .env.local is ignored by Git.

## Secret scan
[OK] No hardcoded secrets found in scanned files.

## Public keys allowed check
[OK] Public Stripe key references are present through NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.

## Result
