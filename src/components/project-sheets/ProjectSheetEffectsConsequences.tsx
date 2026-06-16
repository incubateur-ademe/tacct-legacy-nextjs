export function ProjectSheetEffectsConsequences({
  effects,
  consequences,
}: {
  effects: string[];
  consequences: string[];
}) {
  if (effects.length === 0 && consequences.length === 0) return null;

  return (
    <section className="sc-project-sheet-effects-consequences">
      <div className="sc-project-sheet-effects-consequences__section container">
        {effects.length > 0 && (
          <div className="sc-project-sheet-effects-consequences__half-section">
            <h2 className="c-project-sheet-section-title">
              Effets attendus du changement climatique
            </h2>
            <ul className="sc-project-sheet-effects-consequences__section-list">
              {effects.map((effect, index) => (
                <li key={index}>{effect}</li>
              ))}
            </ul>
          </div>
        )}
        {consequences.length > 0 && (
          <div className="sc-project-sheet-effects-consequences__half-section">
            <h2 className="c-project-sheet-section-title">Conséquences possibles</h2>
            <ul className="sc-project-sheet-effects-consequences__section-list">
              {consequences.map((consequence, index) => (
                <li key={index}>{consequence}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
