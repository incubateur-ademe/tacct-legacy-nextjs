import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicProjectSheetBySlug } from '@/server/project-sheets/queries';
import { ProjectSheetIntroBloc } from '@/components/project-sheets/ProjectSheetIntroBloc';
import { ProjectSheetEffectsConsequences } from '@/components/project-sheets/ProjectSheetEffectsConsequences';
import { ProjectSheetQuestions } from '@/components/project-sheets/ProjectSheetQuestions';
import { ProjectSheetRessources } from '@/components/project-sheets/ProjectSheetRessources';
import { ProjectSheetRelatedItems } from '@/components/project-sheets/ProjectSheetRelatedItems';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

export default async function ProjectSheetDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const sheet = await getPublicProjectSheetBySlug(slug);
  if (!sheet) notFound();

  return (
    <div className="sc-project-sheets__content">
      <div className="container">
        <Link href="/project-sheets" className="sc-project-sheet-detail__back-btn mb-4">
          <span
            className="c-icon medium project-primary chevron-left"
            aria-hidden="true"
          />
          Retour aux fiches
        </Link>
        <ProjectSheetIntroBloc sheet={sheet} />
      </div>

      <ProjectSheetEffectsConsequences
        effects={sheet.expectedEffects}
        consequences={sheet.consequences}
      />

      <div className="container">
        <ProjectSheetQuestions questions={sheet.questions} />
        <ProjectSheetRessources resources={sheet.resources} />
        <ProjectSheetRelatedItems sheets={sheet.linkedSheets} />
      </div>
    </div>
  );
}
