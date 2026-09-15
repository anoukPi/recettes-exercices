import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

interface LibraryItem {
  id: string;
  title: string;
  tags: string[];
  photo_url?: string | null;
}

interface LibraryViewProps<T extends LibraryItem> {
  title: string;
  items: T[];
  loading: boolean;
  error: string | null;
  newPath: string;
  newLabel: string;
  detailPath: (id: string) => string;
}

export function LibraryView<T extends LibraryItem>({
  title,
  items,
  loading,
  error,
  newPath,
  newLabel,
  detailPath,
}: LibraryViewProps<T>) {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) for (const t of item.tags) set.add(t);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !query || item.title.toLowerCase().includes(query);
      const matchesTags = selectedTags.every((tag) => item.tags.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [items, search, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <section>
      <div className="library-header">
        <h2>{title}</h2>
        <Link className="button" to={newPath}>
          {newLabel}
        </Link>
      </div>

      <input
        type="search"
        className="search-input"
        placeholder="Rechercher par titre…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {allTags.length > 0 && (
        <div className="tag-filter">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-chip${selectedTags.includes(tag) ? ' selected' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              type="button"
              className="tag-chip clear"
              onClick={() => setSelectedTags([])}
            >
              Effacer les filtres
            </button>
          )}
        </div>
      )}

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="empty">Rien à afficher pour l'instant.</p>
      )}

      <div className="grid">
        {filtered.map((item) => (
          <Link key={item.id} to={detailPath(item.id)} className="card">
            {item.photo_url && <img src={item.photo_url} alt="" className="card-photo" />}
            <h3>{item.title}</h3>
            {item.tags.length > 0 && (
              <div className="tags">
                {item.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
