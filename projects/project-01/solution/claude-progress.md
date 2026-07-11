# claude-progress.md -- Session Log

## Project 01: Baseline vs Minimal Harness (explicit-harness run)

### Session 1 -- 2026-07-12

**Duration**: ~30 minutes
**Goal**: Build the same `task-prompt.md` app ("Electron app that can show documents and answer questions") but this time following an explicit harness (`AGENTS.md`, `CLAUDE.md`, `init.sh`, `feature_list.json` conventions) instead of building freeform.

**What was done**:
- Read `AGENTS.md`, `CLAUDE.md`, `init.sh`, `feature_list.json` from the reference harness before writing any code; did not read the reference project's source code.
- Built a React + TypeScript + Electron app respecting the four layer boundaries from `AGENTS.md`: `src/main/` (window + IPC registration), `src/preload/` (contextBridge only), `src/renderer/` (React UI, no Node imports), `src/services/` (PersistenceService, DocumentService, QaService, constructor-injected).
- Centralized IPC channel names in `src/shared/types.ts` (`IPC_CHANNELS`) per the convention.
- Set up `npm run check` (tsc --noEmit for both renderer and node tsconfigs), `npm run build` (tsc for main/preload + vite build for renderer), `npm run dev` (via `scripts/dev.js`, build then launch Electron), matching `init.sh`'s expectations.
- Ran `npm install`, `npm run check` (passed, no errors), `npm run build` (passed).
- Verified the window actually launches: ran `electron .` outside the `ELECTRON_RUN_AS_NODE` sandbox override and confirmed via `ps aux` that main + renderer + GPU + network processes all started.
- Verified `PersistenceService` creates `<userData>/knowledge-base-data/{documents,index}` on disk.
- Verified `DocumentService.list()`/`.read()` and `QaService.ask()` directly against a temporary sample document, then removed the sample document afterward (data directory should start empty per `feature_list.json`'s "empty state" requirement).
- Updated `feature_list.json` with all 4 features at status `"pass"` with evidence from the above verification.
- Wrote `docs/ARCHITECTURE.md` and `docs/PRODUCT.md` (own versions, not copied from the reference project, since only `AGENTS.md`/`CLAUDE.md`/`init.sh`/`feature_list.json` were in scope to read).

**Decisions**:
- Kept the same `window.knowledgeBase.{documents,qa}` API shape implied by `feature_list.json`'s evidence text ("window.knowledgeBase.qa.ask").
- QA is local keyword-overlap search over document paragraphs, not an LLM call — matches the vague task prompt without inventing an external dependency.
- Left the data directory empty by default (no seeded sample documents) so the empty-state UI is what a fresh install actually shows.

**Issues**:
- This sandbox's shell has `ELECTRON_RUN_AS_NODE=1` set by default, which makes `electron .` run as plain Node instead of launching a GUI window. Worked around it with `env -u ELECTRON_RUN_AS_NODE` when verifying the launch (same issue and fix as the earlier weak-harness run).

**Comparison note (vs. the weak-harness/starter run)**: this run started with concrete architectural constraints (layer boundaries, IPC convention, Definition of Done, feature list) instead of inferring everything from a one-line prompt. The resulting app has a different, more structured shape (TypeScript, layered services, centralized IPC types) even though the product surface — window, document list, QA panel, data directory — is the same.
