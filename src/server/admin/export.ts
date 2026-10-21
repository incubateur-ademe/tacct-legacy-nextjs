import 'server-only';
import writeXlsxFile, { type Cell, type SheetData } from 'write-excel-file/node';
import { NextResponse, type NextRequest } from 'next/server';
import { requireCurrentUser, type CurrentUser } from '@/server/auth/current-user';
import { isAdmin } from '@/server/study/current-study';
import type { getStudiesAdminExport, getUsersExport } from '@/server/admin/queries';

type ExportedUser = Awaited<ReturnType<typeof getUsersExport>>[number];
type ExportedStudy = Awaited<ReturnType<typeof getStudiesAdminExport>>[number];

type Column<T> = {
  header: string;
  width: number;
  value: (row: T) => string | number | Date | null;
};

const DATE_FORMAT = 'dd/mm/yyyy';

// Limite d'Excel par cellule : au-delà, le fichier est signalé comme corrompu.
const MAX_CELL_LENGTH = 32_767;

// Premiers caractères qui font d'une cellule une formule (OWASP, CSV injection).
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

/**
 * Les chaînes viennent en partie des utilisateurs : un simple membre d'étude
 * peut écrire `territory_name`, ensuite exporté chez l'admin.
 * - type `String` explicite : une saisie comme `=HYPERLINK(…)` reste du texte ;
 * - préfixe `'` si elle commence comme une formule : elle reste inerte même si
 *   le fichier est réenregistré en CSV puis rouvert ;
 * - troncature à la limite d'Excel, sans couper une paire UTF-16.
 * L'échappement XML et le retrait des caractères invalides sont faits par la
 * bibliothèque (verrouillé par tests/unit/admin-export.test.ts).
 */
function toCell(value: string | number | Date | null): Cell {
  if (typeof value !== 'string') return value;
  let text = FORMULA_TRIGGER.test(value) ? `'${value}` : value;
  if (text.length > MAX_CELL_LENGTH) {
    text = text.slice(0, MAX_CELL_LENGTH).replace(/[\uD800-\uDBFF]$/, '');
  }
  return { value: text, type: String };
}

const STEP_STATUS_LABELS: Record<string, string> = {
  'in-progress': 'En cours',
  incomplete: 'Incomplet',
  validated: 'Validé',
};

const stepStatus = (status: string) => STEP_STATUS_LABELS[status] ?? status;

const fullName = (u: { firstname: string; lastname: string } | null | undefined) =>
  u ? `${u.firstname} ${u.lastname}`.trim() : '';

const USER_COLUMNS: Column<ExportedUser>[] = [
  { header: 'Nom', width: 20, value: (u) => u.lastname },
  { header: 'Prénom', width: 20, value: (u) => u.firstname },
  { header: 'Email', width: 32, value: (u) => u.email },
  { header: "Bureau d'études", width: 25, value: (u) => u.study_office?.name ?? '' },
  { header: 'Commune', width: 25, value: (u) => u.commune?.label ?? '' },
  { header: 'Code postal', width: 12, value: (u) => u.commune?.postal_code ?? '' },
  {
    header: 'Statut',
    width: 24,
    value: (u) => (u.validated ? 'Validé' : 'En attente de validation'),
  },
  { header: 'Administrateur', width: 15, value: (u) => (isAdmin(u) ? 'Oui' : 'Non') },
  {
    header: 'Études',
    width: 40,
    value: (u) =>
      u.user_study
        .flatMap((us) => (us.study ? [`${us.study.territory_name} ${us.study.year}`] : []))
        .join(', '),
  },
  { header: 'Date de création', width: 16, value: (u) => u.created_at },
  {
    header: "Dernier accès à l'outil",
    width: 20,
    value: (u) => u.workspace_last_login_at,
  },
  { header: "Nombre d'accès", width: 15, value: (u) => u.workspace_login_count },
];

const STUDY_COLUMNS: Column<ExportedStudy>[] = [
  { header: "Territoire de l'étude", width: 30, value: (s) => s.territory_name },
  { header: 'Année', width: 8, value: (s) => Number(s.year) },
  { header: 'Commune', width: 25, value: (s) => s.commune?.label ?? '' },
  { header: 'Code postal', width: 12, value: (s) => s.commune?.postal_code ?? '' },
  { header: 'Département', width: 20, value: (s) => s.commune?.department?.label ?? '' },
  { header: 'Région', width: 25, value: (s) => s.commune?.department?.region?.label ?? '' },
  {
    header: "Chargé de l'étude",
    width: 25,
    value: (s) => fullName(s.user_study[0]?.user),
  },
  {
    header: "Email du chargé de l'étude",
    width: 32,
    value: (s) => s.user_study[0]?.user?.email ?? '',
  },
  { header: 'Nombre de membres', width: 18, value: (s) => s._count.user_study },
  { header: 'Exposition observée', width: 18, value: (s) => stepStatus(s.observed_exposure_valid) },
  { header: 'Exposition future', width: 18, value: (s) => stepStatus(s.exposition_future_valid) },
  { header: 'Sensibilité', width: 14, value: (s) => stepStatus(s.sensibility_valid) },
  {
    header: 'Construction des stratégies',
    width: 26,
    value: (s) => stepStatus(s.strategy_construction_valid),
  },
  { header: 'Date de création', width: 16, value: (s) => s.created_at },
  {
    header: 'Dernière modification',
    width: 20,
    value: (s) => s.updated_at,
  },
];

function buildWorkbook<T>(sheet: string, columns: Column<T>[], rows: T[]) {
  const data: SheetData = [
    columns.map((c) => ({ value: c.header, type: String, fontWeight: 'bold' as const })),
    ...rows.map((row) => columns.map((c) => toCell(c.value(row)))),
  ];
  return writeXlsxFile(data, {
    sheet,
    columns: columns.map((c) => ({ width: c.width })),
    stickyRowsCount: 1,
    dateFormat: DATE_FORMAT,
  }).toBuffer();
}

export const buildUsersWorkbook = (users: ExportedUser[]) =>
  buildWorkbook('Comptes', USER_COLUMNS, users);

export const buildStudiesWorkbook = (studies: ExportedStudy[]) =>
  buildWorkbook('Études', STUDY_COLUMNS, studies);

const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 });

/**
 * Contrôles communs aux exports de données personnelles (admin). Renvoie
 * l'utilisateur autorisé, ou la réponse d'erreur à servir telle quelle.
 *
 * - `Sec-Fetch-Site` : seul un clic depuis l'outil (`same-origin`) ou une URL
 *   saisie à la main (`none`) passe. Une requête déclenchée par un autre site,
 *   même avec le cookie de session, est refusée. En-tête absent (vieux
 *   navigateur, client HTTP) : on s'en remet aux contrôles suivants.
 * - Rôle admin relu en base à chaque requête (pas depuis le JWT) : un retrait
 *   de droits prend effet immédiatement, sans attendre l'expiration de session.
 * - `validated` : redondant avec l'invariant « un admin reste validé »
 *   (`@/server/acl/account`), gardé par prudence.
 */
export async function authorizeAdminExport(
  request: NextRequest,
): Promise<CurrentUser | NextResponse> {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return forbidden();

  const user = await requireCurrentUser();
  if (!isAdmin(user) || !user.validated) return forbidden();
  return user;
}

/**
 * Réponse de téléchargement. Trace l'export dans les logs (qui, quoi, combien
 * de lignes) sans y écrire de donnée personnelle — ni les filtres saisis, qui
 * peuvent contenir un nom.
 */
export function xlsxResponse(
  buffer: Buffer,
  { basename, user, rowCount }: { basename: string; user: CurrentUser; rowCount: number },
) {
  console.info(`[export] ${basename} téléchargé par l'admin ${user.id} : ${rowCount} ligne(s)`);

  const filename = `${basename}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // Données personnelles : aucun cache, ni navigateur ni intermédiaire.
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
      // Rien à exécuter ni à encadrer : un fichier, jamais une page.
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    },
  });
}
