import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LibraryView } from '../components/LibraryView';
import { listExercises } from '../api/exercises';
import type { Exercise } from '../types';

export function ExercisesPage() {
  const [items, setItems] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listExercises()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <p className="hint">
        <Link to="/sessions">Voir mes séances →</Link> (des exercices assemblés avec séries,
        répétitions et repos, à reloguer facilement)
      </p>
      <LibraryView
        title="Exercices"
        items={items}
        loading={loading}
        error={error}
        newPath="/exercises/new"
        newLabel="+ Ajouter un exercice"
        detailPath={(id) => `/exercises/${id}`}
      />
    </>
  );
}
