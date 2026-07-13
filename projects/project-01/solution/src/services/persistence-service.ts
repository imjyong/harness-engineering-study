import * as fs from 'fs';
import * as path from 'path';

export class PersistenceService {
  private readonly dataDir: string;
  private readonly documentsDir: string;
  private readonly indexDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.documentsDir = path.join(dataDir, 'documents');
    this.indexDir = path.join(dataDir, 'index');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    fs.mkdirSync(this.dataDir, { recursive: true });
    fs.mkdirSync(this.documentsDir, { recursive: true });
    fs.mkdirSync(this.indexDir, { recursive: true });
  }

  getDataDir(): string {
    return this.dataDir;
  }

  getDocumentsDir(): string {
    return this.documentsDir;
  }

  getIndexDir(): string {
    return this.indexDir;
  }
}
