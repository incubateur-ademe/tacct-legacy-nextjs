import { notFound } from 'next/navigation';
import {
  getActionsForOwner,
  getImpactOwner,
  parseIncompatibles,
  type OwnerType,
} from '@/server/strategies/impact-queries';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { DefineActions } from '@/components/strategies/DefineActions';
import type { CardActionData } from '@/components/strategies/CardAction';

export const dynamic = 'force-dynamic';

type Params = Promise<{ type: string; id: string }>;

export default async function DefineActionsPage({ params }: { params: Params }) {
  const { type, id } = await params;
  if (type !== 'impact' && type !== 'strategy') notFound();
  const ownerType = type as OwnerType;
  const owner = await getImpactOwner(ownerType, id);
  if (!owner) notFound();

  const actionsRaw = await getActionsForOwner(ownerType, id);
  const actions: CardActionData[] = actionsRaw.map((a) => ({
    id: a.id,
    intitule: a.intitule,
    typeApproche: a.type_approche,
    description: a.description,
    typeAction: a.type_action,
    finalite1: a.finalite1,
    finalite2: a.finalite2,
    finalite3: a.finalite3,
    anticipe1: a.anticipe1,
    anticipe2: a.anticipe2,
    incompatibles: parseIncompatibles(a.incompatibles),
  }));

  const lvl = owner.impactLevel;
  const finaliteLabels: [string, string, string] = [
    lvl?.finalite1 || 'Non renseigné',
    lvl?.finalite2 || 'Non renseigné',
    lvl?.finalite3 || 'Non renseigné',
  ];

  return (
    <ContentLayout helpKey="define-actions">
      <DefineActions
        type={ownerType}
        ownerId={id}
        title={owner.title}
        icon={owner.thematicIcon ?? 'suspended'}
        actions={actions}
        finaliteLabels={finaliteLabels}
      />
    </ContentLayout>
  );
}
