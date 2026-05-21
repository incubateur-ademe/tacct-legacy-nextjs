import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { getImpactThemesForStudy } from '@/server/sensibility/queries';
import { validateSensibilityStep } from '@/server/sensibility/actions';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';
import {
  SensibilityTheme,
  type SensibilityThemeItem,
} from '@/components/sensibility/SensibilityTheme';
import type { SensibilityCardItem } from '@/components/sensibility/SensibilityCard';
import { ValidationFooter } from '@/components/observed-climate/ValidationFooter';
import { pluralize } from '@/lib/pluralize';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function SensibilityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const study = await getCurrentStudy(user, params.study);
  if (!study) redirect('/workspace/gestion/studies-management');

  const themes = await getImpactThemesForStudy(study.id);
  const totalImpacts = themes.reduce((sum, t) => sum + t.impact.length, 0);
  const qs = params.study ? `?study=${params.study}` : '';

  const items: SensibilityThemeItem[] = themes.map((t) => ({
    id: t.id,
    name: t.thematic?.name ?? t.name ?? '',
    icon: t.thematic?.icon ?? 'suspended',
    justification: t.justification ?? '',
    impacts: t.impact.map<SensibilityCardItem>((i) => {
      const primary = i.observed_exposure;
      const primaryName =
        primary?.climate_hazard?.name ?? primary?.climate_hazard_custom ?? '';
      const primaryIcon =
        primary?.climate_hazard_custom !== null
          ? 'suspended'
          : (primary?.climate_hazard?.climate_hazard_category?.icon ?? 'suspended');
      return {
        id: i.id,
        description: i.description ?? '',
        sensitivity: i.sensitivity === null ? null : Number(i.sensitivity),
        justification: i.justification ?? '',
        observedImpact: i.observed_impact ?? null,
        actionPlan: i.action_plan ?? null,
        primaryHazardName: primaryName,
        primaryHazardIcon: primaryIcon,
        secondaryHazardNames: i.observed_exposure_impact
          .map((oei) => oei.observed_exposure?.climate_hazard?.name ?? '')
          .filter((s): s is string => Boolean(s)),
      };
    }),
  }));

  const studyId = study.id;
  const validateAction = async () => {
    'use server';
    await validateSensibilityStep(studyId);
  };

  return (
    <ContentLayout helpKey="sensibility">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card o-card__triangle">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle="Identification des impacts"
                  subtitle="Diagnostiquer vos impacts"
                  icon="sensibilite"
                />
              </div>
              <div className="o-centred-elements d-flex">
                {totalImpacts > 0 && (
                  <span className="ml-0 mr-auto subtitle">
                    {totalImpacts} {pluralize(totalImpacts, 'impact', 'impacts')}
                  </span>
                )}
                <Link
                  href={`/workspace/sensibility/impact-theme/add${qs}`}
                  className="ml-auto mr-0 c-btn--primary"
                >
                  Ajouter une thématique
                </Link>
              </div>
            </div>
          </div>
          <div className="col-lg-12">
            {items.map((t) => (
              <SensibilityTheme key={t.id} theme={t} />
            ))}
          </div>
        </div>
      </div>

      {totalImpacts > 0 && (
        <ValidationFooter label="Valider la sensibilité" action={validateAction} />
      )}
    </ContentLayout>
  );
}
