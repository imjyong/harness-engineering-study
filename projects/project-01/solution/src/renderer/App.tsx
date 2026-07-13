import { useEffect, useState } from 'react';
import { DocumentList } from './components/DocumentList';
import { QuestionPanel } from './components/QuestionPanel';
import type { DocumentSummary } from '../shared/types';

export function App() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [content, setContent] = useState('');

  useEffect(() => {
    window.knowledgeBase.documents.list().then(setDocuments);
  }, []);

  async function handleSelect(id: string) {
    setSelectedId(id);
    const text = await window.knowledgeBase.documents.read(id);
    setContent(text);
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Documents</h2>
        <DocumentList documents={documents} selectedId={selectedId} onSelect={handleSelect} />
      </aside>
      <main className="content">
        <section className="viewer">
          <h2>{selectedId ?? 'Select a document'}</h2>
          <pre>{content}</pre>
        </section>
        <QuestionPanel />
      </main>
    </div>
  );
}
