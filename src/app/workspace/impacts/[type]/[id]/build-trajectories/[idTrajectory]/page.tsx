import { notFound } from 'next/navigation';
import {
  getActionsForOwner,
  getImpactOwner,
  getTrajectoryById,
  parseIncompatibles,
  type OwnerType,
} from '@/server/strategies/impact-queries';
import { updateTrajectory } from '@/server/strategies/impact-actions';
import { TrajectoryForm } from '@/components/strategies/TrajectoryForm';

export const dynamic = 'force-dynamic';

type Params = Promise<{ type: string; id: string; idTrajectory: string }>;

export default async function EditTrajectoryPage({ params }: { params: Params }) {
  const { type, id, idTrajectory } = await params;
  if (type !== 'impact' && type !== 'strategy') notFound();
  const ownerType = type as OwnerType;
  const owner = await getImpactOwner(ownerType, id);
  if (!owner) notFound();

  const trajectory = await getTrajectoryById(idTrajectory);
  if (!trajectory) notFound();

  const actions = await getActionsForOwner(ownerType, id);
  const actionsForForm = actions.map((a) => ({
    id: a.id,
    intitule: a.intitule,
    incompatibles: parseIncompatibles(a.incompatibles),
  }));
  const initialActionIds = trajectory.impact_trajectory_impact_action.map(
    (x) => x.action_id,
  );

  const submitAction = updateTrajectory.bind(null, ownerType, id, idTrajectory);

  return (
    <>
      <h2 className="c-subtitle-black-bold mb-3">Modifier la trajectoire</h2>
      <TrajectoryForm
        type={ownerType}
        ownerId={id}
        actions={actionsForForm}
        initial={{ name: trajectory.name, actionIds: initialActionIds }}
        action={submitAction}
      />
    </>
  );
}
