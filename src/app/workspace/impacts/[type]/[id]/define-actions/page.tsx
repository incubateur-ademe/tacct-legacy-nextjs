import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getActionsForOwner,
  getImpactOwner,
  parseIncompatibles,
  type OwnerType,
} from '@/server/strategies/impact-queries';
import {
  createImpactAction,
  deleteImpactAction,
} from '@/server/strategies/impact-actions';

export const dynamic = 'force-dynamic';

type Params = Promise<{ type: string; id: string }>;

export default async function DefineActionsPage({ params }: { params: Params }) {
  const { type, id } = await params;
  if (type !== 'impact' && type !== 'strategy') notFound();
  const ownerType = type as OwnerType;
  const owner = await getImpactOwner(ownerType, id);
  if (!owner) notFound();

  const actions = await getActionsForOwner(ownerType, id);
  const createAction = createImpactAction.bind(null, ownerType, id);

  return (
    <>
      <div className="o-card mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="c-subtitle-black-bold m-0">
            {actions.length} action{actions.length > 1 ? 's' : ''}
          </h2>
          <Link
            href={`/workspace/impacts/${type}/${id}/review-actions`}
            className="c-btn--secondary"
          >
            Aller à l&apos;évaluation →
          </Link>
        </div>
      </div>

      {actions.map((a) => {
        const incompatIds = parseIncompatibles(a.incompatibles);
        const incompatNames = actions
          .filter((x) => incompatIds.includes(x.id))
          .map((x) => x.intitule);
        return (
          <div key={a.id} className="o-card mb-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong>{a.intitule}</strong>
                <div className="c-subtitle-grey">
                  {a.type_approche && `${a.type_approche} • `}
                  {a.type_action}
                </div>
                {a.description && <p className="mt-2 mb-0">{a.description}</p>}
                <div className="mt-2 c-subtitle-grey">
                  Finalités :{' '}
                  {[a.finalite1 && '1', a.finalite2 && '2', a.finalite3 && '3']
                    .filter(Boolean)
                    .join(', ') || '—'}
                  {' • '}
                  Anticipation :{' '}
                  {[a.anticipe1 && '1', a.anticipe2 && '2']
                    .filter(Boolean)
                    .join(', ') || '—'}
                </div>
                {incompatNames.length > 0 && (
                  <div className="mt-1 c-subtitle-grey">
                    Incompatible avec : {incompatNames.join(', ')}
                  </div>
                )}
              </div>
              <form
                action={async () => {
                  'use server';
                  await deleteImpactAction(ownerType, id, a.id);
                }}
              >
                <button type="submit" className="c-btn--tertiary">
                  Supprimer
                </button>
              </form>
            </div>
          </div>
        );
      })}

      {/* Formulaire de création */}
      <div className="o-card">
        <h3 className="c-subtitle-black-bold">Ajouter une action</h3>
        <form action={createAction}>
          <div className="mb-2">
            <label className="c-input__label" htmlFor="intitule">
              Intitulé *
            </label>
            <input
              id="intitule"
              name="intitule"
              type="text"
              required
              maxLength={255}
              className="c-input w-100"
            />
          </div>
          <div className="row">
            <div className="col-md-6 mb-2">
              <label className="c-input__label" htmlFor="typeApproche">
                Type d&apos;approche
              </label>
              <input
                id="typeApproche"
                name="typeApproche"
                type="text"
                maxLength={255}
                className="c-input w-100"
              />
            </div>
            <div className="col-md-6 mb-2">
              <label className="c-input__label" htmlFor="typeAction">
                Type d&apos;action
              </label>
              <input
                id="typeAction"
                name="typeAction"
                type="text"
                maxLength={255}
                className="c-input w-100"
              />
            </div>
          </div>
          <div className="mb-2">
            <label className="c-input__label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              maxLength={255}
              className="c-input w-100"
            />
          </div>
          <div className="row">
            <div className="col-md-6 mb-2">
              <strong>Finalités</strong>
              {[1, 2, 3].map((n) => (
                <div key={n} className="c-checkbox__group">
                  <input
                    type="checkbox"
                    id={`finalite${n}`}
                    name={`finalite${n}`}
                    className="mr-2"
                  />
                  <label htmlFor={`finalite${n}`}>Finalité {n}</label>
                </div>
              ))}
            </div>
            <div className="col-md-6 mb-2">
              <strong>Anticipation</strong>
              {[1, 2].map((n) => (
                <div key={n} className="c-checkbox__group">
                  <input
                    type="checkbox"
                    id={`anticipe${n}`}
                    name={`anticipe${n}`}
                    className="mr-2"
                  />
                  <label htmlFor={`anticipe${n}`}>Anticipation {n}</label>
                </div>
              ))}
            </div>
          </div>
          {actions.length > 0 && (
            <div className="mb-2">
              <strong>Actions incompatibles</strong>
              <div className="c-subtitle-grey">
                Sélectionne les actions qui ne peuvent pas coexister avec celle-ci.
              </div>
              {actions.map((other) => (
                <div key={other.id} className="c-checkbox__group">
                  <input
                    type="checkbox"
                    id={`inc-${other.id}`}
                    name="incompatibles"
                    value={other.id}
                    className="mr-2"
                  />
                  <label htmlFor={`inc-${other.id}`}>{other.intitule}</label>
                </div>
              ))}
            </div>
          )}
          <div className="d-flex justify-content-end mt-3">
            <button type="submit" className="c-btn--primary">
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
