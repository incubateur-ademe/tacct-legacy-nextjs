import { redirect } from 'next/navigation';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { requireCurrentUser } from '@/server/auth/current-user';
import { getCurrentStudy } from '@/server/study/current-study';
import { prisma } from '@/server/db';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { ClimateTrendTabs } from '@/components/observed-climate/ClimateTrendTabs';
import type { ClimateData } from '@/components/observed-climate/ClimateTrendContent';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ study?: string }>;

const OVERSEAS_REGION_IDS = ['01', '02', '03', '04', '06'];
const DEFAULT_METROPOLE_REGION = '11'; // Île-de-France
const DEFAULT_OVERSEAS_REGION = '04';

/**
 * Port de `Climate::getTemperatureImage()` / `getPrecipitationImage()` du
 * backend Symfony : cherche un fichier `<regionId>_<kind>.{png,svg}` dans
 * `public/assets/img/temp_precip/`. Retourne le chemin web ou `null`.
 */
function findImagePath(regionId: string, kind: 'temperature' | 'precipitation'): string | null {
  const base = '/workspace-tacct/assets/img/temp_precip';
  const dir = path.join(process.cwd(), 'public', base);
  for (const ext of ['png', 'svg']) {
    const fileName = `${regionId}_${kind}.${ext}`;
    if (existsSync(path.join(dir, fileName))) {
      return `${base}/${fileName}`;
    }
  }
  return null;
}

export default async function ClimateTrendPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireCurrentUser();
  const { study: studyIdParam } = await searchParams;
  const study = await getCurrentStudy(user, studyIdParam);
  if (!study) redirect('/gestion/studies-management');

  // Région d'origine de l'étude (via commune → department → old_region)
  const department = study.commune?.department_id
    ? await prisma.department.findUnique({
        where: { id: study.commune.department_id },
        include: { old_region: true },
      })
    : null;
  const oldRegionId = department?.old_region?.id ?? null;
  const isOverseas = oldRegionId ? OVERSEAS_REGION_IDS.includes(oldRegionId) : false;

  // Climats pour TOUTES les régions, indexés par region_id (pour les changements
  // de région à la volée côté client).
  const climates = await prisma.climate.findMany({
    include: { old_region: true },
  });
  const climatesByRegion: Record<string, ClimateData> = {};
  for (const c of climates) {
    if (!c.region_id || !c.old_region) continue;
    climatesByRegion[c.region_id] = {
      regionId: c.region_id,
      regionLabel: c.old_region.label,
      temperatureEvolution: c.temperature_evolution,
      levelPrecipitationFirst: c.level_precipitation_first,
      levelPrecipitationSecond: c.level_precipitation_second,
      temperatureImage: findImagePath(c.region_id, 'temperature'),
      precipitationImage: findImagePath(c.region_id, 'precipitation'),
    };
  }

  // Lit les SVG depuis le filesystem (cf. `public/assets/img/trend-climate/`).
  // Les SVG ont été pré-nettoyés des bindings Angular et exposent
  // `data-region="<id>"` sur chaque polygone/path.
  const mapsDir = path.join(process.cwd(), 'public/assets/img/trend-climate');
  const [metropoleMapSvg, overseasMapSvg] = await Promise.all([
    readFile(path.join(mapsDir, 'map-france.svg'), 'utf8'),
    readFile(path.join(mapsDir, 'map-outre-mer.svg'), 'utf8'),
  ]);

  // Sélection par défaut : la région de l'étude, sinon une région de fallback
  // (mimique de `Utils.getIdRegion` / `Utils.getIdOverSeas` du legacy).
  const defaultMetropoleRegionId =
    oldRegionId && !isOverseas && climatesByRegion[oldRegionId]
      ? oldRegionId
      : DEFAULT_METROPOLE_REGION;
  const defaultOverseasRegionId =
    oldRegionId && isOverseas && climatesByRegion[oldRegionId]
      ? oldRegionId
      : DEFAULT_OVERSEAS_REGION;

  const defaultTab = isOverseas ? 4 : 3;

  return (
    <ContentLayout helpKey="climate-trend">
      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <div className="o-card">
              <div className="row">
                <BlockTitleIcon
                  className="col-16"
                  pageTitle="Tendances climatiques générales"
                  subtitle="Diagnostiquer vos impacts"
                  icon="eye"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container page">
        <div className="row">
          <div className="col-lg-12 col-md-16">
            <ClimateTrendTabs
              defaultTab={defaultTab as 1 | 2 | 3 | 4}
              metropoleMapSvg={metropoleMapSvg}
              overseasMapSvg={overseasMapSvg}
              climatesByRegion={climatesByRegion}
              defaultMetropoleRegionId={defaultMetropoleRegionId}
              defaultOverseasRegionId={defaultOverseasRegionId}
            />
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
