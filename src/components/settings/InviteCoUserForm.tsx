'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { inviteCoUserToStudy } from '@/server/profile/actions';

/**
 * Form « Bureau d'étude » : invite un co-utilisateur sur l'étude par email.
 * Port du `sendInviteMail` legacy. Pour V1 le user cible doit exister en base
 * (l'envoi d'email d'invitation côté next sera branché ultérieurement).
 */
export function InviteCoUserForm({ studyId }: { studyId: string }) {
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
        await inviteCoUserToStudy(fd);
        setMessage('Email envoyé.');
        form.reset();
        router.refresh();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Erreur lors de l’invitation');
      }
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="row">
        <div className="c-input__group col-lg-4 col-md-6 col-sm-16 input-size-medium">
          <input className="c-input pr-5" type="email" name="email" required />
          <label className="c-input__label">Adresse mail</label>
        </div>
        <em
          className="c-icon medium empty large mail input-icon c-input__icone-mail"
          aria-hidden="true"
        />
        <button type="submit" className="c-input__setting" disabled={pending}>
          INVITER
        </button>
      </div>
      {message && <div className="c-subtitle-grey mt-2">{message}</div>}
    </form>
  );
}
