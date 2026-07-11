# Product Requirements

Source: `task-prompt.md` — "Build an Electron app that can show documents and answer questions."

Four required features:

1. **Window launch** — the app opens a desktop window on startup.
2. **Document list panel** — a sidebar lists documents found in the local data directory; shows an empty-state message when there are none.
3. **Question panel** — a text input + button lets the user ask a question and see answers pulled from the documents.
4. **Data directory** — the app creates and manages a local directory (`<userData>/knowledge-base-data`) where documents live, independent of the app's install location.

Out of scope for this project: file upload/import UI, document editing, and any external/LLM-backed Q&A (answers are found via local keyword search over document text, not generated).
