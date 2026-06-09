import Link from 'next/link';
import { requireCurrentUser } from '@/server/auth/current-user';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';

export const dynamic = 'force-dynamic';

/**
 * Port de `app-profile` (Angular legacy).
 *
 * Page très simple : titre + 3 inputs read-only (Prénom, Nom, Email) + bouton
 * de réinitialisation du mot de passe + lien vers Contact pour modifier les
 * infos.
 *
 * NB : le bouton « Réinitialiser mon mot de passe » du legacy appelait
 * `userService.resetPassword(userId)` qui hit l'API Keycloak. Côté next on
 * passe à ProConnect (NextAuth) qui gère son propre flux de mot de passe — le
 * bouton est donc remplacé par un lien externe (à brancher quand ProConnect
 * sera intégré).
 */
export default async function ProfilePage() {
  const user = await requireCurrentUser();

  return (
    <ContentLayout helpKey="profile">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card pb-0">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle="PROFIL"
                  subtitle="Dossier TACCT"
                  icon="people"
                />
              </div>

              <section>
                <div className="row">
                  <div className="c-input__group col-md-6 col-sm-16 input-size-small">
                    <input
                      className="c-input"
                      type="text"
                      defaultValue={user.firstname ?? ''}
                      readOnly
                    />
                    <label className="c-input__label">Prénom</label>
                  </div>

                  <div className="c-input__group col-md-6 col-sm-16 input-size-small">
                    <input
                      className="c-input"
                      type="text"
                      defaultValue={user.lastname ?? ''}
                      readOnly
                    />
                    <label className="c-input__label">Nom</label>
                  </div>
                </div>

                <div className="row u-margin__bottom-l">
                  <div className="c-input__group col-md-6 col-sm-16 input-size-medium">
                    <input
                      className="c-input"
                      type="text"
                      defaultValue={user.email ?? ''}
                      readOnly
                    />
                    <label className="c-input__label">Adresse mail</label>
                  </div>
                </div>

                {/* <div className="c-group-buttons">
                  <button
                    type="button"
                    className="c-btn--primary"
                    disabled
                    title="Le mot de passe est géré par ProConnect (à brancher)"
                  >
                    Réinitialiser mon mot de passe
                  </button>
                </div> */}
              </section>

              {/* <div className="row pt-5 pb-5"> */}
                {/* <span className="c-txt-marianne-regular c-empty">
                  Pour modifier votre nom/prénom, merci de{' '}
                  <Link href="/contact">contacter le support ADEME</Link>.
                </span> */}
              {/* </div> */}
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
