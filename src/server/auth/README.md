# Auth (ProConnect)

Cible Phase 2 : NextAuth v5 (Auth.js) avec un **custom OIDC provider** pour ProConnect.

## TODO

- [ ] Créer `src/server/auth/proconnect.ts` : provider OIDC custom (issuer, scopes `openid email given_name usual_name siret`, `acr_values eidas1`, signature/encryption JWT).
- [ ] Créer `src/server/auth/index.ts` : `export { auth, handlers, signIn, signOut } = NextAuth({...})`.
- [ ] Créer `src/app/api/auth/[...nextauth]/route.ts` qui réexporte `handlers`.
- [ ] Implémenter le `signIn` callback : retrouver/créer l’utilisateur Prisma à partir du `sub` ProConnect.
- [ ] Middleware `src/middleware.ts` pour protéger `/workspace/*` et `/project-sheets/*`.

## Doc ProConnect

- https://partenaires.proconnect.gouv.fr/
- Issuer integ : `https://fca.integ01.dev-agentconnect.fr/api/v2`
- Issuer prod  : `https://auth.agentconnect.gouv.fr/api/v2`

## Notes

- ProConnect impose le `nonce`, le `state`, et exige souvent un JWT signé pour l’échange de token.
- Le claim utile côté métier est `sub` (équivalent du `authenticatedId` actuel en base).
- Pas de migration des comptes Keycloak existants : un user qui se connecte avec ProConnect crée un nouveau compte ou est rapproché par email si une politique de matching est définie.
