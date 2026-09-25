import { useLocation, useNavigate } from 'react-router-dom';

// Espace « Activité » (ex-« Entraînement ») : activité, séances et exercices
// réunis (décisions UX des 24-25/09/2026) — on construit sa bibliothèque d'exercices, on compose
// autant de séances qu'on veut, puis on note ce qu'on a fait tel jour (une
// séance ou une activité libre).
const TABS = [
  { path: '/activity', label: 'Mon activité' },
  { path: '/sessions', label: 'Séances' },
  { path: '/exercises', label: 'Exercices' },
];

export function TrainingTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <div className="training-header">
      <h2>Activité</h2>
      <div className="section-tabs" role="tablist" aria-label="Activité">
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
