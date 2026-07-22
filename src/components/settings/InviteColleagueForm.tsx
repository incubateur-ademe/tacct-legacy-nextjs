'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { inviteColleague } from '@/server/profile/actions';

/**
 * Form « Inviter un(e) collègue » (ex-section « Bureau d'étude » du legacy).
 *
 * Un seul champ Adresse mail + bouton INVITER. Le compte cible doit exister,
 * comme pour le transfert d'étude.
 */
export function InviteColleagueForm({ studyId }: { studyId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('studyId', studyId);
    const form = e.currentTarget;
    startTransition(async () => {
      try {
        const result = await inviteColleague(fd);
        if (result.status === 'invited') {
          setMessage('Invitation envoyée.');
          form.reset();
          router.refresh();
        } else if (result.status === 'already_member') {
          setMessage('Cette personne participe déjà à cette étude.');
        } else {
          setMessage(
            "Cette personne n'a pas encore de compte sur notre service, vous pourrez l'inviter quand ce sera le cas",
          );
        }
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Erreur lors de l'invitation");
      }
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="row">
        <div className="c-input__group col-lg-4 col-md-6 col-sm-16 input-size-medium d-block">
          <input className="c-input pr-5" type="email" name="mail" required />
          <label className="c-input__label">Adresse mail</label>
        </div>

        <em
          className="c-icon medium empty large mail input-icon c-input__icone-mail"
          aria-hidden="true"
        />

        <button
          type="submit"
          className="c-input__setting c-input__inviter"
          disabled={pending}
        >
          INVITER
        </button>
      </div>
      {message && <div className="c-subtitle-grey mt-2">{message}</div>}
    </form>
  );
}
