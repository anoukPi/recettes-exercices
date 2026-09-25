import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getLastFitnessTestDate } from '../api/fitnessTests';
import { useSession } from '../lib/auth';
import { TEST_REMINDER_DAYS } from '../lib/fitnessTestCatalog';

// Rappel mensuel des tests (demande d'Anouk, 25/09/2026) : fenêtre à
// l'ouverture de l'app si le dernier test date de plus d'un mois. « Plus
// tard » la repousse de quelques jours (mémorisé sur cet appareil).
const SNOOZE_KEY = 'kaly-test-reminder-snooze-until';
const SNOOZE_DAYS = 3;
const DAY_MS = 24 * 3600 * 1000;

function snoozedUntil(): number {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY) ?? 0);
  } catch {
    return 0;
  }
}

export function MonthlyTestReminder() {
  const { session } = useSession();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [lastDate, setLastDate] = useState<string | null | undefined>(undefined);
  const [dismissed, setDismissed] = useState(false);
  // Heure lue une fois à l'ouverture : suffit pour un rappel au jour près.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!session) return;
    getLastFitnessTestDate()
      .then(setLastDate)
      .catch(() => setLastDate(undefined));
  }, [session]);

  if (!session || lastDate === undefined || dismissed || pathname.startsWith('/tests')) return null;
  if (now < snoozedUntil()) return null;
  const daysSince = lastDate ? Math.floor((now - new Date(`${lastDate}T12:00:00`).getTime()) / DAY_MS) : null;
  if (daysSince !== null && daysSince < TEST_REMINDER_DAYS) return null;

  const later = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * DAY_MS));
    } catch {
      // Stockage indisponible : la fenêtre reviendra à la prochaine ouverture.
    }
    setDismissed(true);
  };

  return (
    <div className="sheet-backdrop" onClick={later}>
      <div
        className="sheet test-reminder"
        role="dialog"
        aria-modal="true"
        aria-labelledby="test-reminder-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <h3 id="test-reminder-title">C'est l'heure de ton bilan du mois 💪</h3>
        <p>
          {daysSince === null
            ? "Tu n'as encore fait aucun test. Prends 15 minutes pour tes mesures et quelques tests de force, souplesse et endurance : ce sera ton point de départ."
            : `Ton dernier test date d'il y a ${daysSince} jours. Prends 15 minutes pour tes mesures et tes tests : c'est ce qui rend tes progrès visibles.`}
        </p>
        <div className="account-delete-actions">
          <button
            type="button"
            className="primary-dark"
            onClick={() => {
              setDismissed(true);
              navigate('/tests');
            }}
          >
            Faire mes tests
          </button>
          <button type="button" className="link-button" onClick={later}>
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
