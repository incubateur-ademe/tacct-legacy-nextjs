import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';

export const dynamic = 'force-dynamic';

export default function AnalyseFutureClimatePage() {
  return (
    <ContentLayout helpKey="analyse-future-climate">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle="Analyse du climat futur"
                  subtitle="Diagnostiquer vos impacts"
                  icon="exposition-future"
                />
              </div>
              <div className="col-lg-12">
                <p>
                  Retrouvez une synthèse d&apos;indicateurs du climat futur pour votre
                  commune ou votre intercommunalité en cliquant ici :
                </p>
                <div className="text-center mt-4 mb-4">
                  <a
                    href="https://meteofrance.com/climadiag-commune"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="c-legend-action-bold"
                  >
                    CLIMADIAG COMMUNE par Météo-France
                  </a>
                </div>
                <div className="sc-future-climate-analysis__text-bloc">
                  <p>Comment ça marche ?</p>
                  <ol>
                    <li>
                      Entrez le nom ou le code postal de la commune ou intercommunalité de
                      votre choix ;
                    </li>
                    <li>
                      Lisez les quelques lignes du « mode d&apos;emploi » de Météo-France
                      pour bien comprendre les données personnalisées qui vont s&apos;afficher ;
                    </li>
                    <li>
                      Consultez les différents indicateurs disponibles, regroupés en 5
                      thématiques :
                      <ul>
                        <li>
                          Climat : température moyenne, nombre de jours de gel, cumul de
                          précipitations, nombre de jours avec précipitations.
                        </li>
                        <li>
                          Risques naturels : nombre de jours avec fortes précipitations,
                          précipitations quotidiennes remarquables, nombre de jours avec
                          risque de feux de végétation, nombre de jours avec sol sec.
                        </li>
                        <li>
                          Santé : nombre de jours très chauds, nombre de nuits chaudes,
                          nombre de jours en vagues de chaleur, nombre de jours en vagues
                          de froid.
                        </li>
                        <li>
                          Agriculture : nombre de jours consécutifs sans précipitations,
                          date de reprise de la végétation, disponibilité thermique pour
                          le blé, nombre de jours échaudants.
                        </li>
                        <li>Tourisme : nombre de jours estivaux.</li>
                      </ul>
                    </li>
                  </ol>
                  <p>
                    Retrouver dans le menu RESSOURCES une liste de sites internet
                    fournissant d&apos;autres données climatiques.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
