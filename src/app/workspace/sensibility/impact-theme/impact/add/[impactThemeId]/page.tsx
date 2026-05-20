import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import {
  getExposuresForStudy,
  getImpactThemeById,
} from '@/server/sensibility/queries';
import { addImpact } from '@/server/sensibility/actions';
import { ImpactFormFields } from '@/components/sensibility/ImpactFormFields';

export const dynamic = 'force-dynamic';

type Params = Promise<{ impactThemeId: string }>;

export default async function AddImpactPage({ params }: { params: Params }) {
  const user = await requireCurrentUser();
  const { impactThemeId } = await params;

  const theme = await getImpactThemeById(impactThemeId);
  if (!theme?.study_id) notFound();
  const canEdit = isAdmin(user) || user.user_study.some((us) => us.study_id === theme.study_id);
  if (!canEdit) redirect('/workspace');

  const exposures = await getExposuresForStudy(theme.study_id);
  const exposureOptions = exposures.map((e) => ({
    id: e.id,
    label: e.climate_hazard_custom ?? e.climate_hazard?.name ?? '—',
  }));

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card d-flex justify-content-between align-items-center">
            <div>
              <h1 className="c-title-black-bold m-0">
                Ajouter un impact{theme.thematic && ` — ${theme.name}`}
              </h1>
            </div>
            <Link href="/workspace/sensibility" className="c-btn--tertiary">
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      <form action={addImpact} className="mt-4">
        <input type="hidden" name="impactThemeId" value={impactThemeId} />
        <ImpactFormFields exposures={exposureOptions} />
      </form>
    </div>
  );
}
