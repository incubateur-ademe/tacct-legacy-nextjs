import type { Resource } from '@/server/project-sheets/parse';

export function ProjectSheetRessources({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) return null;

  return (
    <section className="sc-project-sheet-ressource">
      <h2 className="c-project-sheet-section-title">Ressources complémentaires</h2>
      <ul>
        {resources.map((resource, index) => (
          <li key={index} className="sc-project-sheet-ressource__list-item">
            {resource.url ? (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`${resource.name} - nouvel onglet`}
              >
                {resource.name}
              </a>
            ) : (
              <span>{resource.name}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
