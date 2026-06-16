import { getDomainsList } from '@/server/admin/queries';
import { getAllPublicProjectSheets } from '@/server/project-sheets/queries';
import { ProjectSheetCardList } from '@/components/project-sheets/ProjectSheetCardList';

export const dynamic = 'force-dynamic';

export default async function ProjectSheetsListPage() {
  const [sheets, domains] = await Promise.all([
    getAllPublicProjectSheets(),
    getDomainsList(),
  ]);

  const domainOptions = domains.map((domain) => ({
    id: domain.id,
    name: domain.name,
    icon: domain.icon,
  }));

  return (
    <div className="sc-project-sheets__content">
      <div className="container">
        <h1 className="sc-project-sheets-liste__title">Les Fiches Projet</h1>
        <div className="sc-project-sheets-list__intro-bloc">
          <p className="sc-project-sheets-list__intro-text">
            Vous avez un projet d’aménagement pour votre territoire ? de développement
            d’une nouvelle activité ? Vous vous interrogez sur la résilience des secteurs
            économiques présents sur votre territoire ? Comment aborder la question de
            l’impact des évolutions climatiques actuelles et à venir sur vos projets, vos
            infrastructures, vos activités ?
          </p>
        </div>
        <div className="sc-project-sheets-list__intro-bloc">
          <p className="sc-project-sheets-list__intro-text">
            Ces fiches ne visent pas à expliquer comment vous adapter mais vous proposent
            un guide de questionnement par thématiques.
          </p>
        </div>

        <ProjectSheetCardList sheets={sheets} domains={domainOptions} />

        <div className="sc-project-sheets-list__outro-bloc">
          <p className="sc-project-sheets-list__outro-text">
            Cet espace est conçu sur la base de l’outil{' '}
            <a href="https://outil-cactus.parc-golfe-morbihan.bzh/" target="_blank" rel="noopener noreferrer">
              CACTUS
            </a>{' '}
            Parc naturel régional du Golfe du Morbihan / Université de Bretagne
            Occidentale. Il est développé dans le cadre du projet européen{' '}
            <a href="https://www.ofb.gouv.fr/le-projet-life-integre-artisan" target="_blank" rel="noopener noreferrer">
              LIFE ARTISAN
            </a>{' '}
            qui vise à promouvoir les solutions d’adaptation fondées sur la nature.
          </p>
        </div>
      </div>
    </div>
  );
}
