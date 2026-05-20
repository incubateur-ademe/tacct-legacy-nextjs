import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getImpactOwner,
  getTrajectoriesForOwner,
  type OwnerType,
} from '@/server/strategies/impact-queries';
import { deleteTrajectory } from '@/server/strategies/impact-actions';

export const dynamic = 'force-dynamic';

type Params = Promise<{ type: string; id: string }>;

export default async function BuildTrajectoriesPage({ params }: { params: Params }) {
  const { type, id } = await params;
  if (type !== 'impact' && type !== 'strategy') notFound();
  const ownerType = type as OwnerType;
  const owner = await getImpactOwner(ownerType, id);
  if (!owner) notFound();

  const trajectories = await getTrajectoriesForOwner(ownerType, id);

  return (
    <>
      <div className="o-card mb-4 d-flex justify-content-between align-items-center">
        <h2 className="c-subtitle-black-bold m-0">
          Trajectoires ({trajectories.length})
        </h2>
        <Link
          href={`/workspace/impacts/${type}/${id}/build-trajectories/create-trajectory`}
          className="c-btn--primary"
        >
          + Ajouter une trajectoire
        </Link>
      </div>

      {trajectories.length === 0 && (
        <div className="o-card text-center py-5">
          Aucune trajectoire. Crées-en une à partir des actions définies.
        </div>
      )}

      {trajectories.map((t) => (
        <div key={t.id} className="o-card mb-3">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <strong>{t.name}</strong>
              <div className="c-subtitle-grey">
                {t.impact_trajectory_impact_action.length} action
                {t.impact_trajectory_impact_action.length > 1 ? 's' : ''}
              </div>
              {t.impact_trajectory_impact_action.length > 0 && (
                <ul className="mt-2 mb-0">
                  {t.impact_trajectory_impact_action.map((a) => (
                    <li key={a.id}>{a.impact_action.intitule}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="d-flex gap-2">
              <Link
                href={`/workspace/impacts/${type}/${id}/build-trajectories/${t.id}`}
                className="c-btn--secondary"
              >
                Modifier
              </Link>
              <form
                action={async () => {
                  'use server';
                  await deleteTrajectory(ownerType, id, t.id);
                }}
              >
                <button type="submit" className="c-btn--tertiary">
                  Supprimer
                </button>
              </form>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
