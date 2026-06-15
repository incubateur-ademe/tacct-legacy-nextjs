import { notFound, redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import {
  getExposuresForStudy,
  getImpactThemeById,
} from '@/server/sensibility/queries';
import { addImpact } from '@/server/sensibility/actions';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { ImpactFormFields } from '@/components/sensibility/ImpactFormFields';

export const dynamic = 'force-dynamic';

type Params = Promise<{ impactThemeId: string }>;

export default async function AddImpactPage({ params }: { params: Params }) {
  const user = await requireCurrentUser();
  const { impactThemeId } = await params;

  const theme = await getImpactThemeById(impactThemeId);
  if (!theme?.study_id) notFound();
  const canEdit = isAdmin(user) || user.user_study.some((us) => us.study_id === theme.study_id);
  if (!canEdit) redirect('/');

  const exposures = await getExposuresForStudy(theme.study_id);
  const exposureOptions = exposures.map((e) => ({
    id: e.id,
    label: e.climate_hazard_custom ?? e.climate_hazard?.name ?? '—',
  }));

  const icon = theme.thematic?.icon ?? 'suspended';

  return (
    <ContentLayout helpKey="sensibility">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle="Décrire l'impact"
                  subtitle="Diagnostiquer vos impacts"
                  icon={icon}
                />
              </div>
              <form action={addImpact}>
                <input type="hidden" name="impactThemeId" value={impactThemeId} />
                <ImpactFormFields exposures={exposureOptions} />
              </form>
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
