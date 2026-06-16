import type { ProjectSheetQuestionData } from '@/server/project-sheets/queries';

const STEP_TOOLTIPS = {
  diagnosis: 'Ce sujet peut être abordé dans TACCT Diagnostiquer les impacts',
  strategy: 'Ce sujet peut être abordé dans TACCT Construire des stratégies',
  review: 'Ce sujet peut être abordé dans TACCT Évaluer les actions',
} as const;

function groupByThematic(
  questions: ProjectSheetQuestionData[],
): [string, ProjectSheetQuestionData[]][] {
  const groups = new Map<string, ProjectSheetQuestionData[]>();
  for (const question of questions) {
    const list = groups.get(question.thematic);
    if (list) list.push(question);
    else groups.set(question.thematic, [question]);
  }
  // Tri alphabétique des thématiques (comportement du pipe Angular `keyvalue`).
  return [...groups.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

export function ProjectSheetQuestions({
  questions,
}: {
  questions: ProjectSheetQuestionData[];
}) {
  if (questions.length === 0) return null;
  const thematics = groupByThematic(questions);

  return (
    <section className="sc-project-sheet-questions">
      <h2 className="c-project-sheet-section-title">Quelles questions se poser ?</h2>
      {thematics.map(([thematic, thematicQuestions]) => (
        <div key={thematic}>
          <div className="sc-project-sheet-questions__thematic-bloc">
            <h3 className="sc-project-sheet-questions__thematic">
              {thematic === 'non référencé' ? '' : thematic}
            </h3>
            <p className="sc-project-sheet-questions__thematic-legend">Etapes TACCT</p>
          </div>
          {thematicQuestions.map((question) => (
            <div key={question.id} className="sc-project-sheet-questions__question-bloc">
              <p
                className={`sc-project-sheet-questions__question${question.highlighted ? ' txt-bold' : ''}`}
              >
                {question.name}
              </p>
              <div className="sc-project-sheet-questions__steps">
                {question.diagnosis ? (
                  <div
                    className="sc-project-sheet-questions__step1"
                    title={STEP_TOOLTIPS.diagnosis}
                  >
                    <span className="c-icon eye default-secondary" />
                  </div>
                ) : (
                  <div className="sc-project-sheet-questions__step" />
                )}
                {question.strategy ? (
                  <div
                    className="sc-project-sheet-questions__step2"
                    title={STEP_TOOLTIPS.strategy}
                  >
                    <span className="c-icon settings default-secondary" />
                  </div>
                ) : (
                  <div className="sc-project-sheet-questions__step" />
                )}
                {question.review ? (
                  <div
                    className="sc-project-sheet-questions__step3"
                    title={STEP_TOOLTIPS.review}
                  >
                    <span className="c-icon check default-secondary" />
                  </div>
                ) : (
                  <div className="sc-project-sheet-questions__step" />
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
