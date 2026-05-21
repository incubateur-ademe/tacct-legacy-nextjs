import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';

export const dynamic = 'force-dynamic';

export default function NaturalDisastersPage() {
  return (
    <ContentLayout helpKey="natural-disasters">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle="Catastrophes naturelles sur votre territoire"
                  subtitle="Diagnostiquer vos impacts"
                  icon="eye"
                />
              </div>
              <div>
                <p>
                  Retrouvez la liste des arrêtés Catastrophes naturelles dans la thématique
                  Gestion des risques (il vous faudra saisir le nom de votre territoire).
                </p>
                <div className="text-center mt-4 mb-4">
                  <a
                    href="https://facili-tacct.beta.gouv.fr/recherche-territoire"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="c-legend-action-bold"
                  >
                    Consulter la thématique Gestion des risques
                  </a>
                </div>
                <p>À noter :</p>
                <p>
                  La thématique Gestion des risques vous fournit la liste des arrêtés
                  catastrophes naturelles de votre territoire. La date affichée est celle du
                  début de l&apos;évènement (catastrophe naturelle). Dans l&apos;export
                  excel à votre disposition, vous trouverez également la date de fin de
                  l&apos;évènement, ainsi que la date de publication de l&apos;arrêté.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
