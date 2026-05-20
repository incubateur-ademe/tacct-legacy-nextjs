import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { getThematicsCatalog } from '@/server/sensibility/queries';
import { addImpactTheme } from '@/server/sensibility/actions';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function AddThematicPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/workspace/gestion/studies-management');

  const thematics = await getThematicsCatalog();

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card d-flex justify-content-between align-items-center">
            <h1 className="c-title-black-bold m-0">Ajouter une thématique</h1>
            <Link href="/workspace/sensibility" className="c-btn--tertiary">
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      <form action={addImpactTheme} className="mt-4">
        <input type="hidden" name="studyId" value={study.id} />

        <div className="o-card mb-3">
          <h2 className="c-subtitle-black-bold">Thématique</h2>
          <p className="c-subtitle-grey">
            Choisis une thématique du catalogue ou saisis un nom personnalisé.
          </p>

          <div className="row">
            {thematics.map((t) => (
              <div key={t.id} className="col-md-4 mb-2">
                <label className="c-radio__group d-flex align-items-center w-100 p-2" style={{ cursor: 'pointer', border: '1px solid #ddd', borderRadius: 4 }}>
                  <input type="radio" name="thematicId" value={t.id} className="mr-2" />
                  <em className={`c-icon project-primary medium ${t.icon} mr-2`} aria-hidden="true" />
                  <span>{t.name}</span>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <label className="c-input__label" htmlFor="customName">
              Nom personnalisé (laisser vide si choix du catalogue ci-dessus)
            </label>
            <input
              id="customName"
              name="customName"
              type="text"
              maxLength={255}
              className="c-input w-100"
              placeholder="Ex. : Agriculture locale"
            />
          </div>
        </div>

        <div className="o-card mb-3">
          <label className="c-input__label" htmlFor="justification">
            Justification *
          </label>
          <textarea
            id="justification"
            name="justification"
            rows={4}
            required
            className="c-input w-100"
            placeholder="Pourquoi cette thématique est-elle pertinente pour ton territoire ?"
          />
        </div>

        <div className="d-flex justify-content-between">
          <Link href="/workspace/sensibility" className="c-btn--tertiary">
            Annuler
          </Link>
          <button type="submit" className="c-btn--primary">
            Ajouter
          </button>
        </div>
      </form>
    </div>
  );
}
