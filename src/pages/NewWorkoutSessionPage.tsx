import { Link, useNavigate } from 'react-router-dom';
import { WorkoutSessionForm } from '../components/WorkoutSessionForm';
import { createWorkoutSession } from '../api/workoutSessions';
import { useSession } from '../lib/auth';
import type { WorkoutSessionInput } from '../types';

export function NewWorkoutSessionPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();

  const handleSubmit = async (input: Omit<WorkoutSessionInput, 'user_id'>) => {
    const created = await createWorkoutSession(input);
    navigate(`/sessions/${created.id}`);
  };

  if (loading) return null;

  if (!session) {
    return (
      <p className="hint">
        Connecte-toi dans <Link to="/settings">Paramètres</Link> pour créer une séance.
      </p>
    );
  }

  return (
    <section>
      <h2>Nouvelle séance</h2>
      <WorkoutSessionForm onSubmit={handleSubmit} submitLabel="Créer la séance" />
    </section>
  );
}
