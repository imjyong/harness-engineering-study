export const IPC_CHANNELS = {
  DOCUMENTS_LIST: 'documents:list',
  DOCUMENTS_READ: 'documents:read',
  QA_ASK: 'qa:ask',
} as const;

export interface DocumentSummary {
  id: string;
  name: string;
  size: number;
  modifiedAt: number;
}

export interface QaAnswer {
  documentId: string;
  documentName: string;
  snippet: string;
  score: number;
}
