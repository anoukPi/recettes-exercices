import { useNavigate } from 'react-router-dom';
import { ExerciseForm } from '../components/ExerciseForm';
import { createExercise } from '../api/exercises';
import type { ExerciseInput } from '../types';

export function NewExercisePage() {
  const navigate = useNavigate();

  const handleSubmit = async (input: ExerciseInput) => {
    const exercise = await createExercise(input);
    navigate(`/exercises/${exercise.id}`);
  };

  return (
    <section>
      <h2>Nouvel exercice</h2>
      <ExerciseForm onSubmit={handleSubmit} submitLabel="Ajouter l'exercice" />
    </section>
  );
}
