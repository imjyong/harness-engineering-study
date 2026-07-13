const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function listDocuments() {
  return fs
    .readdirSync(DATA_DIR)
    .filter((name) => /\.(txt|md)$/i.test(name))
    .map((name) => {
      const stat = fs.statSync(path.join(DATA_DIR, name));
      return { name, size: stat.size, modified: stat.mtimeMs };
    });
}

function readDocument(name) {
  const filePath = path.join(DATA_DIR, name);
  if (path.dirname(filePath) !== DATA_DIR) throw new Error('Invalid document name');
  return fs.readFileSync(filePath, 'utf-8');
}

const STOPWORDS = new Set(['the', 'a', 'an', 'is', 'are', 'of', 'to', 'in', 'and', 'or', 'what', 'how', 'does', 'do', 'why', 'for']);

function answerQuestion(question) {
  const queryWords = question
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/)
    .filter((w) => w && !STOPWORDS.has(w));

  const results = [];

  for (const doc of listDocuments()) {
    const content = readDocument(doc.name);
    const paragraphs = content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

    for (const paragraph of paragraphs) {
      const lower = paragraph.toLowerCase();
      const score = queryWords.reduce((sum, w) => sum + (lower.includes(w) ? 1 : 0), 0);
      if (score > 0) {
        results.push({ document: doc.name, snippet: paragraph, score });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3);
}

ipcMain.handle('documents:list', () => listDocuments());
ipcMain.handle('documents:read', (_event, name) => readDocument(name));
ipcMain.handle('qa:ask', (_event, question) => answerQuestion(question));
