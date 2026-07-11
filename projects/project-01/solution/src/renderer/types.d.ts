import type { DocumentSummary, QaAnswer } from '../shared/types';

export {};

declare global {
  interface Window {
    knowledgeBase: {
      documents: {
        list: () => Promise<DocumentSummary[]>;
        read: (id: string) => Promise<string>;
      };
      qa: {
        ask: (question: string) => Promise<QaAnswer[]>;
      };
    };
  }
}
