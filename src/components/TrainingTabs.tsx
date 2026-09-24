import { useLocation, useNavigate } from 'react-router-dom';

// Espace « Entraînement » : Séances et Exercices réunis (décision UX du
// 24/09/2026) — on construit sa bibliothèque d'exercices, puis on compose
// autant de séances qu'on veut avec.
const TABS = [
  { path: '/sessions', label: 'Séances' },
  { path: '/exercises', label: 'Exercices' },
];

export function TrainingTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <div className="training-header">
      <h2>Entraînement</h2>
      <div className="section-tabs" role="tablist" aria-label="Entraînement">
        {TABS.map((t) => (
          <button
            key={t.path}
            type="button"
            role="tab"
            aria-selected={pathname.startsWith(t.path)}
            className={`tag-chip${pathname.startsWith(t.path) ? ' selected' : ''}`}
            onClick={() => navigate(t.path)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
