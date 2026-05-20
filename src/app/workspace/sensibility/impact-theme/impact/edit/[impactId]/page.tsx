import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import {
  getExposuresForStudy,
  getImpactById,
} from '@/server/sensibility/queries';
import { updateImpact } from '@/server/sensibility/actions';
import { ImpactFormFields } from '@/components/sensibility/ImpactFormFields';

export const dynamic = 'force-dynamic';

type Params = Promise<{ impactId: string }>;

export default async function EditImpactPage({ params }: { params: Params }) {
  const user = await requireCurrentUser();
  const { impactId } = await params;

  const impact = await getImpactById(impactId);
  if (!impact?.impact_theme?.study_id) notFound();
  const studyId = impact.impact_theme.study_id;
  const canEdit = isAdmin(user) || user.user_study.some((us) => us.study_id === studyId);
  if (!canEdit) redirect('/workspace');

  const exposures = await getExposuresForStudy(studyId);
  const exposureOptions = exposures.map((e) => ({
    id: e.id,
    label: e.climate_hazard_custom ?? e.climate_hazard?.name ?? '—',
  }));

  const secondaryIds = impact.observed_exposure_impact.map((x) => x.observed_exposure_id);

  const updateAction = updateImpact.bind(null, impactId);

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card d-flex justify-content-between align-items-center">
            <h1 className="c-title-black-bold m-0">
              Modifier l&apos;impact — {impact.impact_theme.name}
            </h1>
            <Link href="/workspace/sensibility" className="c-btn--tertiary">
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      <form action={updateAction} className="mt-4">
        <input type="hidden" name="impactThemeId" value={impact.impact_theme.id} />
        <ImpactFormFields
          exposures={exposureOptions}
          defaults={{
            description: impact.description,
            sensitivity: impact.sensitivity === null ? null : Number(impact.sensitivity),
            justification: impact.justification,
            primaryExposureId: impact.primary_exposure_id,
            secondaryExposureIds: secondaryIds,
            observedImpact: impact.observed_impact,
            actionPlan: impact.action_plan,
          }}
        />
      </form>
    </div>
  );
}
