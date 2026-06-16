import { prisma } from '@/server/db';
import 'server-only';
import { HelpSidebar, type HelpPage } from './HelpSidebar';

/**
 * Port de `app-content-layout` du legacy : enveloppe le contenu de la page
 * dans une grille `col-lg-9` (contenu) + `col-lg-3` (barre d'aide à droite).
 *
 * Charge la `page_info` correspondant à `helpKey` (équiv. de `HelpKeyEnum`).
 * Si elle n'existe pas, le contenu prend toute la largeur (`col-lg-12`) —
 * fidélité au comportement legacy.
 *
 * Usage : chaque page workspace appelle
 *   <ContentLayout helpKey="main-page">…</ContentLayout>
 */
export async function ContentLayout({
  helpKey,
  children,
}: {
  helpKey: string;
  children: React.ReactNode;
}) {
  const pageInfo = await prisma.page_info.findFirst({
    where: { name: helpKey },
    include: { page: { orderBy: { rank: 'asc' } } },
  });

  const helpPages: HelpPage[] = (pageInfo?.page ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    rank: Number(p.rank),
    page_type: p.page_type,
    content: p.content?.replace(/https:\/\/tacct\.ademe\.fr/g, '/workspace-tacct') ?? null,
    slug: p.slug,
  }));

  const hasHelp = helpPages.length > 0;

  return (
    <div className="page container">
      <div className="row">
        <div className={`content-page ${hasHelp ? 'col-lg-9' : 'col-lg-12'}`}>{children}</div>
        {hasHelp && pageInfo && <HelpSidebar pageInfoTitle={pageInfo.title} pages={helpPages} />}
      </div>
    </div>
  );
}
