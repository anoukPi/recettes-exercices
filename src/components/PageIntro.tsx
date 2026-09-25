import { useState, type ReactNode } from 'react';

const KEY_PREFIX = 'kaly-intro-vue:';

function alreadySeen(id: string): boolean {
  try {
    return localStorage.getItem(KEY_PREFIX + id) === '1';
  } catch {
    return false;
  }
}

/** Encadré « à quoi sert cette page » : affiché à la première visite, fermé
 * d'un « Compris », puis rouvrable via un petit lien ⓘ. Mémorisé sur
 * l'appareil. */
export function PageIntro({ id, emoji, title, children }: { id: string; emoji: string; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(() => !alreadySeen(id));

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY_PREFIX + id, '1');
    } catch {
      // confort seulement
    }
  };

  if (!open) {
    return (
      <button type="button" className="page-intro-reopen" onClick={() => setOpen(true)}>
        ⓘ À quoi sert cette page ?
      </button>
    );
  }

  return (
    <aside className="page-intro" aria-label={title}>
      <p className="page-intro-title">
        <span aria-hidden="true">{emoji}</span> {title}
      </p>
      <div className="page-intro-body">{children}</div>
      <button type="button" className="page-intro-ok" onClick={close}>
        Compris
      </button>
    </aside>
  );
}
