import { useEffect, useState } from 'react';
import { LibraryView } from '../components/LibraryView';
import { TrainingTabs } from '../components/TrainingTabs';
import { listWorkoutSessions } from '../api/workoutSessions';
import type { WorkoutSession } from '../types';

export function WorkoutSessionsPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listWorkoutSessions()
      .then(setSessions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, []);

  const items = sessions.map((s) => ({
    ...s,
    tags: [],
    subtitle: `${s.exercises.length} exercice${s.exercises.length > 1 ? 's' : ''}`,
  }));

  return (
    <>
      <TrainingTabs />
      <p className="hint">
        Assemble tes exercices en séances (séries, répétitions, repos) — autant que tu veux, et tu
        peux créer un nouvel exercice directement en composant une séance.
      </p>
      <LibraryView
        title="Séances"
        items={items}
        loading={loading}
        error={error}
        newPath="/sessions/new"
        newLabel="+ Créer une séance"
        detailPath={(id) => `/sessions/${id}`}
      />
    </>
  );
}
