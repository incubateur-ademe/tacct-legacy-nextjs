import { notFound, redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import { getImpactOwner, type OwnerType } from '@/server/strategies/impact-queries';

export const dynamic = 'force-dynamic';

type Params = Promise<{ type: string; id: string }>;

/**
 * Layout des pages de travail d'un impact (niveau / actions / évaluation /
 * trajectoires). La navigation entre ces étapes se fait via le menu de gauche
 * (IMPACT_STRATEGIE) ; chaque page porte son propre titre. Ici on ne fait que
 * les contrôles d'accès.
 */
export default async function ImpactWorkLayout({
  params,
  children,
}: {
  params: Params;
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();
  const { type, id } = await params;

  if (type !== 'impact' && type !== 'strategy') notFound();
  const ownerType = type as OwnerType;

  const owner = await getImpactOwner(ownerType, id);
  if (!owner) notFound();
  if (!owner.studyId) notFound();

  const canEdit =
    isAdmin(user) || user.user_study.some((us) => us.study_id === owner.studyId);
  if (!canEdit) redirect('/workspace');

  return <>{children}</>;
}
