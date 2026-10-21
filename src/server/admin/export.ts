import 'server-only';
import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/server/study/current-study';
import type { getStudiesAdminExport, getUsersExport } from '@/server/admin/queries';

type ExportedUser = Awaited<ReturnType<typeof getUsersExport>>[number];
type ExportedStudy = Awaited<ReturnType<typeof getStudiesAdminExport>>[number];

type Column<T> = {
  header: string;
  width: number;
  value: (row: T) => ExcelJS.CellValue;
  numFmt?: string;
};

const DATE_FORMAT = 'dd/mm/yyyy';

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
  { header: 'Date de création', width: 16, value: (u) => u.created_at, numFmt: DATE_FORMAT },
  {
    header: "Dernier accès à l'outil",
    width: 20,
    value: (u) => u.workspace_last_login_at,
    numFmt: DATE_FORMAT,
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
    value: (s) => fullName(s.user_study.find((us) => us.head_study)?.user),
  },
  {
    header: "Email du chargé de l'étude",
    width: 32,
    value: (s) => s.user_study.find((us) => us.head_study)?.user?.email ?? '',
  },
  { header: 'Nombre de membres', width: 18, value: (s) => s.user_study.length },
  { header: 'Exposition observée', width: 18, value: (s) => stepStatus(s.observed_exposure_valid) },
  { header: 'Exposition future', width: 18, value: (s) => stepStatus(s.exposition_future_valid) },
  { header: 'Sensibilité', width: 14, value: (s) => stepStatus(s.sensibility_valid) },
  {
    header: 'Construction des stratégies',
    width: 26,
    value: (s) => stepStatus(s.strategy_construction_valid),
  },
  { header: 'Date de création', width: 16, value: (s) => s.created_at, numFmt: DATE_FORMAT },
  {
    header: 'Dernière modification',
    width: 20,
    value: (s) => s.updated_at,
    numFmt: DATE_FORMAT,
  },
];

async function buildWorkbook<T>(sheetName: string, columns: Column<T>[], rows: T[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TACCT';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = columns.map((c) => ({
    header: c.header,
    width: c.width,
    style: c.numFmt ? { numFmt: c.numFmt } : {},
  }));
  for (const row of rows) {
    sheet.addRow(columns.map((c) => c.value(row)));
  }
  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  return workbook.xlsx.writeBuffer();
}

export const buildUsersWorkbook = (users: ExportedUser[]) =>
  buildWorkbook('Comptes', USER_COLUMNS, users);

export const buildStudiesWorkbook = (studies: ExportedStudy[]) =>
  buildWorkbook('Études', STUDY_COLUMNS, studies);

export function xlsxResponse(buffer: ExcelJS.Buffer, basename: string) {
  const filename = `${basename}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
