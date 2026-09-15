import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
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

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Kaly</h1>
        <nav className="tabs">
          <NavLink to="/recipes" className={({ isActive }) => (isActive ? 'active' : '')}>
            Recettes
          </NavLink>
          <NavLink to="/exercises" className={({ isActive }) => (isActive ? 'active' : '')}>
            Exercices
          </NavLink>
          <NavLink to="/journal" className={({ isActive }) => (isActive ? 'active' : '')}>
            Carnet
          </NavLink>
          <NavLink to="/repas" className={({ isActive }) => (isActive ? 'active' : '')}>
            Repas
          </NavLink>
          <NavLink to="/activity" className={({ isActive }) => (isActive ? 'active' : '')}>
            Activité
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `settings-link${isActive ? ' active' : ''}`}>
            ⚙️
          </NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
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
        </Routes>
      </main>
    </div>
  );
}

export default App;
