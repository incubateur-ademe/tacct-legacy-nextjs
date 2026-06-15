import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { getObservedExposuresForStudy } from '@/server/observed-exposure/queries';
import { validateObservedExposureStep } from '@/server/observed-exposure/actions';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { Exposure, type ExposureItem } from '@/components/observed-climate/Exposure';
import { ValidationFooter } from '@/components/observed-climate/ValidationFooter';
import { pluralize } from '@/lib/pluralize';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function ObservedExposurePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const study = await getCurrentStudy(user, params.study);
  if (!study) redirect('/gestion/studies-management');

  const exposures = await getObservedExposuresForStudy(study.id);
  const total = exposures.length;
  const qs = params.study ? `?study=${params.study}` : '';

  const items: ExposureItem[] = exposures.map((exp) => ({
    id: exp.id,
    categoryIcon:
      exp.climate_hazard_custom !== null
        ? 'suspended'
        : (exp.climate_hazard?.climate_hazard_category?.icon ?? 'suspended'),
    hazardName: exp.climate_hazard_custom ?? exp.climate_hazard?.name ?? '',
    climateFeatures: exp.climate_features ?? null,
    trends: exp.trends ?? null,
    sources: exp.sources ?? null,
    exposure: exp.exposure === null ? null : Number(exp.exposure),
    justification: exp.justification ?? null,
  }));

  const studyId = study.id;
  const validateAction = async () => {
    'use server';
    await validateObservedExposureStep(studyId);
  };

  return (
    <ContentLayout helpKey="observed-exposure">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card o-card__triangle">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle="Saisie de l'exposition observée aux aléas"
                  subtitle="Diagnostiquer vos impacts"
                  icon="eye"
                />
              </div>
              <div className="o-centred-elements d-flex">
                {total > 0 && (
                  <span className="ml-0 mr-auto subtitle">
                    {total} {pluralize(total, 'aléa', 'aléas')}
                  </span>
                )}
                <Link
                  href={`/observed-climate/observed-exposure/add${qs}`}
                  className="ml-auto mr-0 c-btn--primary"
                >
                  Ajouter un aléa
                </Link>
              </div>
            </div>
          </div>
        </div>

        <Exposure items={items} />
      </div>

      {total > 0 && (
        <ValidationFooter label="VALIDER L'EXPOSITION" action={validateAction} />
      )}
    </ContentLayout>
  );
}
