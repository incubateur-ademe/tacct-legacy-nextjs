import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  DEFAULT_CRITERIA,
  getImpactOwner,
  getReviewCriteriaForOwner,
  type OwnerType,
} from '@/server/strategies/impact-queries';
import { saveReviewCriteria } from '@/server/strategies/impact-actions';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';

export const dynamic = 'force-dynamic';

type Params = Promise<{ type: string; id: string }>;

export default async function ActionsCriteriaPage({ params }: { params: Params }) {
  const { type, id } = await params;
  if (type !== 'impact' && type !== 'strategy') notFound();
  const ownerType = type as OwnerType;
  const owner = await getImpactOwner(ownerType, id);
  if (!owner) notFound();

  const saved = await getReviewCriteriaForOwner(ownerType, id);
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
    <ContentLayout helpKey="review-actions">
      <div className="sc-actions-criteria">
        <div className="o-card u-margin__bottom--m">
          <div className="row">
            <BlockTitleIcon
              pageTitle="Modifier les critères d'évaluation"
              subtitle={owner.title}
              icon={owner.thematicIcon ?? 'suspended'}
            />
            <div className="sc-actions-criteria__info">
              <img src="/assets/img/info.svg" alt="" width={20} height={20} />
              <span>Pour supprimer un critère, mettez sa pondération à 0.</span>
            </div>
          </div>

          <form action={saveAction}>
            {rows.map((row) => (
              <div className="row" key={row.rank}>
                <div className="c-input__group w-75">
                  <input
                    className="c-input__large"
                    type="text"
                    id={`name${row.rank}`}
                    name="criteriaName"
                    maxLength={30}
                    defaultValue={row.name}
                  />
                  <label className="c-input__label" htmlFor={`name${row.rank}`}>
                    Intitulé
                  </label>
                </div>
                <div className="c-input__group w-25">
                  <input
                    className="c-input__large w-100"
                    type="number"
                    id={`weighting${row.rank}`}
                    name="criteriaWeighting"
                    min={0}
                    max={3}
                    defaultValue={row.weighting}
                  />
                  <label className="c-input__label" htmlFor={`weighting${row.rank}`}>
                    Pondération
                  </label>
                </div>
              </div>
            ))}

            <div className="c-group-buttons c-group-buttons--end">
              <Link
                href={`/impacts/${type}/${id}/review-actions`}
                className="c-btn--tertiary"
              >
                Annuler
              </Link>
              <button className="c-btn--primary" type="submit">
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </ContentLayout>
  );
}
