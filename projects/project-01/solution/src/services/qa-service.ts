import { DocumentService } from './document-service';
import type { QaAnswer } from '../shared/types';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'of', 'to', 'in', 'and', 'or',
  'what', 'how', 'does', 'do', 'why', 'for',
]);

export class QaService {
  constructor(private readonly documents: DocumentService) {}

  ask(question: string): QaAnswer[] {
    const queryWords = question
      .toLowerCase()
      .split(/[^a-z0-9가-힣]+/)
      .filter((word) => word && !STOPWORDS.has(word));

    const results: QaAnswer[] = [];

    for (const doc of this.documents.list()) {
      const content = this.documents.read(doc.id);
      const paragraphs = content
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

      for (const paragraph of paragraphs) {
        const lower = paragraph.toLowerCase();
        const score = queryWords.reduce((sum, word) => sum + (lower.includes(word) ? 1 : 0), 0);
        if (score > 0) {
          results.push({ documentId: doc.id, documentName: doc.name, snippet: paragraph, score });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 3);
  }
}
