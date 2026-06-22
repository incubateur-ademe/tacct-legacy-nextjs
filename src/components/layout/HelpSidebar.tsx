'use client';

import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { deleteHelpPage, saveHelpIntro, saveHelpPage } from '@/server/help/actions';

export type HelpPage = {
  id: string;
  name: string;
  rank: number;
  page_type: string;
  content: string | null;
  slug: string | null;
};

/**
 * Port de `app-help` + `app-page-info` du legacy. Lecture pour tous ; édition
 * (titre + WYSIWYG + slug), suppression et édition de l'intro réservées aux
 * admins, à l'identique de `page-info.component`.
 */
export function HelpSidebar({
  pageInfoTitle,
  pageInfoId,
  pages,
  isAdmin = false,
}: {
  pageInfoTitle: string;
  pageInfoId: string;
  pages: HelpPage[];
  isAdmin?: boolean;
}) {
  const [selected, setSelected] = useState<HelpPage | null>(null);
  const [editing, setEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();

  // Champs d'édition d'une page.
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formContent, setFormContent] = useState('');

  // Édition de l'intro.
  const [introEditing, setIntroEditing] = useState(false);
  const [introContent, setIntroContent] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(false);

  const intro = pages.filter((p) => p.page_type === 'intro')[0] ?? null;
  const goals = pages.filter((p) => p.page_type === 'goal');
  const steps = pages.filter((p) => p.page_type === 'step');
  const resources = pages.filter((p) => p.page_type === 'resource');

  // Navigation scopée à la section (page_type) de la page ouverte, dans l'ordre
  // du menu (rank asc) — fidèle au legacy `setCurrentStepAction`/`setPage` qui
  // filtrent `pages` sur `currentPage.pageType`. (Avant : tri global tous types
  // confondus, d'où des sauts vers des modales d'autres sections.)
  const sectionPages = selected
    ? pages.filter((p) => p.page_type === selected.page_type).sort((a, b) => a.rank - b.rank)
    : [];
  const selectedIndex = selected ? sectionPages.findIndex((p) => p.id === selected.id) : -1;
  const prevPage = selectedIndex > 0 ? sectionPages[selectedIndex - 1] : null;
  const nextPage =
    selectedIndex !== -1 && selectedIndex < sectionPages.length - 1
      ? sectionPages[selectedIndex + 1]
      : null;

  const open = (page: HelpPage) => {
    setSelected(page);
    setEditing(false);
  };
  const close = () => {
    setSelected(null);
    setEditing(false);
  };

  const startEdit = () => {
    if (!selected) return;
    setFormTitle(selected.name);
    setFormSlug(selected.slug ?? '');
    setFormContent(selected.content ?? '');
    setEditing(true);
  };

  const submitPage = () => {
    if (!selected) return;
    const formData = new FormData();
    formData.set('id', selected.id);
    formData.set('title', formTitle);
    formData.set('slug', formSlug);
    formData.set('content', formContent);
    startTransition(async () => {
      await saveHelpPage(formData);
      close();
    });
  };

  const confirmDeletePage = () => {
    if (!selected) return;
    const id = selected.id;
    startTransition(async () => {
      await deleteHelpPage(id);
      setConfirmDelete(false);
      close();
    });
  };

  const startIntroEdit = () => {
    setIntroContent(intro?.content ?? '');
    setIntroEditing(true);
  };

  const submitIntro = () => {
    const formData = new FormData();
    formData.set('pageInfoId', pageInfoId);
    formData.set('introId', intro?.id ?? '');
    formData.set('content', introContent);
    startTransition(async () => {
      await saveHelpIntro(formData);
      setIntroEditing(false);
    });
  };

  useEffect(() => setMounted(true), []);

  // Verrouille le scroll de fond + fermeture à Échap quand une modale est ouverte.
  useEffect(() => {
    const modalOpen = Boolean(selected) || introEditing;
    if (!modalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (introEditing) setIntroEditing(false);
        else close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [selected, introEditing]);

  return (
    <aside className="col-lg-3">
      <div className="d-flex align-items-center justify-content-between">
        <div className="c-title-h2 ml-2">AIDE</div>
        {isAdmin && (
          <button
            type="button"
            aria-label="Modifier l'intro"
            className="sc-help-section__edit"
            onClick={startIntroEdit}
          >
            <em className="c-icon pen large project-primary" aria-hidden="true" />
          </button>
        )}
      </div>

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
          <div className="sc-help-overlay" role="presentation" onClick={close}>
            <div
              className="sc-help-modal-box"
              role="dialog"
              aria-modal="true"
              aria-labelledby="sc-help-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
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
                <div className="d-flex">
                  {isAdmin && !editing && selected.page_type !== 'intro' && (
                    <button
                      type="button"
                      aria-label="Modifier"
                      className="sc-help-modal__close mr-2"
                      onClick={startEdit}
                    >
                      <em className="c-icon pen xl project-primary" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Fermer"
                    className="sc-help-modal__close project-link"
                    onClick={close}
                  >
                    <em className="c-icon cancel xl project-primary" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {editing ? (
                <div className="sc-help-modal__content">
                  <div className="c-input__group w-100">
                    <input
                      className="c-input__large w-100"
                      type="text"
                      id="help-title"
                      placeholder="Titre"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                    <label className="c-input__label" htmlFor="help-title">
                      Titre
                    </label>
                  </div>
                  <RichTextEditor value={formContent} onChange={setFormContent} />
                  <div className="c-input__group w-100 mt-3">
                    <input
                      className="c-input__large w-100"
                      type="text"
                      id="help-slug"
                      placeholder="Id de marquage"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                    />
                    <label className="c-input__label" htmlFor="help-slug">
                      Id de marquage
                    </label>
                  </div>
                  <div className="text-right mt-3">
                    <button
                      type="button"
                      className="c-btn--primary mb-3"
                      onClick={submitPage}
                      disabled={pending || formTitle.trim().length === 0}
                    >
                      ENREGISTRER
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="sc-help-modal__content">
                    {selected.content && (
                      <div dangerouslySetInnerHTML={{ __html: selected.content }} />
                    )}
                  </div>

                  {isAdmin && selected.page_type !== 'intro' && (
                    <div className="text-right mt-3">
                      <button
                        type="button"
                        className="c-btn--secondary mb-3"
                        onClick={() => setConfirmDelete(true)}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}

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
                </>
              )}
            </div>
          </div>,
          document.body,
        )}

      {mounted &&
        introEditing &&
        createPortal(
          <div
            className="sc-help-overlay"
            role="presentation"
            onClick={() => setIntroEditing(false)}
          >
            <div
              className="sc-help-modal-box"
              role="dialog"
              aria-modal="true"
              aria-label="Édition de l'intro"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sc-help-modal__header">
                <h3 className="p-bold-primary sc-block-title-icon__title">
                  Que faire sur cet écran ?
                </h3>
                <button
                  type="button"
                  aria-label="Fermer"
                  className="sc-help-modal__close project-link"
                  onClick={() => setIntroEditing(false)}
                >
                  <em className="c-icon cancel xl project-primary" aria-hidden="true" />
                </button>
              </div>
              <div className="sc-help-modal__content">
                <div className="c-input__group w-100">
                  <textarea
                    className="c-input__large w-100"
                    placeholder="Texte d'explication de la page en cours de lecture"
                    maxLength={1000}
                    rows={4}
                    id="help-intro"
                    value={introContent}
                    onChange={(e) => setIntroContent(e.target.value)}
                  />
                  <label className="c-input__label" htmlFor="help-intro">
                    Description
                  </label>
                </div>
                <div className="text-right mt-3">
                  <button
                    type="button"
                    className="c-btn--primary mb-3"
                    onClick={submitIntro}
                    disabled={pending}
                  >
                    ENREGISTRER
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <ConfirmModal
        open={confirmDelete}
        title={selected?.name ?? ''}
        confirmLabel="Oui"
        cancelLabel="Non"
        pending={pending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={confirmDeletePage}
      >
        <p>Confirmez-vous la suppression de la page ?</p>
      </ConfirmModal>
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
