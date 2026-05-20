import { notFound } from 'next/navigation';
import {
  getActionsForOwner,
  getImpactOwner,
  parseIncompatibles,
  type OwnerType,
} from '@/server/strategies/impact-queries';
import { createTrajectory } from '@/server/strategies/impact-actions';
import { TrajectoryForm } from '@/components/strategies/TrajectoryForm';

export const dynamic = 'force-dynamic';

type Params = Promise<{ type: string; id: string }>;

export default async function CreateTrajectoryPage({ params }: { params: Params }) {
  const { type, id } = await params;
  if (type !== 'impact' && type !== 'strategy') notFound();
  const ownerType = type as OwnerType;
  const owner = await getImpactOwner(ownerType, id);
  if (!owner) notFound();

  const actions = await getActionsForOwner(ownerType, id);
  const actionsForForm = actions.map((a) => ({
    id: a.id,
    intitule: a.intitule,
    incompatibles: parseIncompatibles(a.incompatibles),
  }));

  const submitAction = createTrajectory.bind(null, ownerType, id);

  return (
    <>
      <h2 className="c-subtitle-black-bold mb-3">Créer une trajectoire</h2>
      <TrajectoryForm
        type={ownerType}
        ownerId={id}
        actions={actionsForForm}
        action={submitAction}
      />
    </>
  );
}
