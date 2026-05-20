# ACL

Cible Phase 3 : reproduire en TypeScript la logique d’ACL Symfony présente dans
`tacct-legacy/back/src/Security/AclTrait.php` et les méthodes `canRead`/`canCreate`
définies sur chaque entité.

## Pattern recommandé

```ts
// src/server/acl/study.ts
import type { Study, User } from '@/generated/prisma/client';

export function canReadStudy(user: User | null, study: Study): boolean { ... }
export function canCreateStudy(user: User | null): boolean { ... }
export function canUpdateStudy(user: User | null, study: Study): boolean { ... }
export function canDeleteStudy(user: User | null, study: Study): boolean { ... }
```

Chaque Route Handler / Server Action appelle l’ACL **avant** d’exposer ou de muter
la donnée. Un helper central `assertCan(...)` qui throw une 403 standard est utile.

## Entités à couvrir

Voir `tacct-legacy/back/src/Entity/` — toute entité qui `implements AclInterface`.
