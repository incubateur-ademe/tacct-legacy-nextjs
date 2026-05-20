import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string; tab?: string }>;

// IDs des anciennes régions outre-mer (Guadeloupe, Martinique, Guyane, Réunion, Mayotte…)
// Le legacy utilise un check `isOverSeas(oldRegion.id)` — on utilise la même heuristique
// avec l'ID 4 par défaut. À affiner si besoin selon les données réelles.
const OVERSEAS_DEFAULT_TAB = 'overseas';

const TABS = [
  { key: 'global', label: 'Tendances globales' },
  { key: 'france', label: 'France' },
  { key: 'regional', label: 'Régional' },
  { key: 'overseas', label: 'Outre-mer' },
] as const;

export default async function ClimateTrendPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam, tab: tabParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/workspace/gestion/studies-management');

  // Récupère l'ancienne région via la commune → department
  const department = study.commune?.department_id
    ? await prisma.department.findUnique({
        where: { id: study.commune.department_id },
        include: { old_region: { include: { climate: true } } },
      })
    : null;

  const oldRegion = department?.old_region ?? null;
  const isOverseas = oldRegion ? isOverseasRegion(oldRegion.id) : false;
  const defaultTab = isOverseas ? OVERSEAS_DEFAULT_TAB : 'regional';
  const activeTab = (tabParam ?? defaultTab) as (typeof TABS)[number]['key'];

  return (
    <div className="container page">
      <div className="row">
        <div className="col-lg-12 col-md-16">
          <div className="o-card">
            <h1 className="c-title-black-bold">Tendances climatiques</h1>
            <div className="c-subtitle-grey">
              Région : {oldRegion?.label ?? '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <ul className="nav nav-tabs mt-4">
        {TABS.map((t) => (
          <li key={t.key} className="nav-item">
            <Link
              href={`?tab=${t.key}`}
              className={`nav-link ${activeTab === t.key ? 'active' : ''}`}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="o-card mt-4">
        {activeTab === 'global' && <GlobalTrend />}
        {activeTab === 'france' && <FranceTrend />}
        {activeTab === 'regional' && (
          <RegionalTrend regionLabel={oldRegion?.label} climate={oldRegion?.climate} />
        )}
        {activeTab === 'overseas' && (
          <RegionalTrend regionLabel={oldRegion?.label} climate={oldRegion?.climate} />
        )}
      </div>
    </div>
  );
}

function isOverseasRegion(id: string): boolean {
  // Codes anciennes régions outre-mer dans le référentiel ADEME.
  // À ajuster si la liste exacte évolue.
  return ['01', '02', '03', '04', '06'].includes(id);
}

function GlobalTrend() {
  return (
    <>
      <h2 className="c-subtitle-black-bold">Tendances climatiques globales</h2>
      <p>
        Selon le GIEC, la température globale a augmenté d&apos;environ 1,1°C depuis l&apos;ère
        préindustrielle. Les projections du rapport AR6 indiquent une poursuite du
        réchauffement quelles que soient les trajectoires d&apos;émissions à court terme.
      </p>
      <p>
        Pour consulter les données détaillées et les rapports complets, rends-toi sur le
        site du GIEC.
      </p>
      <a
        href="https://www.ipcc.ch/"
        target="_blank"
        rel="noopener noreferrer"
        className="c-btn--secondary"
      >
        Site du GIEC
      </a>
    </>
  );
}

function FranceTrend() {
  return (
    <>
      <h2 className="c-subtitle-black-bold">Tendances climatiques — France</h2>
      <p>
        Depuis 1900, la température moyenne en France métropolitaine a augmenté de
        +1,7°C, avec une accélération du réchauffement depuis les années 1980.
      </p>
      <a
        href="https://meteofrance.com/changement-climatique"
        target="_blank"
        rel="noopener noreferrer"
        className="c-btn--secondary"
      >
        Météo-France — Changement climatique
      </a>
    </>
  );
}

function RegionalTrend({
  regionLabel,
  climate,
}: {
  regionLabel: string | undefined;
  climate:
    | {
        temperature_evolution: string | null;
        level_precipitation_first: string | null;
        level_precipitation_second: string | null;
      }
    | null
    | undefined;
}) {
  if (!climate) {
    return (
      <p className="text-muted">
        Aucune donnée climatique régionale disponible pour {regionLabel ?? 'cette région'}.
      </p>
    );
  }
  return (
    <>
      <h2 className="c-subtitle-black-bold">Tendances — {regionLabel}</h2>
      <Section title="Évolution des températures">
        {climate.temperature_evolution || <em className="text-muted">Non renseigné</em>}
      </Section>
      <Section title="Niveau de précipitations (1)">
        {climate.level_precipitation_first || <em className="text-muted">Non renseigné</em>}
      </Section>
      <Section title="Niveau de précipitations (2)">
        {climate.level_precipitation_second || <em className="text-muted">Non renseigné</em>}
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div className="c-subtitle-grey">{title}</div>
      <div>{children}</div>
    </div>
  );
}
