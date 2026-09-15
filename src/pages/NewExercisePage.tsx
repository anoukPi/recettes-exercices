import { Link, useNavigate } from 'react-router-dom';
import { ExerciseForm } from '../components/ExerciseForm';
import { createExercise } from '../api/exercises';
import { useSession } from '../lib/auth';
import type { ExerciseInput } from '../types';

export function NewExercisePage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();

  const handleSubmit = async (input: Omit<ExerciseInput, 'user_id'>) => {
    const exercise = await createExercise(input);
    navigate(`/exercises/${exercise.id}`);
  };

  if (loading) return null;

  if (!session) {
    return (
      <p className="hint">
        Connecte-toi dans <Link to="/settings">Paramètres</Link> pour ajouter un exercice.
      </p>
    );
  }

  return (
    <section>
      <h2>Nouvel exercice</h2>
      <ExerciseForm onSubmit={handleSubmit} submitLabel="Ajouter l'exercice" />
    </section>
  );
}
