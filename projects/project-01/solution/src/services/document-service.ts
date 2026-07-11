import * as fs from 'fs';
import * as path from 'path';
import { PersistenceService } from './persistence-service';
import type { DocumentSummary } from '../shared/types';

export class DocumentService {
  constructor(private readonly persistence: PersistenceService) {}

  list(): DocumentSummary[] {
    const dir = this.persistence.getDocumentsDir();
    return fs
      .readdirSync(dir)
      .filter((name) => /\.(md|txt)$/i.test(name))
      .map((name) => {
        const stat = fs.statSync(path.join(dir, name));
        return { id: name, name, size: stat.size, modifiedAt: stat.mtimeMs };
      });
  }

  read(id: string): string {
    const dir = this.persistence.getDocumentsDir();
    const filePath = path.join(dir, id);
    if (path.dirname(filePath) !== dir) {
      throw new Error('Invalid document id');
    }
    return fs.readFileSync(filePath, 'utf-8');
  }
}
