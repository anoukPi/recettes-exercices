import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { WorkoutSessionForm } from '../components/WorkoutSessionForm';
import {
  deleteWorkoutSession,
  duplicateWorkoutSession,
  getWorkoutSession,
  updateWorkoutSession,
} from '../api/workoutSessions';
import { listExercises } from '../api/exercises';
import { useSession } from '../lib/auth';
import type { Exercise, WorkoutSession, WorkoutSessionInput } from '../types';

export function WorkoutSessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useSession();
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getWorkoutSession(id), listExercises()])
      .then(([ws, ex]) => {
        setWorkoutSession(ws);
        setExercises(ex);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [id]);

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  const handleUpdate = async (input: Omit<WorkoutSessionInput, 'user_id'>) => {
    if (!id) return;
    const updated = await updateWorkoutSession(id, input);
    setWorkoutSession(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Supprimer définitivement cette séance ?')) return;
    await deleteWorkoutSession(id);
    navigate('/sessions');
  };

  const handleDuplicate = async () => {
    if (!workoutSession) return;
    const copy = await duplicateWorkoutSession(workoutSession);
    navigate(`/sessions/${copy.id}`);
  };

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!workoutSession) return <p className="error">Séance introuvable.</p>;

  if (editing) {
    return (
      <section>
        <h2>Modifier la séance</h2>
        <WorkoutSessionForm initial={workoutSession} onSubmit={handleUpdate} submitLabel="Enregistrer" />
        <button type="button" className="link-button" onClick={() => setEditing(false)}>
          Annuler
        </button>
      </section>
    );
  }

  return (
    <section className="detail">
      <Link to="/sessions" className="back-link">
        ← Séances
      </Link>
      <h2>{workoutSession.title}</h2>

      {workoutSession.description && <p className="preserve-lines">{workoutSession.description}</p>}

      <h3>Exercices</h3>
      <ul className="journal-entry-list">
        {workoutSession.exercises.map((row, i) => {
          const exercise = exerciseById.get(row.exercise_id);
          return (
            <li key={i} className="journal-entry">
              <div className="journal-entry-row">
                <div className="journal-entry-main">
                  <span className="journal-entry-label">
                    {exercise ? (
                      <Link to={`/exercises/${exercise.id}`}>{exercise.title}</Link>
                    ) : (
                      'Exercice supprimé'
                    )}
                  </span>
                  <span className="journal-entry-qty">
                    {row.sets && row.reps ? `${row.sets} × ${row.reps}` : ''}
                    {row.rest_seconds ? ` · repos ${row.rest_seconds}s` : ''}
                  </span>
                </div>
                {exercise?.photo_url && (
                  <img src={exercise.photo_url} alt="" className="card-photo-sm" />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="meta">
        Créée le {new Date(workoutSession.created_at).toLocaleDateString('fr-FR')}
      </p>

      <div className="actions">
        {session?.user.id === workoutSession.user_id ? (
          <>
            <button type="button" onClick={() => setEditing(true)}>
              Modifier
            </button>
            <button type="button" className="danger" onClick={handleDelete}>
              Supprimer
            </button>
          </>
        ) : (
          session && (
            <button type="button" onClick={handleDuplicate}>
              Dupliquer dans ma bibliothèque
            </button>
          )
        )}
      </div>
    </section>
  );
}
