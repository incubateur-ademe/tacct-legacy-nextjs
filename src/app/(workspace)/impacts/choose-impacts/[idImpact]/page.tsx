import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import { getImpactStrategyById } from '@/server/strategies/queries';
import { updateImpactStrategy } from '@/server/strategies/actions';

export const dynamic = 'force-dynamic';

type Params = Promise<{ idImpact: string }>;

export default async function EditImpactStrategyPage({ params }: { params: Params }) {
  const user = await requireCurrentUser();
  const { idImpact } = await params;

  const strategy = await getImpactStrategyById(idImpact);
  if (!strategy?.impact_theme?.study_id) notFound();
  const studyId = strategy.impact_theme.study_id;
  const canEdit = isAdmin(user) || user.user_study.some((us) => us.study_id === studyId);
  if (!canEdit) redirect('/');

  const updateAction = updateImpactStrategy.bind(null, idImpact);

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12">
          <div className="o-card d-flex justify-content-between align-items-center">
            <div>
              <h1 className="c-title-black-bold m-0">Modifier l&apos;impact stratégie</h1>
              <div className="c-subtitle-grey mt-1">
                Thématique :{' '}
                {strategy.impact_theme.thematic?.icon && (
                  <em
                    className={`c-icon project-primary small ${strategy.impact_theme.thematic.icon} mr-1`}
                    aria-hidden="true"
                  />
                )}
                {strategy.impact_theme.name}
              </div>
            </div>
            <Link href="/impacts" className="c-btn--tertiary">
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      <form action={updateAction} className="mt-4">
        <div className="o-card mb-3">
          <label className="c-input__label" htmlFor="description">
            Description de l&apos;impact *
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            required
            defaultValue={strategy.description ?? ''}
            className="c-input w-100"
          />
        </div>

        <div className="d-flex justify-content-between">
          <Link href="/impacts" className="c-btn--tertiary">
            Annuler
          </Link>
          <button type="submit" className="c-btn--primary">
            Mettre à jour
          </button>
        </div>
      </form>
    </div>
  );
}
