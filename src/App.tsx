import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
import { WorkoutSessionsPage } from './pages/WorkoutSessionsPage';
import { NewWorkoutSessionPage } from './pages/NewWorkoutSessionPage';
import { WorkoutSessionDetailPage } from './pages/WorkoutSessionDetailPage';

// Toujours accessibles en un tap — l'usage du quotidien.
const PRIMARY_NAV_ITEMS = [
  { path: '/journal', label: 'Carnet' },
  { path: '/repas', label: 'Repas' },
  { path: '/activity', label: 'Activité' },
  { path: '/recipes', label: 'Recettes' },
];

// Moins fréquent — rangé dans le menu déroulant "Plus".
const MORE_NAV_ITEMS = [
  { path: '/bilan', label: 'Bilan' },
  { path: '/cycle', label: 'Cycle' },
  { path: '/tests', label: 'Tests' },
  { path: '/exercises', label: 'Exercices' },
  { path: '/sessions', label: 'Séances' },
  { path: '/settings', label: 'Paramètres' },
];

function AppNavMore() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeMore = MORE_NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.path;

  return (
    <select
      className="nav-select app-nav-more"
      value={activeMore ?? ''}
      onChange={(e) => e.target.value && navigate(e.target.value)}
      aria-label="Plus de pages"
    >
      <option value="" disabled>
        Plus
      </option>
      {MORE_NAV_ITEMS.map((item) => (
        <option key={item.path} value={item.path}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

function AppNavPrimary() {
  const navigate = useNavigate();
  const location = useLocation();
  const activePrimary = PRIMARY_NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.path;

  return (
    <nav className="app-nav-primary">
      {PRIMARY_NAV_ITEMS.map((item) => (
        <button
          key={item.path}
          type="button"
          className={`app-nav-link${activePrimary === item.path ? ' active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Kaly</h1>
        <AppNavMore />
      </header>
      <AppNavPrimary />

      <main>
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
          <Route path="/sessions" element={<WorkoutSessionsPage />} />
          <Route path="/sessions/new" element={<NewWorkoutSessionPage />} />
          <Route path="/sessions/:id" element={<WorkoutSessionDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
