import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import { getImpactOwner, type OwnerType } from '@/server/strategies/impact-queries';

export const dynamic = 'force-dynamic';

type Params = Promise<{ type: string; id: string }>;

const TABS = [
  { key: 'impact-level', label: "Niveau d'impact" },
  { key: 'define-actions', label: 'Actions' },
  { key: 'review-actions', label: 'Évaluation' },
  { key: 'build-trajectories', label: 'Trajectoires' },
];

export default async function ImpactWorkLayout({
  params,
  children,
}: {
  params: Params;
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();
  const { type, id } = await params;

  if (type !== 'impact' && type !== 'strategy') notFound();
  const ownerType = type as OwnerType;

  const owner = await getImpactOwner(ownerType, id);
  if (!owner) notFound();
  if (!owner.studyId) notFound();

  const canEdit =
    isAdmin(user) || user.user_study.some((us) => us.study_id === owner.studyId);
  if (!canEdit) redirect('/workspace');

  return (
    <div className="container page">
      {/* Bandeau impact */}
      <div className="row">
        <div className="col-lg-12">
          <div className="o-card d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              {owner.thematicIcon && (
                <em
                  className={`c-icon project-primary medium ${owner.thematicIcon} mr-3`}
                  aria-hidden="true"
                />
              )}
              <div>
                <div className="c-subtitle-grey">{owner.impactThemeName ?? ''}</div>
                <h1 className="c-title-black-bold m-0">{owner.title}</h1>
              </div>
            </div>
            <Link href="/workspace/impacts" className="c-btn--tertiary">
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <ul className="nav nav-tabs mt-4">
        {TABS.map((t) => (
          <li key={t.key} className="nav-item">
            <Link
              href={`/workspace/impacts/${type}/${id}/${t.key}`}
              className="nav-link"
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4">{children}</div>
    </div>
  );
}
