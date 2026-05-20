import { notFound } from 'next/navigation';
import { getImpactOwner, type OwnerType } from '@/server/strategies/impact-queries';
import { saveImpactLevel } from '@/server/strategies/impact-actions';

export const dynamic = 'force-dynamic';

type Params = Promise<{ type: string; id: string }>;

export default async function ImpactLevelPage({ params }: { params: Params }) {
  const { type, id } = await params;
  if (type !== 'impact' && type !== 'strategy') notFound();
  const ownerType = type as OwnerType;
  const owner = await getImpactOwner(ownerType, id);
  if (!owner) notFound();

  const level = owner.impactLevel;
  const saveAction = saveImpactLevel.bind(null, ownerType, id);

  return (
    <form action={saveAction}>
      <div className="o-card mb-3">
        <h2 className="c-subtitle-black-bold">Indicateur de suivi global</h2>
        <textarea
          name="indicateurSuivi"
          defaultValue={level?.indicateur_suivi ?? ''}
          rows={2}
          maxLength={500}
          className="c-input w-100"
        />
      </div>

      {[1, 2, 3].map((n) => (
        <div key={n} className="o-card mb-3">
          <h2 className="c-subtitle-black-bold">Niveau {n}</h2>
          <div className="mb-2">
            <label className="c-input__label" htmlFor={`description${n}`}>
              Description
            </label>
            <textarea
              id={`description${n}`}
              name={`description${n}`}
              defaultValue={(level as Record<string, string> | null)?.[`description${n}`] ?? ''}
              rows={2}
              maxLength={500}
              className="c-input w-100"
            />
          </div>
          <div className="mb-2">
            <label className="c-input__label" htmlFor={`finalite${n}`}>
              Finalité
            </label>
            <textarea
              id={`finalite${n}`}
              name={`finalite${n}`}
              defaultValue={(level as Record<string, string> | null)?.[`finalite${n}`] ?? ''}
              rows={2}
              maxLength={500}
              className="c-input w-100"
            />
          </div>
          {n < 3 && (
            <div className="mb-2">
              <label className="c-input__label" htmlFor={`seuil${n}`}>
                Seuil de passage au niveau {n + 1}
              </label>
              <input
                id={`seuil${n}`}
                name={`seuil${n}`}
                type="text"
                defaultValue={(level as Record<string, string> | null)?.[`seuil${n}`] ?? ''}
                maxLength={500}
                className="c-input w-100"
              />
            </div>
          )}
        </div>
      ))}

      <div className="d-flex justify-content-end">
        <button type="submit" className="c-btn--primary">
          Enregistrer
        </button>
      </div>
    </form>
  );
}
