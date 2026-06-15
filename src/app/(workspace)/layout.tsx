import { Header } from '@/components/layout/Header';
import { Menu } from '@/components/layout/Menu';
import { Footer } from '@/components/layout/Footer';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy, userRoles } from '@/server/study/current-study';

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireCurrentUser();
  const roles = userRoles(user);

  // Statut des étapes du diagnostic, affiché en badge dans le menu (comme le legacy).
  const study = await getCurrentStudy(user);
  const studyStatus = study
    ? {
        observed_exposure_valid: study.observed_exposure_valid ?? undefined,
        exposition_future_valid: study.exposition_future_valid ?? undefined,
        sensibility_valid: study.sensibility_valid ?? undefined,
      }
    : undefined;

  return (
    <>
      <Header />
      <div id="mainContent" className="sc-app__container pt-5">
        <Menu userRoles={roles} studyStatus={studyStatus} />
        <div className="sc-app__content container-fluid">
          <div className="content-body">{children}</div>
          <div className="container page">
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}
