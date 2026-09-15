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

const NAV_ITEMS = [
  { path: '/journal', label: 'Carnet' },
  { path: '/repas', label: 'Repas' },
  { path: '/activity', label: 'Activité' },
  { path: '/cycle', label: 'Cycle' },
  { path: '/tests', label: 'Tests' },
  { path: '/recipes', label: 'Recettes' },
  { path: '/exercises', label: 'Exercices' },
  { path: '/settings', label: 'Paramètres' },
];

function AppNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const current = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.path ?? '/journal';

  return (
    <select
      className="nav-select"
      value={current}
      onChange={(e) => navigate(e.target.value)}
      aria-label="Navigation"
    >
      {NAV_ITEMS.map((item) => (
        <option key={item.path} value={item.path}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Kaly</h1>
        <AppNav />
      </header>

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
        </Routes>
      </main>
    </div>
  );
}

export default App;
