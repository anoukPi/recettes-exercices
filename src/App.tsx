import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { RecipesPage } from './pages/RecipesPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { NewRecipePage } from './pages/NewRecipePage';
import { NewExercisePage } from './pages/NewExercisePage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { ExerciseDetailPage } from './pages/ExerciseDetailPage';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Ma bibliothèque</h1>
        <nav className="tabs">
          <NavLink to="/recipes" className={({ isActive }) => (isActive ? 'active' : '')}>
            Recettes
          </NavLink>
          <NavLink to="/exercises" className={({ isActive }) => (isActive ? 'active' : '')}>
            Exercices
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
        </Routes>
      </main>
    </div>
  );
}

export default App;
