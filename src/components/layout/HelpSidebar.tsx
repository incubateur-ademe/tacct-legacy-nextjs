'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type HelpPage = {
  id: string;
  name: string;
  rank: number;
  page_type: string;
  content: string | null;
  slug: string | null;
};

/**
 * Port de `app-help` du legacy (côté client pour rendre les items cliquables).
 *
 * Les items des sections `goal`, `step` et `resource` ouvrent une modale
 * affichant le contenu HTML de la page sélectionnée. La modale est un overlay
 * React contrôlé, rendu via portal sur `document.body` (et non un `<dialog>`
 * natif) pour être fiable quel que soit le contexte de mise en page des
 * ancêtres (transform, overflow…).
 */
export function HelpSidebar({ pageInfoTitle, pages }: { pageInfoTitle: string; pages: HelpPage[] }) {
  const [selected, setSelected] = useState<HelpPage | null>(null);
  const [mounted, setMounted] = useState(false);

  const intro = pages.filter((p) => p.page_type === 'intro')[0] ?? null;
  const goals = pages.filter((p) => p.page_type === 'goal');
  const steps = pages.filter((p) => p.page_type === 'step');
  const resources = pages.filter((p) => p.page_type === 'resource');

  // Navigation précédent/suivant parmi les pages (hors intro), triées par rang —
  // équivalent des boutons prevPage/nextPage du legacy page-info.
  const orderedPages = pages
    .filter((p) => p.page_type !== 'intro')
    .sort((a, b) => a.rank - b.rank);
  const selectedIndex = selected
    ? orderedPages.findIndex((p) => p.id === selected.id)
    : -1;
  const prevPage = selectedIndex > 0 ? orderedPages[selectedIndex - 1] : null;
  const nextPage =
    selectedIndex !== -1 && selectedIndex < orderedPages.length - 1
      ? orderedPages[selectedIndex + 1]
      : null;

  const open = (page: HelpPage) => setSelected(page);
  const close = () => setSelected(null);

  useEffect(() => setMounted(true), []);

  // Verrouille le scroll de fond + fermeture à Échap quand la modale est ouverte.
  useEffect(() => {
    if (!selected) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [selected]);

  return (
    <aside className="col-lg-3">
      <div className="c-title-h2 ml-2">AIDE</div>

      {intro && (
        <div className="sc-help-section">
          <div className="container">
            <p>{intro.content}</p>
          </div>
        </div>
      )}

      {goals.length > 0 && (
        <ItemSection title="Présentation" icon="search" items={goals} onSelect={open} />
      )}
      {steps.length > 0 && (
        <ItemSection
          title={steps.length > 1 ? 'Etapes' : 'Etape'}
          icon="project"
          items={steps}
          ordered
          onSelect={open}
        />
      )}
      {resources.length > 0 && (
        <ItemSection
          title={resources.length > 1 ? 'Ressources' : 'Ressource'}
          icon="resource"
          items={resources}
          onSelect={open}
        />
      )}

      {mounted &&
        selected &&
        createPortal(
          <div
            className="sc-help-overlay"
            role="presentation"
            onClick={close}
          >
            <div
              className="sc-help-modal-box"
              role="dialog"
              aria-modal="true"
              aria-labelledby="sc-help-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête : icône + sous-titre/titre à gauche, bouton fermer à droite
                  (port de l'app-block-title-icon + bouton "cancel" du legacy page-info). */}
              <div className="sc-help-modal__header">
                <div className="sc-block-title-icon-lower">
                  <span className="sc-block-title-icon__icon">
                    <em
                      className="c-icon project-primary-secondary large exposition-future"
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <h2 className="c-subtitle">{pageInfoTitle}</h2>
                    <h3
                      id="sc-help-modal-title"
                      className="p-bold-primary sc-block-title-icon__title"
                    >
                      {selected.page_type === 'intro'
                        ? 'Que faire sur cet écran ?'
                        : `${selected.rank}. ${selected.name}`}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Fermer"
                  className="sc-help-modal__close project-link"
                  onClick={close}
                >
                  <em className="c-icon cancel xl project-primary" aria-hidden="true" />
                </button>
              </div>

              <div className="sc-help-modal__content">
                {selected.content && (
                  <div dangerouslySetInnerHTML={{ __html: selected.content }} />
                )}
              </div>

              {(prevPage || nextPage) && (
                <div className="sc-help-modal__nav">
                  {prevPage ? (
                    <button
                      type="button"
                      className="c-legend-action-bold text-uppercase sc-help-modal__nav-item"
                      onClick={() => open(prevPage)}
                    >
                      {prevPage.rank}. {prevPage.name}
                    </button>
                  ) : (
                    <span />
                  )}
                  {nextPage && (
                    <button
                      type="button"
                      className="c-legend-action-bold text-uppercase sc-help-modal__nav-item"
                      onClick={() => open(nextPage)}
                    >
                      {nextPage.rank}. {nextPage.name}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </aside>
  );
}

function ItemSection({
  title,
  icon,
  items,
  ordered = false,
  onSelect,
}: {
  title: string;
  icon: string;
  items: HelpPage[];
  ordered?: boolean;
  onSelect: (page: HelpPage) => void;
}) {
  const ListTag = ordered ? 'ol' : 'ul';
  return (
    <div className="sc-help-section">
      <div className="d-flex align-items-center">
        <em
          className={`c-icon medium ${icon} project-primary-secondary mr-2`}
          aria-hidden="true"
        />
        <span className="c-legend mb-0">{title}</span>
      </div>
      <div className="container">
        <ListTag>
          {items.map((item) => (
            <li key={item.id} className="c-legend-action">
              <button
                type="button"
                className="text-left c-legend-action mb-0 sc-help-section__item"
                onClick={() => onSelect(item)}
                id={item.slug ?? undefined}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ListTag>
      </div>
    </div>
  );
}
