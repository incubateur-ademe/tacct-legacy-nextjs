import type { ProjectSheetCardData } from '@/server/project-sheets/queries';
import { ProjectSheetCard } from './ProjectSheetCard';

export function ProjectSheetRelatedItems({
  sheets,
}: {
  sheets: ProjectSheetCardData[];
}) {
  if (sheets.length === 0) return null;

  return (
    <section className="sc-project-sheet-related-items">
      <h2 className="c-project-sheet-section-title">Retrouvez aussi</h2>
      <div className="sc-project-sheet-related-items__card-list">
        {sheets.map((sheet) => (
          <ProjectSheetCard
            key={sheet.id}
            sheet={sheet}
            className="sc-project-sheet-related-items__card"
          />
        ))}
      </div>
    </section>
  );
}
