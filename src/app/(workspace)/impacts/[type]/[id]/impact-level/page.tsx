import { notFound } from 'next/navigation';
import { getImpactOwner, type OwnerType } from '@/server/strategies/impact-queries';
import { saveImpactLevel } from '@/server/strategies/impact-actions';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { BlockTitleIcon } from '@/components/ui/BlockTitleIcon';

export const dynamic = 'force-dynamic';

type Params = Promise<{ type: string; id: string }>;

const LEVELS = [1, 2, 3] as const;
const INFO_CLASS: Record<number, string> = {
  1: 'sc-impact-level__lvl-info--fc',
  2: 'sc-impact-level__lvl-info--sc',
  3: 'sc-impact-level__lvl-info--tc',
};

export default async function ImpactLevelPage({ params }: { params: Params }) {
  const { type, id } = await params;
  if (type !== 'impact' && type !== 'strategy') notFound();
  const ownerType = type as OwnerType;
  const owner = await getImpactOwner(ownerType, id);
  if (!owner) notFound();

  const level = owner.impactLevel;
  const saveAction = saveImpactLevel.bind(null, ownerType, id);

  const description = (n: number) =>
    (level as Record<string, string> | null)?.[`description${n}`] ?? '';
  const finalite = (n: number) =>
    (level as Record<string, string> | null)?.[`finalite${n}`] ?? '';
  const seuil = (n: number) =>
    (level as Record<string, string> | null)?.[`seuil${n}`] ?? '';

  return (
    <ContentLayout helpKey="impact-level">
      <div className="sc-impact-level">
        <div className="o-card u-margin__bottom--m">
          <div className="row">
            <BlockTitleIcon
              pageTitle="Niveaux d'impact"
              subtitle={owner.title}
              icon={owner.thematicIcon ?? 'suspended'}
            />
          </div>
        </div>

        <form className="o-card" action={saveAction}>
          <div className="c-input__group col-sm-16 w-100 u-margin__bottom--m">
            <input
              className="c-input__large"
              type="text"
              id="indicateur"
              name="indicateurSuivi"
              maxLength={500}
              defaultValue={level?.indicateur_suivi ?? ''}
            />
            <label className="c-input__label" htmlFor="indicateur">
              Indicateur de suivi
            </label>
            <div className="c-required">* requis</div>
          </div>

          {LEVELS.map((lvl, index) => (
            <div className="row sc-impact-level__lvl" key={lvl}>
              <div className="sc-impact-level__lvl-bloc">
                <div className={`sc-impact-level__lvl-info ${INFO_CLASS[lvl]}`}>
                  <div className="sc-impact-level__lvl-number">{lvl}</div>
                </div>
                <div className="sc-impact-level__lvl-impact">
                  <span className="sc-impact-level__lvl-title">Niveau d&apos;impact {lvl}</span>
                  <div className="row">
                    <div className="c-input__group col-sm-16 w-50">
                      <textarea
                        className="c-input__large"
                        id={`description-${lvl}`}
                        name={`description${lvl}`}
                        maxLength={500}
                        defaultValue={description(lvl)}
                      />
                      <label className="c-input__label" htmlFor={`description-${lvl}`}>
                        Description
                      </label>
                      <div className="c-required">* requis</div>
                    </div>

                    <div className="c-input__group col-sm-16 w-50">
                      <textarea
                        className="c-input__large"
                        id={`finalite-${lvl}`}
                        name={`finalite${lvl}`}
                        maxLength={500}
                        defaultValue={finalite(lvl)}
                      />
                      <label className="c-input__label" htmlFor={`finalite-${lvl}`}>
                        Finalité
                      </label>
                      <div className="c-required">* requis</div>
                    </div>
                  </div>
                </div>
              </div>

              {index < LEVELS.length - 1 && (
                <div className="sc-impact-level__lvl-seuil">
                  <div className="c-input__group col-sm-16 w-100">
                    <input
                      className="c-input__large"
                      type="text"
                      id={`seuil-${lvl}`}
                      name={`seuil${lvl}`}
                      maxLength={500}
                      defaultValue={seuil(lvl)}
                    />
                    <label className="c-input__label" htmlFor={`seuil-${lvl}`}>
                      Seuil {lvl} -&gt; {lvl + 1}
                    </label>
                    <div className="c-required">* requis</div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="c-group-buttons c-group-buttons--end">
            <button type="submit" className="c-btn--primary">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </ContentLayout>
  );
}
