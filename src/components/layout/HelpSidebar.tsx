'use client';

import { useEffect, useRef, useState } from 'react';

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
 * Les items des sections `goal`, `step` et `resource` ouvrent un dialog
 * affichant le contenu HTML de la page sélectionnée. Le legacy faisait un
 * "page-info take-over" qui remplaçait le router-outlet — ici on utilise une
 * dialog modale qui produit le même résultat pour l'utilisateur (lire le
 * contenu de la page d'aide).
 */
export function HelpSidebar({ pageInfoTitle, pages }: { pageInfoTitle: string; pages: HelpPage[] }) {
  const [selected, setSelected] = useState<HelpPage | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const intro = pages.filter((p) => p.page_type === 'intro')[0] ?? null;
  const goals = pages.filter((p) => p.page_type === 'goal');
  const steps = pages.filter((p) => p.page_type === 'step');
  const resources = pages.filter((p) => p.page_type === 'resource');

  const open = (page: HelpPage) => {
    setSelected(page);
    document.body.style.overflow = 'hidden';
    dialogRef.current?.showModal();
  };

  const close = () => {
    document.body.style.overflow = '';
    dialogRef.current?.close();
    setSelected(null);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const onClose = () => {
      document.body.style.overflow = '';
    };
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, []);

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

      <dialog ref={dialogRef} className="modal-dialog sc-help-modal">
        <div className="modal-content">
          <button
            type="button"
            aria-label="Fermer"
            className="sc-modal__close project-link"
            onClick={close}
          >
            <em className="c-icon close" aria-hidden="true" />
          </button>

          <div className="sc-modal__container">
            <div className="sc-modal__content">
              <div className="sc-modal__content__titles">
                <span className="sc-modal__title-info">{pageInfoTitle}</span>
                <h3>
                  {selected?.page_type === 'intro'
                    ? 'Que faire sur cet écran ?'
                    : selected
                      ? `${selected.rank}. ${selected.name}`
                      : ''}
                </h3>
              </div>

              {selected?.content && (
                <div
                  className="sc-help-modal__content"
                  dangerouslySetInnerHTML={{ __html: selected.content }}
                />
              )}
            </div>
          </div>
        </div>
      </dialog>
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
