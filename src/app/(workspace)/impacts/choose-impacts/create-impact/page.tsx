import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { getImpactThemesAndCatalog } from '@/server/strategies/queries';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { CreateImpactStrategyForm } from '@/components/strategies/CreateImpactStrategyForm';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

export default async function CreateImpactStrategyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/gestion/studies-management');

  const { catalog } = await getImpactThemesAndCatalog(study.id);

  return (
    <div className="sc-create-strategy-impact container page">
      <div className="o-card u-margin__bottom--m">
        <div className="row">
          <BlockTitleIcon
            className="col-16"
            pageTitle="Ajouter un impact à étudier"
            subtitle="Construire des stratégies"
            icon="cible"
          />
        </div>
        <CreateImpactStrategyForm
          studyId={study.id}
          thematics={catalog.map((c) => ({ id: c.id, name: c.name, icon: c.icon }))}
        />
      </div>
    </div>
  );
}
