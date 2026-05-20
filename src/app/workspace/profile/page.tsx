import { requireCurrentUser } from '@/server/auth/current-user';
import { userRoles } from '@/server/study/current-study';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await requireCurrentUser();
  const roles = userRoles(user);

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card">
            <h1 className="c-title-black-bold m-0">Mon profil</h1>
            <div className="c-subtitle-grey mt-1">
              Informations synchronisées avec ton compte ProConnect (à venir).
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-lg-12 col-md-16">
          <div className="o-card">
            <ReadOnlyField label="Prénom" value={user.firstname} />
            <ReadOnlyField label="Nom" value={user.lastname} />
            <ReadOnlyField label="Email" value={user.email} />
            <ReadOnlyField label="Username" value={user.username} />
            <ReadOnlyField
              label="Commune de rattachement"
              value={user.commune?.label ?? '—'}
            />
            <ReadOnlyField
              label="Bureau d'étude"
              value={user.study_office?.name ?? '—'}
            />
            <ReadOnlyField
              label="Rôles"
              value={roles.length > 0 ? roles.join(', ') : '—'}
            />
            <ReadOnlyField
              label="Compte validé"
              value={user.validated ? 'Oui' : 'Non'}
            />

            <p className="c-subtitle-grey mt-4">
              Pour modifier ton nom, ton email ou ta commune, contacte l&apos;équipe TACCT.
            </p>
            <a href="mailto:tacct@ademe.fr" className="c-btn--secondary">
              Contacter l&apos;équipe TACCT
            </a>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-lg-12 col-md-16">
          <div className="o-card">
            <h2 className="c-subtitle-black-bold">Études</h2>
            {user.user_study.length === 0 ? (
              <p className="text-muted">Aucune étude associée.</p>
            ) : (
              <ul className="mb-0 mt-2">
                {user.user_study.map((us) => (
                  <li key={us.id}>
                    <strong>{us.study?.territory_name ?? '—'}</strong> ({String(us.study?.year ?? '')})
                    {us.head_study && (
                      <span className="badge bg-success ms-2">Chargé d&apos;étude</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <div className="c-subtitle-grey">{label}</div>
      <div>
        <strong>{value || '—'}</strong>
      </div>
    </div>
  );
}
