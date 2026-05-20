import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  DEFAULT_CRITERIA,
  getActionsForOwner,
  getImpactOwner,
  getReviewCriteriaForOwner,
  type OwnerType,
} from '@/server/strategies/impact-queries';
import { saveActionReviews } from '@/server/strategies/impact-actions';

export const dynamic = 'force-dynamic';

type Params = Promise<{ type: string; id: string }>;

export default async function ReviewActionsPage({ params }: { params: Params }) {
  const { type, id } = await params;
  if (type !== 'impact' && type !== 'strategy') notFound();
  const ownerType = type as OwnerType;
  const owner = await getImpactOwner(ownerType, id);
  if (!owner) notFound();

  const [actions, criteria] = await Promise.all([
    getActionsForOwner(ownerType, id),
    getReviewCriteriaForOwner(ownerType, id),
  ]);

  // Si l'impact n'a pas encore de critères saisis, on affiche les 8 par défaut
  // avec weighting=1, mais non sauvegardés (l'utilisateur peut les configurer
  // dans /review-actions/criterias).
  const effectiveCriteria =
    criteria.length === 8
      ? criteria
      : DEFAULT_CRITERIA.map((d) => ({
          id: `default-${d.rank}`,
          name: d.name,
          weighting: 1,
          rank: d.rank,
        }));

  const saveAction = saveActionReviews.bind(null, ownerType, id);

  return (
    <>
      <div className="o-card mb-4 d-flex justify-content-between align-items-center">
        <h2 className="c-subtitle-black-bold m-0">Évaluer les actions</h2>
        <Link
          href={`/workspace/impacts/${type}/${id}/review-actions/criterias`}
          className="c-btn--secondary"
        >
          Configurer les critères
        </Link>
      </div>

      {actions.length === 0 && (
        <div className="o-card text-center py-5">
          Aucune action à évaluer. Commence par en définir.
        </div>
      )}

      {actions.length > 0 && (
        <form action={saveAction}>
          <div className="o-card" style={{ overflowX: 'auto' }}>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th scope="col" style={{ minWidth: 200 }}>
                    Action
                  </th>
                  {effectiveCriteria.map((c) => (
                    <th key={c.rank} scope="col" className="text-center">
                      {c.name}
                      <div className="c-subtitle-grey">
                        (poids {c.weighting})
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id}>
                    <th scope="row" className="align-middle">
                      {a.intitule}
                    </th>
                    {effectiveCriteria.map((c) => {
                      const existing = a.impact_action_review.find(
                        (r) => r.rank === c.rank,
                      );
                      const disabled = c.weighting === 0;
                      return (
                        <td key={c.rank} className="text-center">
                          <input
                            type="number"
                            name={`review[${a.id}][${c.rank}]`}
                            min={0}
                            max={3}
                            defaultValue={disabled ? 0 : (existing?.value ?? 0)}
                            disabled={disabled}
                            className="c-input"
                            style={{ width: 60, textAlign: 'center' }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <button type="submit" className="c-btn--primary">
              Enregistrer
            </button>
          </div>
        </form>
      )}
    </>
  );
}
