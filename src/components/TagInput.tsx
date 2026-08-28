interface TagInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
  listId: string;
}

export function TagInput({
  label,
  value,
  onChange,
  suggestions = [],
  placeholder,
  listId,
}: TagInputProps) {
  return (
    <div className="field">
      <label htmlFor={listId}>{label}</label>
      <input
        id={listId}
        type="text"
        list={`${listId}-suggestions`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'ex: healthy, rapide, végé'}
      />
      <datalist id={`${listId}-suggestions`}>
        {suggestions.map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
      <p className="hint">Sépare les mots-clés par des virgules.</p>
    </div>
  );
}
