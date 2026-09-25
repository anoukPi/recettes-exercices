import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { hasAnyJournalEntry } from '../api/journal';
import { hasAnyActivityEntry } from '../api/activities';
import { isProfileComplete } from '../lib/dailyNeeds';
import { useProfiles } from '../lib/profileContext';
import type { Profile } from '../types';

const KEY_PREFIX = 'kaly-premiers-pas-ferme:';

function isDismissed(profileId: string): boolean {
  try {
    return localStorage.getItem(KEY_PREFIX + profileId) === '1';
  } catch {
    return false;
  }
}

/** Liste de départ pour une nouvelle venue (par profil) : profil, premier
 * repas, première activité. Disparaît quand tout est fait, ou si on la ferme. */
export function FirstSteps({ profile, isChild }: { profile: Profile | null; isChild: boolean }) {
  const { active } = useProfiles();
  const profileId = active?.id ?? profile?.id ?? 'principal';
  const [dismissed, setDismissed] = useState(() => isDismissed(profileId));
  const [hasMeal, setHasMeal] = useState<boolean | null>(null);
  const [hasActivity, setHasActivity] = useState<boolean | null>(null);

  useEffect(() => {
    if (dismissed) return;
    let cancelled = false;
    Promise.all([hasAnyJournalEntry(), hasAnyActivityEntry()])
      .then(([meal, activity]) => {
        if (cancelled) return;
        setHasMeal(meal);
        setHasActivity(activity);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [dismissed]);

  // Enfant : date de naissance suffit (pas d'objectif calorique à calculer).
  const profileDone = isChild ? !!profile?.birth_date : isProfileComplete(profile);
  const steps = [
    {
      done: profileDone,
      to: '/settings?onglet=profil',
      title: isChild ? 'Vérifie son profil' : 'Complète ton profil',
      text: isChild
        ? 'Date de naissance, taille, poids : pour des repères adaptés à son âge.'
        : 'Taille, poids, activité, objectif : Kaly calcule tes besoins du jour.',
    },
    { done: !!hasMeal, to: '/repas', title: 'Note un premier repas', text: 'Un aliment ou une recette : les calories et macros se calculent seules.' },
    {
      done: !!hasActivity,
      to: '/activity',
      title: 'Note une activité',
      text: isChild
        ? 'Vélo, foot, récré active… repère : au moins 60 minutes par jour.'
        : 'Marche, sport, séance : ton objectif du jour s’ajuste.',
    },
  ];

  if (dismissed || hasMeal === null) return null;
  if (steps.every((s) => s.done)) return null;

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(KEY_PREFIX + profileId, '1');
    } catch {
      // confort seulement
    }
  };

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="block b-blanc first-steps" aria-label="Premiers pas">
      <div className="first-steps-head">
        <h3>👋 Bienvenue ! Tes premiers pas</h3>
        <span className="first-steps-count">
          {doneCount}/{steps.length}
        </span>
      </div>
      <ol>
        {steps.map((s) => (
          <li key={s.to} className={s.done ? 'done' : ''}>
            <span className="first-steps-check" aria-hidden="true">
              {s.done ? '✓' : ''}
            </span>
            <div>
              {s.done ? <strong>{s.title}</strong> : <Link to={s.to}>{s.title} →</Link>}
              <p>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="hint">
        Astuce : le bouton avec ton initiale, en haut, permet d’ajouter les profils de tes enfants ou de ton conjoint.
      </p>
      <button type="button" className="link-button" onClick={close}>
        Masquer
      </button>
    </section>
  );
}
