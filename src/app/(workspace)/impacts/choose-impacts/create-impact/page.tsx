import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { getImpactThemesAndCatalog } from '@/server/strategies/queries';
import { createImpactStrategy } from '@/server/strategies/actions';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function CreateImpactStrategyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/gestion/studies-management');

  const { themes, catalog } = await getImpactThemesAndCatalog(study.id);

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12">
          <div className="o-card d-flex justify-content-between align-items-center">
            <h1 className="c-title-black-bold m-0">Créer un impact stratégie</h1>
            <Link href="/impacts/choose-impacts" className="c-btn--tertiary">
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      <form action={createImpactStrategy} className="mt-4">
        <input type="hidden" name="studyId" value={study.id} />

        <div className="o-card mb-3">
          <h2 className="c-subtitle-black-bold">Thématique</h2>
          <p className="c-subtitle-grey">
            Choisis une thématique existante de l&apos;étude, une du catalogue, ou crée une
            thématique personnalisée.
          </p>

          {themes.length > 0 && (
            <div className="mb-3">
              <strong>Thématiques de l&apos;étude</strong>
              {themes.map((t) => (
                <label
                  key={t.id}
                  className="d-flex align-items-center mt-1 p-2"
                  style={{ cursor: 'pointer', border: '1px solid #ddd', borderRadius: 4 }}
                >
                  <input type="radio" name="impactThemeId" value={t.id} className="mr-2" />
                  {t.thematic?.icon && (
                    <em
                      className={`c-icon project-primary medium ${t.thematic.icon} mr-2`}
                      aria-hidden="true"
                    />
                  )}
                  <span>{t.name}</span>
                </label>
              ))}
            </div>
          )}

          <div className="mb-3">
            <strong>Catalogue global</strong>
            <div className="row mt-1">
              {catalog.map((c) => (
                <div key={c.id} className="col-md-4 mb-2">
                  <label
                    className="d-flex align-items-center w-100 p-2"
                    style={{ cursor: 'pointer', border: '1px solid #ddd', borderRadius: 4 }}
                  >
                    <input
                      type="radio"
                      name="thematicId"
                      value={c.id}
                      className="mr-2"
                    />
                    <em
                      className={`c-icon project-primary medium ${c.icon} mr-2`}
                      aria-hidden="true"
                    />
                    <span>{c.name}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="c-input__label" htmlFor="customThematicName">
              Ou thématique personnalisée
            </label>
            <input
              id="customThematicName"
              name="customThematicName"
              type="text"
              maxLength={255}
              className="c-input w-100"
              placeholder="Ex. : Patrimoine bâti"
            />
            <label className="c-input__label mt-2" htmlFor="themeJustification">
              Justification (si nouvelle thématique)
            </label>
            <textarea
              id="themeJustification"
              name="themeJustification"
              rows={3}
              maxLength={2000}
              className="c-input w-100"
            />
          </div>
        </div>

        <div className="o-card mb-3">
          <label className="c-input__label" htmlFor="description">
            Description de l&apos;impact *
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            required
            className="c-input w-100"
          />
        </div>

        <div className="d-flex justify-content-between">
          <Link href="/impacts/choose-impacts" className="c-btn--tertiary">
            Annuler
          </Link>
          <button type="submit" className="c-btn--primary">
            Créer l&apos;impact
          </button>
        </div>
      </form>
    </div>
  );
}
