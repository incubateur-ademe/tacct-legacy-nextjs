import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicProjectSheetBySlug } from '@/server/project-sheets/queries';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

export default async function ProjectSheetDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const sheet = await getPublicProjectSheetBySlug(slug);
  if (!sheet) notFound();

  // Resources : peut être en JSON string ou texte libre
  const parsedResources = parseResources(sheet.resources);

  // Questions groupées par thématique
  const groupedQuestions = sheet.project_sheet_question.reduce<
    Record<string, typeof sheet.project_sheet_question>
  >((acc, q) => {
    const key = q.thematic || 'Autres';
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(q);
    return acc;
  }, {});

  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col-lg-12">
          <Link href="/project-sheets" className="c-btn--tertiary">
            ← Retour aux fiches
          </Link>
        </div>
      </div>

      {/* En-tête */}
      <div className="o-card mb-4">
        <h1 className="c-title-black-bold m-0">{sheet.name}</h1>
        <div className="c-subtitle-grey mt-2">
          {sheet.domain?.name && (
            <>
              {sheet.domain.icon && (
                <em
                  className={`c-icon project-primary small ${sheet.domain.icon} mr-1`}
                  aria-hidden="true"
                />
              )}
              {sheet.domain.name}
              {' • '}
            </>
          )}
          {sheet.area_type && `Territoire : ${sheet.area_type}`}
          {sheet.activity_type && ` • Activité : ${sheet.activity_type}`}
        </div>
        <p className="mt-3 mb-0">{sheet.abstract}</p>
      </div>

      {/* Effets / conséquences */}
      <div className="row">
        {sheet.expected_effects && (
          <div className="col-md-6 mb-4">
            <div className="o-card h-100">
              <h2 className="c-subtitle-black-bold">Effets attendus</h2>
              <div className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>
                {sheet.expected_effects}
              </div>
            </div>
          </div>
        )}
        {sheet.consequences && (
          <div className="col-md-6 mb-4">
            <div className="o-card h-100">
              <h2 className="c-subtitle-black-bold">Conséquences</h2>
              <div className="mt-2" style={{ whiteSpace: 'pre-wrap' }}>
                {sheet.consequences}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Questions */}
      {sheet.project_sheet_question.length > 0 && (
        <div className="o-card mb-4">
          <h2 className="c-subtitle-black-bold">Questions à se poser</h2>
          {Object.entries(groupedQuestions).map(([thematic, questions]) => (
            <div key={thematic} className="mt-3">
              <h3 className="c-subtitle-grey">{thematic}</h3>
              <ul className="mt-2">
                {questions.map((q) => (
                  <li key={q.id}>
                    <strong>{q.name}</strong>
                    <span className="ms-2 c-subtitle-grey">
                      {[
                        q.diagnosis && 'Diagnostic',
                        q.strategy && 'Stratégie',
                        q.review && 'Évaluation',
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                      {q.highlighted && (
                        <span className="badge bg-info ms-2">À la une</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Ressources */}
      {parsedResources.length > 0 && (
        <div className="o-card mb-4">
          <h2 className="c-subtitle-black-bold">Ressources</h2>
          <ul className="mt-2">
            {parsedResources.map((r, i) => (
              <li key={i}>
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer">
                    {r.name || r.url}
                  </a>
                ) : (
                  r.name
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Image credit (sans image affichée pour l'instant) */}
      {(sheet.image_alt || sheet.image_credit) && (
        <div className="c-subtitle-grey">
          {sheet.image_alt && <div>{sheet.image_alt}</div>}
          {sheet.image_credit && (
            <div>
              <em>Crédit : {sheet.image_credit}</em>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function parseResources(raw: string | null): { name: string; url?: string }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
        .map((r) => ({
          name: typeof r.url_name === 'string' ? r.url_name : typeof r.name === 'string' ? r.name : '',
          url: typeof r.url === 'string' ? r.url : undefined,
        }));
    }
  } catch {
    // pas du JSON → on découpe par ligne
  }
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // Format "name|url" ou juste un nom
      const [name, url] = line.split('|').map((s) => s.trim());
      return { name: name ?? '', url };
    });
}
