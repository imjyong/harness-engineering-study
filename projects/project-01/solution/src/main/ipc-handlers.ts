import type { IpcMain } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import { DocumentService } from '../services/document-service';
import { QaService } from '../services/qa-service';

interface Services {
  documentService: DocumentService;
  qaService: QaService;
}

export function registerIpcHandlers(ipcMain: IpcMain, services: Services): void {
  const { documentService, qaService } = services;

  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_LIST, () => documentService.list());
  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_READ, (_event, id: string) => documentService.read(id));
  ipcMain.handle(IPC_CHANNELS.QA_ASK, (_event, question: string) => qaService.ask(question));
}
