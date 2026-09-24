import { useEffect, useState } from 'react';
import { LibraryView } from '../components/LibraryView';
import { TrainingTabs } from '../components/TrainingTabs';
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
      <TrainingTabs />
      <p className="hint">Ta bibliothèque d'exercices, à assembler ensuite en séances.</p>
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
