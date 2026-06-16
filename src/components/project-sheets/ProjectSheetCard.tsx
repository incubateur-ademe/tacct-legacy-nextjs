import Link from 'next/link';
import { fileUrl } from '@/lib/files';
import type { ProjectSheetCardData } from '@/server/project-sheets/queries';

const ABSTRACT_LENGTH = 100;

function truncateAbstract(abstract: string): string {
  if (abstract.length <= ABSTRACT_LENGTH) return abstract;
  const head = abstract.substring(0, ABSTRACT_LENGTH);
  const lastSpace = head.lastIndexOf(' ');
  return `${lastSpace > 0 ? head.substring(0, lastSpace) : head}...`;
}

export function ProjectSheetCard({
  sheet,
  className,
}: {
  sheet: ProjectSheetCardData;
  className?: string;
}) {
  const image = fileUrl(sheet.imageFileName);

  return (
    <article className={`sc-project-sheets-card${className ? ` ${className}` : ''}`}>
      {image && (
        <img
          className="sc-project-sheets-card__image"
          src={image}
          alt={sheet.imageAlt ?? ''}
          loading="lazy"
        />
      )}
      <div className="sc-project-sheets-card__text-bloc">
        <h3 className="sc-project-sheets-card__title">{sheet.name}</h3>
        <p className="sc-project-sheets-card__description">
          {truncateAbstract(sheet.abstract)}
        </p>
      </div>
      <Link
        className="sc-project-sheets-card__btn"
        href={`/project-sheets/${sheet.slug}`}
        aria-label={`Voir la fiche ${sheet.name}`}
      >
        <span className="c-icon default-secondary add" aria-hidden="true" />
      </Link>
    </article>
  );
}
