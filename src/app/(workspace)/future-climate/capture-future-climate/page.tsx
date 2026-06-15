import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { getObservedExposuresWithFutureForStudy } from '@/server/future-exposure/queries';
import { validateFutureExposureStep } from '@/server/future-exposure/actions';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { ValidationFooter } from '@/components/observed-climate/ValidationFooter';
import { FutureCapture, type FutureCaptureItem } from '@/components/future-climate/FutureCapture';
import { pluralize } from '@/lib/pluralize';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function CaptureFutureClimatePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/gestion/studies-management');

  const exposures = await getObservedExposuresWithFutureForStudy(study.id);

  const items: FutureCaptureItem[] = exposures.map((exp) => ({
    id: exp.id,
    categoryIcon:
      exp.climate_hazard_custom !== null
        ? 'suspended'
        : (exp.climate_hazard?.climate_hazard_category?.icon ?? 'suspended'),
    hazardName: exp.climate_hazard_custom ?? exp.climate_hazard?.name ?? '',
    climateFeatures: exp.climate_features ?? null,
    trends: exp.trends ?? null,
    sources: exp.sources ?? null,
    observedExposure: exp.exposure === null ? null : Number(exp.exposure),
    observedJustification: exp.justification ?? null,
    futureTrends: exp.future_exposure?.trends ?? null,
    futureExposure:
      exp.future_exposure?.exposure === null || exp.future_exposure?.exposure === undefined
        ? null
        : Number(exp.future_exposure.exposure),
    futureJustification: exp.future_exposure?.justification ?? null,
  }));

  const studyId = study.id;
  const validateAction = async () => {
    'use server';
    await validateFutureExposureStep(studyId);
  };

  return (
    <ContentLayout helpKey="capture-future-climate">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card o-card__triangle">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle="Saisie de l'exposition future aux aléas"
                  subtitle="Diagnostiquer vos impacts"
                  icon="exposition-future"
                />
              </div>
              {items.length > 0 && (
                <div className="o-centred-elements">
                  {items.length} {pluralize(items.length, 'aléa', 'aléas')}
                </div>
              )}
            </div>
          </div>
        </div>

        <FutureCapture items={items} />
      </div>

      {items.length > 0 && (
        <ValidationFooter label="VALIDER L'EXPOSITION" action={validateAction} />
      )}
    </ContentLayout>
  );
}
