# Architecture

Electron app with four layers, per `AGENTS.md`.

- **Main** (`src/main/main.ts`, `src/main/ipc-handlers.ts`) — creates the `BrowserWindow` (1200x800, `contextIsolation: true`, `nodeIntegration: false`), wires up `PersistenceService` / `DocumentService` / `QaService`, and registers IPC handlers.
- **Preload** (`src/preload/preload.ts`) — exposes `window.knowledgeBase.documents.{list,read}` and `window.knowledgeBase.qa.ask` via `contextBridge`. This is the only surface the renderer can call.
- **Renderer** (`src/renderer/`) — React + TypeScript UI (`App.tsx`, `components/DocumentList.tsx`, `components/QuestionPanel.tsx`). Talks to the main process only through `window.knowledgeBase`; never imports `fs`/`path`/`electron` directly.
- **Services** (`src/services/`) — `PersistenceService` creates and owns `<userData>/knowledge-base-data/{documents,index}`; `DocumentService` lists/reads files from that documents directory; `QaService` does a keyword-overlap search over document paragraphs and returns the top 3 matches with source + snippet.

IPC channel names are centralized in `src/shared/types.ts` (`IPC_CHANNELS`), shared by main, preload, and (via types only) the renderer.
