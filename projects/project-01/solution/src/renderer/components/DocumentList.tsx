import type { DocumentSummary } from '../../shared/types';

interface DocumentListProps {
  documents: DocumentSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DocumentList({ documents, selectedId, onSelect }: DocumentListProps) {
  if (documents.length === 0) {
    return <p className="empty-state">No documents yet. Add .md or .txt files to the data directory.</p>;
  }

  return (
    <ul className="document-list">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className={doc.id === selectedId ? 'selected' : ''}
          onClick={() => onSelect(doc.id)}
        >
          {doc.name}
        </li>
      ))}
    </ul>
  );
}
