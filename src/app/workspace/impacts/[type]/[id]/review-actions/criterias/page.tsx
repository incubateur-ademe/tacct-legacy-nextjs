import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  DEFAULT_CRITERIA,
  getImpactOwner,
  getReviewCriteriaForOwner,
  type OwnerType,
} from '@/server/strategies/impact-queries';
import { saveReviewCriteria } from '@/server/strategies/impact-actions';

export const dynamic = 'force-dynamic';

type Params = Promise<{ type: string; id: string }>;

export default async function ActionsCriteriaPage({ params }: { params: Params }) {
  const { type, id } = await params;
  if (type !== 'impact' && type !== 'strategy') notFound();
  const ownerType = type as OwnerType;
  const owner = await getImpactOwner(ownerType, id);
  if (!owner) notFound();

  const saved = await getReviewCriteriaForOwner(ownerType, id);

  // 8 lignes : valeurs sauvegardées si présentes, sinon catalog par défaut.
  const rows = Array.from({ length: 8 }, (_, i) => {
    const rank = i + 1;
    const existing = saved.find((c) => c.rank === rank);
    const fallback = DEFAULT_CRITERIA.find((c) => c.rank === rank);
    return {
      rank,
      name: existing?.name ?? fallback?.name ?? '',
      weighting: existing?.weighting ?? 1,
    };
  });

  const saveAction = saveReviewCriteria.bind(null, ownerType, id);

  return (
    <>
      <div className="o-card mb-4 d-flex justify-content-between align-items-center">
        <h2 className="c-subtitle-black-bold m-0">Critères d&apos;évaluation</h2>
        <Link
          href={`/workspace/impacts/${type}/${id}/review-actions`}
          className="c-btn--tertiary"
        >
          ← Retour
        </Link>
      </div>

      <p className="c-subtitle-grey">
        Configure les 8 axes d&apos;évaluation. Mettre un poids à <strong>0</strong> ou laisser le nom
        vide désactive le critère.
      </p>

      <form action={saveAction}>
        <div className="o-card">
          <table className="table">
            <thead>
              <tr>
                <th scope="col" style={{ width: 60 }}>
                  #
                </th>
                <th scope="col">Nom du critère</th>
                <th scope="col" style={{ width: 140 }} className="text-center">
                  Pondération (0-3)
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rank}>
                  <th scope="row">{row.rank}</th>
                  <td>
                    <input
                      type="text"
                      name="criteriaName"
                      defaultValue={row.name}
                      maxLength={255}
                      className="c-input w-100"
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="number"
                      name="criteriaWeighting"
                      defaultValue={row.weighting}
                      min={0}
                      max={3}
                      className="c-input"
                      style={{ width: 60, textAlign: 'center' }}
                    />
                  </td>
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
    </>
  );
}
