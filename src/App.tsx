import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { NavIcon, type NavIconName } from './components/NavIcon';
import { RecipesPage } from './pages/RecipesPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { NewRecipePage } from './pages/NewRecipePage';
import { NewExercisePage } from './pages/NewExercisePage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { ExerciseDetailPage } from './pages/ExerciseDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { JournalPage } from './pages/JournalPage';
import { MealsPage } from './pages/MealsPage';
import { ActivityPage } from './pages/ActivityPage';
import { CyclePage } from './pages/CyclePage';
import { TestsPage } from './pages/TestsPage';
import { BilanPage } from './pages/BilanPage';
import { ComparePage } from './pages/ComparePage';
import { WorkoutSessionsPage } from './pages/WorkoutSessionsPage';
import { NewWorkoutSessionPage } from './pages/NewWorkoutSessionPage';
import { WorkoutSessionDetailPage } from './pages/WorkoutSessionDetailPage';

// Navigation (voir EXPERIENCE.md de l'atelier UX du 24/09/2026) :
// - mobile : barre du bas noire (Carnet, Repas, +, Entraînement, Plus) ;
// - tablette/ordinateur (≥ 900 px) : menu latéral noir avec toutes les pages.
// Séances et Exercices forment un seul espace « Entraînement ».
interface NavItem {
  path: string;
  label: string;
  icon: NavIconName;
  /** Autres préfixes d'URL qui rendent l'élément actif. */
  alsoActiveOn?: string[];
}

const NAV_CARNET: NavItem = { path: '/journal', label: 'Carnet', icon: 'carnet' };
const NAV_REPAS: NavItem = { path: '/repas', label: 'Repas', icon: 'repas' };
const NAV_ENTRAINEMENT: NavItem = {
  path: '/sessions',
  label: 'Entraînement',
  icon: 'entrainement',
  alsoActiveOn: ['/exercises'],
};
const NAV_ACTIVITE: NavItem = { path: '/activity', label: 'Activité', icon: 'activite' };
const NAV_RECETTES: NavItem = { path: '/recipes', label: 'Recettes', icon: 'recettes' };
const NAV_COMPARER: NavItem = { path: '/comparer', label: 'Comparer', icon: 'comparer' };
const NAV_BILAN: NavItem = { path: '/bilan', label: 'Bilan', icon: 'bilan' };
const NAV_CYCLE: NavItem = { path: '/cycle', label: 'Cycle', icon: 'cycle' };
const NAV_TESTS: NavItem = { path: '/tests', label: 'Tests', icon: 'tests' };
const NAV_PARAMETRES: NavItem = { path: '/settings', label: 'Paramètres', icon: 'parametres' };

const SIDEBAR_ITEMS = [
  NAV_CARNET,
  NAV_REPAS,
  NAV_ACTIVITE,
  NAV_ENTRAINEMENT,
  NAV_RECETTES,
  NAV_COMPARER,
  NAV_BILAN,
  NAV_CYCLE,
  NAV_TESTS,
];
// Rangé dans la feuille « Plus » sur mobile.
const MORE_ITEMS = [NAV_RECETTES, NAV_ACTIVITE, NAV_COMPARER, NAV_BILAN, NAV_CYCLE, NAV_TESTS, NAV_PARAMETRES];

// Raccourcis du bouton + (une couleur = un sens, voir DESIGN.md).
const ADD_ACTIONS = [
  { path: '/repas', label: 'Un repas', hint: 'Aliment ou recette', className: 'b-petrole' },
  { path: '/activity', label: 'Une activité', hint: 'Sport, séance', className: 'b-corail' },
  { path: '/journal#hydratation', label: 'De l\'eau', hint: 'Eau, café, thé', className: 'b-eau' },
  { path: '/recipes/new', label: 'Une recette', hint: 'Dans ta bibliothèque', className: '' },
];

function isActive(item: NavItem, pathname: string): boolean {
  return [item.path, ...(item.alsoActiveOn ?? [])].some((p) => pathname.startsWith(p));
}

type OpenSheet = 'add' | 'more' | null;

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function AppNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

  const go = (path: string) => {
    setOpenSheet(null);
    navigate(path);
  };

  const moreActive = MORE_ITEMS.some((item) => isActive(item, pathname));

  return (
    <>
      <aside className="app-sidebar" aria-label="Navigation principale">
        <p className="app-logo">
          Kaly<span>.</span>
        </p>
        <button type="button" className="sidebar-add" onClick={() => setOpenSheet('add')}>
          <NavIcon name="add" /> Ajouter
        </button>
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`sidebar-link${isActive(item, pathname) ? ' active' : ''}`}
            onClick={() => go(item.path)}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </button>
        ))}
        <div className="sidebar-spacer" />
        <button
          type="button"
          className={`sidebar-link${isActive(NAV_PARAMETRES, pathname) ? ' active' : ''}`}
          onClick={() => go(NAV_PARAMETRES.path)}
        >
          <NavIcon name={NAV_PARAMETRES.icon} />
          {NAV_PARAMETRES.label}
        </button>
      </aside>

      <header className="app-topbar">
        <p className="app-logo">
          Kaly<span>.</span>
        </p>
      </header>

      <nav className="app-tabbar" aria-label="Navigation principale">
        {[NAV_CARNET, NAV_REPAS].map((item) => (
          <button
            key={item.path}
            type="button"
            className={`tab-item${isActive(item, pathname) ? ' active' : ''}`}
            onClick={() => go(item.path)}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </button>
        ))}
        <button type="button" className="tab-add" onClick={() => setOpenSheet('add')} aria-label="Ajouter">
          <NavIcon name="add" />
        </button>
        <button
          type="button"
          className={`tab-item${isActive(NAV_ENTRAINEMENT, pathname) ? ' active' : ''}`}
          onClick={() => go(NAV_ENTRAINEMENT.path)}
        >
          <NavIcon name="entrainement" />
          Entraînement
        </button>
        <button
          type="button"
          className={`tab-item${moreActive ? ' active' : ''}`}
          onClick={() => setOpenSheet('more')}
        >
          <NavIcon name="plus" />
          Plus
        </button>
      </nav>

      {openSheet === 'add' && (
        <Sheet title="Ajouter" onClose={() => setOpenSheet(null)}>
          <div className="sheet-grid">
            {ADD_ACTIONS.map((a) => (
              <button key={a.path} type="button" className={`sheet-link ${a.className}`} onClick={() => go(a.path)}>
                {a.label}
                <small>{a.hint}</small>
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {openSheet === 'more' && (
        <Sheet title="Plus" onClose={() => setOpenSheet(null)}>
          <div className="sheet-grid three">
            {MORE_ITEMS.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`sheet-link${isActive(item, pathname) ? ' active' : ''}`}
                onClick={() => go(item.path)}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </>
  );
}

// Remonte en haut de page à chaque changement de page ; descend jusqu'à
// l'ancre (#hydratation…) quand l'URL en contient une.
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = hash.slice(1);
    let tries = 0;
    // La section peut n'apparaître qu'après chargement des données.
    const timer = window.setInterval(() => {
      const el = document.getElementById(id);
      if (el || ++tries > 20) {
        window.clearInterval(timer);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
    return () => window.clearInterval(timer);
  }, [pathname, hash]);
  return null;
}

function App() {
  return (
    <div className="app">
      <ScrollManager />
      <AppNavigation />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/journal" replace />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/new" element={<NewRecipePage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/exercises/new" element={<NewExercisePage />} />
          <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/repas" element={<MealsPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/cycle" element={<CyclePage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/bilan" element={<BilanPage />} />
          <Route path="/comparer" element={<ComparePage />} />
          <Route path="/entrainement" element={<Navigate to="/sessions" replace />} />
          <Route path="/sessions" element={<WorkoutSessionsPage />} />
          <Route path="/sessions/new" element={<NewWorkoutSessionPage />} />
          <Route path="/sessions/:id" element={<WorkoutSessionDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
