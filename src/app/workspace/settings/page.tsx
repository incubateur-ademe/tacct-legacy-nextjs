import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import {
  updateStudyInfo,
  inviteCoUserToStudy,
  removeCoUserFromStudy,
} from '@/server/profile/actions';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/workspace/gestion/studies-management');

  // Vérifier que l'utilisateur est head study (sinon, lecture seule)
  const myUserStudy = study.user_study.find((us) => us.user_id === user.id);
  const isHead = myUserStudy?.head_study === true;

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card">
            <h1 className="c-title-black-bold m-0">Paramétrage de l&apos;étude</h1>
            <div className="c-subtitle-grey mt-1">
              {study.territory_name} ({String(study.year)})
            </div>
          </div>
        </div>
      </div>

      {/* ── Infos étude ── */}
      <div className="row mt-4">
        <div className="col-lg-12 col-md-16">
          <div className="o-card">
            <h2 className="c-subtitle-black-bold">Informations générales</h2>
            <form action={updateStudyInfo} className="mt-3">
              <input type="hidden" name="studyId" value={study.id} />
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="c-input__label" htmlFor="year">
                    Année *
                  </label>
                  <input
                    id="year"
                    name="year"
                    type="number"
                    min={1900}
                    max={2200}
                    required
                    defaultValue={Number(study.year)}
                    readOnly={!isHead}
                    className="c-input w-100"
                  />
                </div>
                <div className="col-md-8 mb-3">
                  <label className="c-input__label" htmlFor="territoryName">
                    Nom du territoire *
                  </label>
                  <input
                    id="territoryName"
                    name="territoryName"
                    type="text"
                    required
                    defaultValue={study.territory_name}
                    readOnly={!isHead}
                    maxLength={255}
                    className="c-input w-100"
                  />
                </div>
              </div>
              <div className="c-subtitle-grey mb-3">
                Commune : <strong>{study.commune?.label ?? '—'}</strong>{' '}
                (non modifiable depuis cette page)
              </div>
              {isHead && (
                <div className="d-flex justify-content-end">
                  <button type="submit" className="c-btn--primary">
                    Enregistrer
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ── Intervenants ── */}
      <div className="row mt-4">
        <div className="col-lg-12 col-md-16">
          <div className="o-card">
            <h2 className="c-subtitle-black-bold">Intervenants</h2>
            <ul className="mt-3">
              {study.user_study.map((us) => (
                <li key={us.id} className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <strong>
                      {us.user?.firstname} {us.user?.lastname.toUpperCase()}
                    </strong>
                    {us.user?.email && (
                      <span className="c-subtitle-grey ms-2">{us.user.email}</span>
                    )}
                    {us.head_study && (
                      <span className="badge bg-success ms-2">Chargé d&apos;étude</span>
                    )}
                  </div>
                  {isHead && !us.head_study && us.user_id !== user.id && (
                    <form
                      action={async () => {
                        'use server';
                        await removeCoUserFromStudy(us.id);
                      }}
                    >
                      <button type="submit" className="c-btn--tertiary">
                        Retirer
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Invitation co-utilisateur ── */}
      {isHead && (
        <div className="row mt-4">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <h2 className="c-subtitle-black-bold">Inviter un co-utilisateur</h2>
              <p className="c-subtitle-grey">
                Donne à un autre user (déjà inscrit) l&apos;accès à cette étude.
              </p>
              <form action={inviteCoUserToStudy} className="d-flex gap-2 align-items-end mt-2">
                <input type="hidden" name="studyId" value={study.id} />
                <div className="flex-grow-1">
                  <label className="c-input__label" htmlFor="email">
                    Email du co-utilisateur
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="c-input w-100"
                  />
                </div>
                <button type="submit" className="c-btn--primary">
                  Inviter
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {!isHead && (
        <div className="row mt-4">
          <div className="col-lg-12 col-md-16">
            <div className="c-subtitle-grey">
              Seul le chargé d&apos;étude peut modifier ces paramètres.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
