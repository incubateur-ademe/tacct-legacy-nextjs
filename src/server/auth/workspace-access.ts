import 'server-only';
import { cache } from 'react';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

const getSessionJti = cache(async () => {
  const session = await auth();
  return session?.user?.sessionJti ?? null;
});

// Le layout se re-rend à chaque navigation : sans ce garde-fou, une requête
// partirait à chaque page vue alors qu'une seule par session peut aboutir.
const MAX_SESSIONS_MEMORISEES = 5000;
const sessionsEnregistrees = new Set<string>();

export async function enregistrerAccesWorkspace(userId: string): Promise<void> {
  const jti = await getSessionJti();
  if (!jti || sessionsEnregistrees.has(jti)) return;

  if (sessionsEnregistrees.size >= MAX_SESSIONS_MEMORISEES) {
    sessionsEnregistrees.clear();
  }
  sessionsEnregistrees.add(jti);

  await prisma.user.updateMany({
    where: {
      id: userId,
      validated: true,
      // `<> jti` ne matche jamais NULL en SQL, d'où le OR explicite.
      OR: [
        { workspace_last_session_jti: null },
        { workspace_last_session_jti: { not: jti } },
      ],
    },
    data: {
      workspace_login_count: { increment: 1 },
      workspace_last_session_jti: jti,
      workspace_last_login_at: new Date(),
    },
  });
}
