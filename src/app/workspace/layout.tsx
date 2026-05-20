import { Header } from '@/components/layout/Header';
import { Menu } from '@/components/layout/Menu';
import { Footer } from '@/components/layout/Footer';
import { requireCurrentUser } from '@/server/auth/current-user';
import { userRoles } from '@/server/study/current-study';

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Phase actuelle : exige DEV_AUTH_EMAIL configuré. Sera remplacé par ProConnect
  // sans toucher aux pages — tout passe par requireCurrentUser().
  const user = await requireCurrentUser();
  const roles = userRoles(user);

  return (
    <>
      <Header />
      <div id="mainContent" className="sc-app__container pt-5">
        <Menu userRoles={roles} />
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
