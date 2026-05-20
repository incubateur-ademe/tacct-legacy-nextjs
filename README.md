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

## Démarrer

```bash
pnpm install
cp .env.example .env
# remplir DATABASE_URL et générer AUTH_SECRET :
#   openssl rand -base64 32
pnpm db:pull       # introspection de la base Postgres → schema.prisma  (Phase 1)
pnpm db:generate   # génère le client Prisma                            (Phase 1)
pnpm dev
```

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

## État d'avancement

- [x] **Phase 0** — Bootstrap (Next.js, Prisma, deps, env, structure)
- [ ] **Phase 1** — Modèle de données (`db pull` + nettoyage schema)
- [ ] **Phase 2** — Auth ProConnect
- [ ] **Phase 3** — Couche API + ACL
- [ ] **Phase 4** — UI publique
- [ ] **Phase 5** — UI workspace
- [ ] **Phase 6** — UI project-sheets
- [ ] **Phase 7** — Services annexes (email, jobs, CRM…)
- [ ] **Phase 8** — Tests & déploiement

## Commandes utiles

| Commande              | Effet                                        |
| --------------------- | -------------------------------------------- |
| `pnpm dev`            | Lance le serveur Next.js en dev              |
| `pnpm build`          | Build production                             |
| `pnpm lint`           | Lint ESLint                                  |
| `pnpm format`         | Formate avec Prettier                        |
| `pnpm test`           | Vitest run                                   |
| `pnpm test:watch`     | Vitest watch                                 |
| `pnpm db:pull`        | Introspection de la base → `schema.prisma`   |
| `pnpm db:generate`    | Génère le client Prisma                      |
| `pnpm db:migrate`     | Crée et applique une migration               |
| `pnpm db:studio`      | Ouvre Prisma Studio (GUI base)               |
