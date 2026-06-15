# TACCT (Next.js rewrite)

Réécriture from-scratch de l'outil **TACCT** (Symfony 5.4 + Angular 12, repo
`tacct-legacy`) en monolithe Next.js.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **TypeScript** strict
- **Prisma 7** + **Postgres** (dump déjà migré depuis MySQL)
- **NextAuth v5** (Auth.js) + **ProConnect** (OIDC) — pas de Keycloak
- **React-Bootstrap 1** + **Bootstrap 4** (pixel-perfect avec l’UI Angular existante)
- **TanStack Query** (remplace NgRx pour l’état serveur)
- **React Hook Form** + **Zod** (remplace ReactiveFormsModule)
- **Chart.js / react-chartjs-2**, **react-quill-new**, **react-select**
- **Vitest** pour les tests, **Prettier + ESLint** pour le formatage

## Structure

```text
src/
├── app/                  # App Router (routes + layouts)
│   └── api/              # Route Handlers
├── components/
│   ├── layout/           # Header, footer, navigation
│   └── ui/               # Composants réutilisables
├── hooks/                # React hooks custom (état UI, helpers)
├── lib/                  # Helpers isomorphes (env, utils, formatters)
├── server/               # Code server-only
│   ├── acl/              # Permissions par entité (cf. AclTrait Symfony)
│   ├── auth/             # Auth.js + provider ProConnect
│   ├── db/               # Singleton Prisma
│   └── services/         # Services métier (CRM Connect, Email, etc.)
└── types/                # Types globaux
```