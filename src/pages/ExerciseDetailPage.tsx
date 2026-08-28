import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExerciseForm } from '../components/ExerciseForm';
import { deleteExercise, getExercise, updateExercise } from '../api/exercises';
import type { Exercise, ExerciseInput } from '../types';

export function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getExercise(id)
      .then(setExercise)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (input: ExerciseInput) => {
    if (!id) return;
    const updated = await updateExercise(id, input);
    setExercise(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Supprimer définitivement cet exercice ?')) return;
    await deleteExercise(id);
    navigate('/exercises');
  };

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!exercise) return <p className="error">Exercice introuvable.</p>;

  if (editing) {
    return (
      <section>
        <h2>Modifier l'exercice</h2>
        <ExerciseForm initial={exercise} onSubmit={handleUpdate} submitLabel="Enregistrer" />
        <button type="button" className="link-button" onClick={() => setEditing(false)}>
          Annuler
        </button>
      </section>
    );
  }

  return (
    <section className="detail">
      <Link to="/exercises" className="back-link">
        ← Exercices
      </Link>
      <h2>{exercise.title}</h2>

      {exercise.instagram_link && (
        <p>
          <a href={exercise.instagram_link} target="_blank" rel="noreferrer">
            {exercise.instagram_link}
          </a>
        </p>
      )}

      {exercise.tags.length > 0 && (
        <div className="tags">
          {exercise.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {exercise.muscles.length > 0 && (
        <>
          <h3>Muscles ciblés</h3>
          <div className="tags">
            {exercise.muscles.map((muscle) => (
              <span key={muscle} className="tag muted">
                {muscle}
              </span>
            ))}
          </div>
        </>
      )}

      {exercise.description && (
        <>
          <h3>Description / consignes</h3>
          <p className="preserve-lines">{exercise.description}</p>
        </>
      )}

      {exercise.notes && (
        <>
          <h3>Notes personnelles</h3>
          <p className="preserve-lines">{exercise.notes}</p>
        </>
      )}

      <p className="meta">
        Ajouté le {new Date(exercise.created_at).toLocaleDateString('fr-FR')}
      </p>

      <div className="actions">
        <button type="button" onClick={() => setEditing(true)}>
          Modifier
        </button>
        <button type="button" className="danger" onClick={handleDelete}>
          Supprimer
        </button>
      </div>
    </section>
  );
}
