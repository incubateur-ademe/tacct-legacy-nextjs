import { fileUrl } from '@/lib/files';
import type { ProjectSheetDetailData } from '@/server/project-sheets/queries';

export function ProjectSheetIntroBloc({ sheet }: { sheet: ProjectSheetDetailData }) {
  const image = fileUrl(sheet.imageFileName);

  return (
    <section className="sc-project-sheet-intro-bloc">
      <h1>{sheet.name}</h1>
      <div className="sc-project-sheet-intro-bloc__main-bloc">
        <div className="sc-project-sheet-intro-bloc__left">
          <p className="sc-project-sheet-intro-bloc__abstract">{sheet.abstract}</p>
          <div className="sc-project-sheet-into-bloc__image-group">
            {image && (
              <img
                className="sc-project-sheet-intro-bloc__image"
                src={image}
                alt={sheet.imageAlt ?? ''}
                loading="lazy"
              />
            )}
            {sheet.imageCredit && (
              <p className="sc-project-sheet-intro-bloc__image-credit">
                &copy; {sheet.imageCredit}
              </p>
            )}
          </div>
        </div>
        <div className="sc-project-sheet-intro-bloc__right">
          {sheet.domain && (
            <div className="sc-project-sheet-intro-bloc__domain-bloc">
              <span
                className={`c-icon project-primary large ${sheet.domain.icon} mb-3`}
                aria-hidden="true"
              />
              <dl className="sc-project-sheet-intro-bloc__domain-text mb-0">
                <dt>Domaine d&rsquo;activité</dt>
                <dd>{sheet.domain.name}</dd>
              </dl>
            </div>
          )}
          <dl className="sc-project-sheet-intro-bloc__type-bloc mb-0">
            {sheet.activityTypeName && (
              <>
                <dt>Thème</dt>
                <dd>{sheet.activityTypeName}</dd>
              </>
            )}
            {sheet.areaTypeName && (
              <>
                <dt>Type d&apos;espaces</dt>
                <dd>{sheet.areaTypeName}</dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </section>
  );
}
