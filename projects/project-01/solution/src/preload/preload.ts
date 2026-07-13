import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import type { DocumentSummary, QaAnswer } from '../shared/types';

contextBridge.exposeInMainWorld('knowledgeBase', {
  documents: {
    list: (): Promise<DocumentSummary[]> => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_LIST),
    read: (id: string): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_READ, id),
  },
  qa: {
    ask: (question: string): Promise<QaAnswer[]> => ipcRenderer.invoke(IPC_CHANNELS.QA_ASK, question),
  },
});
