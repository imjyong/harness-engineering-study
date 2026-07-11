# Project 01. Prompt-Only vs. Rules-First: How Much Difference Does It Make

[project-01-baseline-vs-minimal-harness](learn-harness-engineering/docs/ko/projects/project-01-baseline-vs-minimal-harness/index.md)
[project-01-README](learn-harness-engineering/projects/project-01/README-KO.md)

- Build a minimal Electron knowledge-base app shell — a window with a document list on the left, a Q&A panel on the right, and a local data directory.
- You run it twice. First time: just a prompt, no preparation. Second time: `AGENTS.md`, `init.sh`, `feature_list.json` pre-placed in the repo. Then compare.

## Tools

- Claude Code or Codex (pick one, use it for both runs)
- Git (manage branches and compare)
- Node.js + Electron (project stack)
  - Electron: 본 프로젝트에서는 React + TypeScript로 데스크톱 앱을 만드는 프레임워크를 사용
    - 크게 세 구조로 이루어짐:
      - main process: OS 레벨 작업
      - renderer process: 실제 UI
      - preload: 둘을 이어주는 다리 역할

## 1. Run the agent task once with starter (weak harness)

```sh
# learn-harness-engineering/projects/project-01/starter
cd starter
npm install
# Give the contents of task-prompt.md as the prompt to Claude Code / Codex
# Ask the agent to complete: window startup, document list, QA panel, data directory
# Do not give the agent solution files during this run.
```

### Agent 전체 작업 순서

1. `task-prompt.md` 읽음
   - 내용은 "Build an Electron app that can show documents and answer questions" 한 줄뿐이었음
   - 사용자가 "다른 파일을 절대 참고하지 말 것"으로 지시했기 때문에, 이 파일 외의 다른 파일은 이후 과정에서 전혀 읽지 않음

2. `find . -maxdepth 4 -not -path '*/node_modules/*' -not -path '*/.git/*' | sort`
   - node_modules·git 내부는 제외하고 4단계 깊이까지 파일 목록을 정렬해서 확인
   - 결과: `task-prompt.md` 하나만 존재 → 기존 코드나 뼈대(스캐폴드) 없이 완전히 빈 프로젝트였다는 걸 확인

3. `node -v && npm -v`
   - Node.js와 npm 버전을 확인
   - 결과: Node.js v24.12.0, npm 11.6.2

4. `mkdir -p src/renderer data`
   - 화면을 그리는 코드(renderer)를 담을 폴더와 문서 데이터를 담을 폴더 생성

5. `package.json` 작성
   - 이 프로젝트가 Electron 앱이라는 것, 실행 진입점(`src/main.js`), 필요한 패키지(`electron`) 정의

6. `src/main.js` 작성
   - 메인 프로세스(창을 만들고 파일 시스템 접근 같은 시스템 권한을 갖는 뒷단 프로그램) 코드 작성
   - `app.whenReady().then(() => createWindow())`로 앱 실행 시 창 띄우기 구현
   - `fs.readdirSync(DATA_DIR)`로 `data/` 폴더의 `.md`/`.txt` 문서 목록을 읽는 `listDocuments()` 구현
   - 질문 단어와 문서 문단이 겹치는 개수로 점수를 매겨 상위 3개를 돌려주는 `answerQuestion()` 구현
   - `ipcMain.handle('documents:list', ...)`, `ipcMain.handle('documents:read', ...)`, `ipcMain.handle('qa:ask', ...)`로 화면(렌더러)과의 통신 채널(IPC) 3개 등록

7. `src/preload.js` 작성
   - `contextBridge.exposeInMainWorld('api', {...})`로, 화면 쪽에서 `window.api.listDocuments()`, `window.api.readDocument()`, `window.api.askQuestion()` 세 개만 제한적으로 쓸 수 있게 열어줌

8. `src/renderer/index.html` 작성
   - 좌측 문서 목록 패널, 중앙 문서 뷰어(`<pre id="doc-body">`), 하단 질문/답변 패널(`<form id="qa-form">`) 레이아웃 작성

9. `src/renderer/renderer.js` 작성
   - `loadDocumentList()`로 문서 목록을 불러와 클릭 시 `openDocument()`로 본문을 보여주는 로직 작성
   - `qaForm.addEventListener('submit', ...)`로 질문 제출 시 `window.api.askQuestion()`을 호출해 결과를 카드로 렌더링하는 로직 작성

10. `src/renderer/styles.css` 작성
    - 레이아웃 색/여백 등 디자인 작성

11. `data/welcome.md` 작성
    - 앱이 읽어들일 샘플 문서 1 작성

12. `data/sample-notes.md` 작성
    - 앱이 읽어들일 샘플 문서 2 작성

13. `npm install`
    - `package.json`에 적어둔 `electron` 패키지를 실제로 내려받아 설치 (70개 패키지 설치됨)

14. `node --check src/main.js && node --check src/preload.js && node --check src/renderer/renderer.js && echo "syntax OK"`
    - 코드를 실제로 실행하지 않고 문법 오류만 빠르게 확인
    - 결과: `syntax OK`, 문제 없음

15. `(timeout 6 npx electron . > /tmp/electron-run.log 2>&1 || true); cat /tmp/electron-run.log`
    - Electron 앱이 크래시 없이 뜨는지 6초만 실행해보고 로그를 확인하려던 시도
    - 에러 1 발견: `(eval):1: command not found: timeout`
    - 원인: macOS 기본 zsh 환경에는 GNU coreutils의 `timeout` 명령어가 기본 설치돼 있지 않음
    - 수정 방향: `timeout` 대신 백그라운드 실행 + `sleep` + `pkill` 조합으로 전략 변경

16. `(npx electron . > /tmp/electron-run.log 2>&1 &) ; sleep 4; pkill -f "electron ." 2>/dev/null; sleep 1; cat /tmp/electron-run.log`
    - 앱을 백그라운드로 띄운 뒤 4초 후 강제 종료해서 정상 기동 여부만 확인하려던 재시도
    - 에러 2 발견:
       ```
       TypeError: Cannot read properties of undefined (reading 'whenReady')
           at Object.<anonymous> (/Users/.../src/main.js:21:5)
           ...
       Node.js v20.18.0
       ```
    - 로그 맨 끝의 `Node.js v20.18.0` 출력을 보고, Electron 전용 실행 파일이 아니라 일반 Node.js로 실행되고 있다는 신호로 판단

17. `ls node_modules/electron/dist 2>/dev/null | head -20; echo "---"; cat node_modules/electron/package.json | grep version; echo "---env---"; echo "ELECTRON_RUN_AS_NODE=$ELECTRON_RUN_AS_NODE"`
    - 16번 에러의 원인을 좁히기 위해 Electron 바이너리 설치 상태와 환경변수를 직접 확인
    - 결과: Electron 바이너리(버전 31.7.7)는 정상 설치돼 있었지만, 샌드박스 환경에 `ELECTRON_RUN_AS_NODE=1`이 기본 설정돼 있어서 Electron이 일반 Node.js처럼 동작하고 있었던 것을 확인 → 내 코드 버그가 아니라 실행 환경 제약이었음

18. `(env -u ELECTRON_RUN_AS_NODE npx electron . > /tmp/electron-run2.log 2>&1 &) ; sleep 4; pkill -f "Electron.app" 2>/dev/null; pkill -f "electron ." 2>/dev/null; sleep 1; cat /tmp/electron-run2.log`
    - 17번에서 찾은 환경변수만 제거하고 같은 방식으로 재실행해서 해결됐는지 검증
    - 결과: `Electron exited with signal SIGTERM`만 로그에 남고 `TypeError`는 발생하지 않음 → 창이 정상적으로 뜬 채 유지되다가 내가 보낸 종료 신호로 꺼졌다는 뜻 → 창 시작(window startup) 로직 정상 동작 최종 확인

### Features

- Window startup — src/main.js: app.whenReady()에서 BrowserWindow 생성
- Document list — src/renderer/index.html + renderer.js: 좌측 문서 목록 패널
- QA panel — 같은 파일들: 하단 질문/답변 패널, QA:ask IPC로 답변
- Data directory — data/welcome.md, data/sample-notes.md: 앱이 읽어들이는 로컬 데이터 폴더

- solution/feature_list.json: 각 feature에 대한 expected evidence
  - window launch, document list, question panel, local data directory creation 4개의 구체적인 features에 대해 features > id, name, description, status, evidence, testedAt으로 나누어 관리함

### 결과 분석

- **Stuck 1: 요구사항이 충분하지 않은 경우**
  - Agent가 data directory 기능을 "앱이 읽어들이는 로컬 폴더"로 해석하여 data/ 폴더에 파일을 직접 넣어야 앱이 그걸 읽고 목록에 보여주는 방식으로 구현함, 파일을 앱 UI 안에서 추가할 수 있는 import 기능을 만들지 않음
  - 우선 구현한대로 `data/`에 `lecture-01.md`를 업로드 하고 "이 파일에 대해 설명해줘" 라고 입력하니 파일에 대해 설명해주지 않고 파일을 단락으로 끊어서 보여주기만 함

## 2. Run the same task with solution (explicit harness)

```sh
# learn-harness-engineering/projects/project-01/solution
cd ../solution
npm install
# Ask the agent to read AGENTS.md, init.sh, feature_list.json, and claude-progress.md
# before touching code. The product code should already satisfy the same four features.
```

### 참고한 하네스 파일

#### `AGENTS.md`
- 담긴 내용: 시작 전 읽어야 할 순서(이 파일 → docs/ARCHITECTURE.md → docs/PRODUCT.md → `bash init.sh` → feature_list.json), main/preload/renderer/services 4계층 경계 규칙, 컨벤션(TypeScript strict, named export만 사용, `IPC_CHANNELS`를 `src/shared/types.ts` 한 곳에 모으기), Definition of Done 5가지(타입체크 통과 / `npm run dev`로 창이 뜸 / feature_list.json에 pass+evidence / 계층 경계 준수 / 콘솔 에러 없음), feature_list.json 다루는 규칙(상태는 pass/fail/not-started, feature는 절대 삭제 금지)
- 검증하려는 것: 내가 짠 코드가 4계층 경계를 어기지 않았는지, Definition of Done 5개 조건을 실제로 다 만족했는지
- 디테일: "No `any` types without a comment explaining why"처럼 예외를 완전 금지하지 않고 "이유를 남기면 허용"하는 조건부 규칙까지 명시돼 있음
- 왜 필요한가: lecture-01의 "명시적인 Convention이 없을 때" 실패 패턴 — 규칙이 없으면 Agent는 예를 들어 모든 로직을 `main.js` 한 파일에 다 넣는 식으로 임의로 구조를 짜고, 팀이 원하는 계층 분리를 지킬 수 없음. AGENTS.md가 이 gap을 메움
- 해당 Layer: 주로 **Context Provision**(컨벤션/경계). Definition of Done 부분은 **Verification Feedback**과도 겹침

#### `CLAUDE.md`
- 담긴 내용: 프로젝트 한 줄 소개, 빌드/실행 명령어(`npm run check/build/dev`), 주요 파일-용도 표(`main.ts`, `ipc-handlers.ts`, `preload.ts`, `App.tsx`, `services/*.ts`, `shared/types.ts`, `feature_list.json`), 아키텍처 규칙 요약(렌더러는 Node 모듈 금지 등), "기능 추가하는 6단계" 절차, 테스트 명령어(`npm test`, `npm run test:watch`)
- 검증하려는 것: 내가 만든 실제 파일 구조(main.ts / ipc-handlers.ts / preload.ts / App.tsx / services / shared/types.ts)가 이 표의 이름·역할과 정확히 일치하는지
- 디테일: `ipc-handlers.ts`를 `main.ts`에서 분리하라는 지시, `scripts/dev.js`라는 구체적 파일명으로 dev 스크립트를 만들라는 지시까지 명시돼 있어 AGENTS.md보다 훨씬 실행 지향적
- 왜 필요한가: AGENTS.md가 "규칙"이라면 CLAUDE.md는 "바로 실행 가능한 참조표" — 세션마다 파일들을 뒤져 구조를 추론하는 대신 표 하나로 바로 알 수 있게 함. lecture-01의 "Cross-session state loss"(매 세션 project 구조를 재탐색)로 낭비되는 비용을 줄이는 역할
- 해당 Layer: **Context Provision** + **Execution Environment**(명령어 목록)

### `init.sh`
- 담긴 내용: `npm install` → `npm run check` → `npm run build` 3단계를 `set -euo pipefail`로 순서대로 실행하고, 하나라도 실패하면 즉시 중단
- 검증하려는 것: "이 프로젝트가 지금 클린하게 빌드되는 상태인가"를 의존성 설치·타입 에러·빌드 에러 3가지 축으로 한 번에 검증
- 디테일: `set -euo pipefail` 옵션 하나로 "에러가 나도 다음 줄로 그냥 넘어가는" 침묵 실패를 원천 차단
- 왜 필요한가: lecture-01의 "환경 setup이 불완전할 때" 실패 패턴 — Agent가 `pip install` 에러나 Node 버전 불일치 같은 문제로 context window를 낭비하는 걸 막기 위해, "이거 하나만 실행하면 환경이 멀쩡한지 안다"는 단일 진입점을 제공
- 해당 Layer: **Execution Environment**

#### `feature_list.json`
- 담긴 내용: 4개 feature(`window-launch`, `document-list`, `question-panel`, `data-directory`) 각각의 `id`/`name`/`description`/`status`/`evidence`/`testedAt`
- 검증하려는 것: 각 feature가 실제로 `"pass"` 상태인지, `evidence`가 재현 가능한 구체적 근거(수치·API 이름)를 담고 있는지
- 디테일: evidence 문구 안에 `"1200x800 with contextIsolation=true"`, `"window.knowledgeBase.qa.ask"`처럼 구체적 수치·실제 API 이름이 박혀 있어서, 이 파일이 사실상 완료 기준(completion criteria) 역할도 겸함
- 왜 필요한가: lecture-01의 "요구사항이 충분하지 않을 때" 실패 패턴 — "문서 보여주고 질문 답하는 앱 만들어줘"라는 모호한 프롬프트 대신, "정확히 이 4개가 이 증거와 함께 pass여야 끝"이라는 구체적 완료 기준을 제공. 동시에 Agent가 안 됐는데 됐다고 우기는 **Verification Gap**을 막는 장치이기도 함
- 해당 Layer: **Task Specification**(feature 정의) + **Verification Feedback**(evidence/status) + **State Management**(진행 상태 기록)

#### `claude-progress.md`
- 담긴 내용: 세션별 로그 — 기간, 목표, 한 일 목록, 내린 결정, 이슈, 다음 세션 계획
- 검증하려는 것: 딱히 새로 뭘 검증한다기보다, 이전 세션에서 이미 검증·결정된 것을 다시 검증하지 않고 그대로 이어받아도 되는지 확인하는 용도
- 디테일: "창 제목을 Knowledge Base로 통일"처럼 사소하지만 세션마다 다르게 결정될 수 있는 것들을 명시적으로 박제해둠
- 왜 필요한가: lecture-01의 "Cross-session state loss" 실패 패턴 — persistent state 저장 장치가 없으면 매 세션 project 구조를 재탐색하고 같은 결정을 또 내려야 하며, 작업 시간이 30분을 넘는 태스크에서 실패율이 급격히 증가한다고 명시돼 있음. 이 파일이 그 state를 대신 저장
- 해당 Layer: **State Management**

### Agent 전체 작업 순서

1. `learn-harness-engineering/projects/project-01/solution/AGENTS.md` 읽음
   - 검증: 시작 전에 뭘 지켜야 하는지(4계층 경계, TS strict, IPC_CHANNELS 위치, Definition of Done 5가지)를 파악
   - 의도: AGENTS.md 자체가 "명시적 컨벤션이 없을 때" 실패를 막는 파일이므로, 코드를 한 줄도 쓰기 전에 이걸 먼저 읽어서 임의로 구조를 짜지 않으려는 의도
   - Layer: **Context Provision**

2. `learn-harness-engineering/projects/project-01/solution/init.sh` 읽음
   - 검증: `npm install → npm run check → npm run build` 3단계가 전부 통과해야 한다는 제약 확인
   - 의도: 내가 만들 `package.json`의 스크립트 이름(`check`, `build`)을 이 파일이 요구하는 이름과 정확히 맞추기 위해 미리 확인
   - Layer: **Execution Environment**

3. `learn-harness-engineering/projects/project-01/solution/feature_list.json` 읽음
   - 검증: 만들어야 할 4개 feature의 정확한 정의와, evidence 문구에 있는 실제 API 이름(`window.knowledgeBase.qa.ask`) 확인
   - 의도: "문서 보여주고 질문 답하는 앱"이라는 모호한 원 프롬프트를, 이 파일이 제공하는 구체적 completion criteria로 대체하려는 의도 — lecture-01 예시("Search 기능을 만들어줘" → completion criteria로 구체화)와 동일한 패턴
   - Layer: **Task Specification**

4. `learn-harness-engineering/projects/project-01/solution/claude-progress.md` 읽음
   - 검증: 이전 세션에서 이미 내려진 결정(창 제목 "Knowledge Base", PersistenceService 생성자 주입 등)을 이어받아도 되는지 확인
   - 의도: 이미 검증된 결정을 처음부터 다시 고민하지 않고 그대로 채택해서, "매 세션 구조 재탐색" 비용을 줄이려는 의도
   - Layer: **State Management**
   - 이 시점에 시스템이 같은 폴더의 `CLAUDE.md`를 자동으로 컨텍스트에 띄움(내가 직접 Read한 게 아님)

5. `mkdir -p src/{main,preload,renderer/components,services,shared} docs` 시도
   - 사용자가 거절함
   - 의도 확인 필요: CLAUDE.md를 참고해도 되는지 사용자에게 재확인받는 과정이 필요했음

6. 사용자가 "CLAUDE.md만 추가로 참고해도 된다"고 확답
   - 참고 파일 범위를 4개 → 5개로 확정

7. `mkdir -p src/{main,preload,renderer/components,services,shared} docs` 재실행
   - 근거: AGENTS.md의 4계층 구조(`src/main/`, `src/preload/`, `src/renderer/`, `src/services/`)를 그대로 폴더로 만듦
   - Layer: **Context Provision**을 실제 폴더 구조로 옮기는 단계

8. `src/shared/types.ts` 작성
   - `IPC_CHANNELS` 상수(`documents:list`, `documents:read`, `qa:ask`) 정의
   - `DocumentSummary`, `QaAnswer` 타입 정의
   - 근거: AGENTS.md "IPC channel names are defined once in `src/shared/types.ts`"
   - Layer: **Context Provision** (규칙을 코드로 구현)

9. `src/services/persistence-service.ts` 작성
   - 생성자에서 `dataDir`, `documents/`, `index/` 세 폴더를 `fs.mkdirSync(..., {recursive:true})`로 생성하는 `ensureDirectories()` 구현
   - 근거: feature_list.json의 `data-directory` feature 설명("creates and manages userData/knowledge-base-data directory")을 구현 목표로 삼음
   - Layer: **Task Specification**(feature_list.json이 정한 요구사항)을 코드로 충족

10. `src/services/document-service.ts` 작성
    - `list()` — documents 폴더에서 `.md`/`.txt` 파일만 걸러 이름·크기·수정시각 반환
    - `read(id)` — 경로 조작(path traversal) 방지를 위해 `path.dirname(filePath) !== dir`이면 에러 던지게 구현
    - 근거: AGENTS.md "Each service receives PersistenceService via constructor injection"
    - Layer: **Context Provision**

11. `src/services/qa-service.ts` 작성
    - 질문을 소문자·단어 단위로 쪼개고 불용어(stopword) 제거
    - 문서를 문단 단위로 쪼개서 겹치는 단어 수로 점수 매기고 상위 3개 반환
    - 근거: 참고한 5개 파일 어디에도 "LLM을 써라"는 지시가 없어서, task-prompt.md 원문 그대로 로컬 키워드 검색으로 처리
    - Layer: **Task Specification**(요구사항 범위를 임의로 확장하지 않음)

12. `src/main/ipc-handlers.ts` 작성
    - `IPC_CHANNELS`의 3개 채널에 각각 documentService/qaService 메서드 연결
    - 근거: CLAUDE.md 파일-용도 표에서 `src/main/ipc-handlers.ts` = "IPC channel registration"으로 분리돼 있는 구조를 그대로 채택
    - Layer: **Context Provision** (CLAUDE.md가 지정한 파일 분리 방식을 그대로 따름)

13. `src/main/main.ts` 작성
    - `BrowserWindow` 1200x800, `contextIsolation: true`, `nodeIntegration: false`, title "Knowledge Base"로 생성
    - `app.getPath('userData')/knowledge-base-data`를 데이터 경로로 넘겨 서비스 3개 초기화
    - 근거: feature_list.json의 window-launch evidence 수치(1200x800 등) + claude-progress.md의 "창 제목 Knowledge Base" 결정을 그대로 반영
    - Layer: **Task Specification**(feature_list.json 수치) + **State Management**(이전 세션 결정 재사용)

14. `src/preload/preload.ts` 작성
    - `contextBridge.exposeInMainWorld('knowledgeBase', {...})`로 `documents.list`, `documents.read`, `qa.ask` 세 개 노출
    - 근거: feature_list.json evidence에 있던 API 이름(`window.knowledgeBase.qa.ask`)을 그대로 사용
    - Layer: **Task Specification**(정해진 API 계약을 그대로 구현)

15. `src/renderer/types.d.ts` 작성
    - `window.knowledgeBase` 전역 타입 선언
    - 근거: AGENTS.md "Uses the type declarations in types.d.ts"
    - Layer: **Context Provision**

16. `src/renderer/components/DocumentList.tsx` 작성
    - 문서가 0개면 "No documents yet..." 빈 상태 메시지, 있으면 목록 렌더링
    - 근거: feature_list.json의 document-list evidence("renders empty state when no documents, shows document cards when data present")를 그대로 구현
    - Layer: **Task Specification** + **Verification Feedback**(나중에 이 조건 자체가 검증 기준이 됨)

17. `src/renderer/components/QuestionPanel.tsx` 작성
    - 텍스트 입력 + Ask 버튼, Enter 키로도 제출되게 `onKeyDown`에서 `event.key === 'Enter'` 체크
    - 근거: feature_list.json의 question-panel evidence("submits to window.knowledgeBase.qa.ask on Enter or click")
    - Layer: **Task Specification**

18. `src/renderer/App.tsx` 작성
    - 마운트 시 `window.knowledgeBase.documents.list()` 호출, 문서 클릭 시 `documents.read(id)`로 본문 불러오기
    - DocumentList와 QuestionPanel을 좌/우 레이아웃으로 조립

19. `src/renderer/main.tsx` 작성
    - `createRoot(document.getElementById('root')).render(<App />)`로 React 마운트

20. `src/renderer/index.html` 작성
    - `<div id="root">` + `<script type="module" src="./main.tsx">`

21. `src/renderer/styles.css` 작성
    - 좌측 사이드바 220px, 하단 질문패널 280px 고정 높이 등 레이아웃 스타일

22. `package.json` 작성
    - `check`, `build`, `dev`, `start` 스크립트 정의
    - electron/react/vite/typescript 등 의존성 명시
    - 근거: init.sh가 요구하는 `check`/`build` 스크립트 이름, CLAUDE.md의 `npm run dev`(scripts/dev.js 경유) 이름을 그대로 맞춤
    - Layer: **Execution Environment**

23. `tsconfig.json` 작성 — 렌더러용 (strict, jsx: react-jsx, noEmit)
    - Layer: **Execution Environment**

24. `tsconfig.node.json` 작성 — main/preload/services용 (module: CommonJS, outDir: dist)
    - Layer: **Execution Environment**

25. `vite.config.ts` 작성 — 렌더러를 `dist/renderer`로 빌드하도록 설정
    - Layer: **Execution Environment**

26. `mkdir -p scripts`

27. `scripts/dev.js` 작성
    - `execSync('npm run build')` 후 `spawn(electron, ['.'])`로 실행
    - 근거: CLAUDE.md "npm run dev # Build + launch Electron (via scripts/dev.js)"
    - Layer: **Context Provision**(CLAUDE.md 지시) + **Execution Environment**(실제 실행 스크립트)

28. `init.sh` 작성 — 원본 그대로 복사
    - 근거: 하니스 파일 자체이므로 새 solution 위치에도 있어야 `bash init.sh`가 여기서도 그대로 동작함
    - Layer: **Execution Environment** + **State Management**(다음 세션도 같은 하니스를 쓸 수 있게 남겨둠)

29. `chmod +x init.sh`

30. `AGENTS.md` 작성 — 원본 그대로 복사
    - 근거: 규칙 파일이므로 새 위치에도 남겨서 다음 세션이 다시 읽을 수 있게 함
    - Layer: **State Management**(규칙을 다음 세션으로 이어지게 함)

31. `CLAUDE.md` 작성 — 원본 그대로 복사 (사용자가 참고 허용해서 하니스 파일로 같이 이동시킴)
    - Layer: **State Management**

32. `docs/ARCHITECTURE.md` 작성
    - 내가 실제로 만든 4계층 구조를 직접 서술 (참고 저장소의 원본 docs/ARCHITECTURE.md는 안 읽었으므로 새로 씀)
    - 근거: AGENTS.md Startup Rules 2번이 이 파일의 존재를 전제로 함
    - Layer: **Context Provision**(다음 세션을 위한 문서화)

33. `docs/PRODUCT.md` 작성
    - task-prompt.md 원문 + 4개 feature 요약 + "범위 밖(파일 업로드 UI, LLM 답변 등)" 명시, 직접 서술
    - Layer: **Task Specification**(요구사항 범위를 문서로 고정)

34. `npm install`
    - 검증: package.json에 적은 의존성이 실제로 설치되는지 확인
    - 결과: 134개 패키지 설치됨 (3 vulnerabilities는 경고 수준, 무시)
    - Layer: **Execution Environment**

35. `npm run check`
    - 검증: AGENTS.md Definition of Done 1번("TypeScript compiles without errors") 통과 여부 확인
    - 결과: 에러 출력 없음 → 통과
    - Layer: **Verification Feedback**

36. `npm run build`
    - 검증: init.sh의 build 단계(`tsc -p tsconfig.node.json && vite build`)가 실제로 성공하는지 확인
    - 결과: `33 modules transformed`, `dist/renderer/index.html`, `assets/index-*.js` 등 정상 생성 → 통과
    - Layer: **Verification Feedback**

37. `find dist -maxdepth 3`
    - 검증: `main.ts`에서 기대한 상대경로(`../preload/preload.js`, `../renderer/index.html`)가 빌드 결과물과 실제로 맞는지 파일 트리로 직접 확인
    - 결과: `dist/main/main.js`, `dist/preload/preload.js`, `dist/services/*.js`, `dist/renderer/index.html` 등 예상한 구조와 일치
    - Layer: **Verification Feedback**

38. `(env -u ELECTRON_RUN_AS_NODE npx electron . > /tmp/electron-solution-run.log 2>&1 &) ; sleep 4; pkill ...; cat 로그`
    - 검증: AGENTS.md Definition of Done 2번("The app launches and the window is visible") 1차 확인 시도
    - 결과: 로그가 비어있음 — 에러는 없었지만, 창이 진짜 떴는지 프로세스 단위로는 확신이 안 서서 재검증하기로 함
    - Layer: **Verification Feedback**

39. `(env -u ELECTRON_RUN_AS_NODE npx electron . ...) ; sleep 2; ps aux | grep Electron.app; sleep 2; pkill ...; cat 로그`
    - 검증: 38번을 더 확실히 하기 위해, 죽이기 전에 `ps aux`로 실제 프로세스 목록을 확보
    - 결과: main 프로세스 + Renderer 헬퍼 + GPU 헬퍼 + network 헬퍼까지 전부 살아있는 걸 확인 → 창이 실제로 정상 기동했다는 확실한 증거
    - 로그에 남은 `GPU process exited unexpectedly`, `Network service crashed` 메시지는 내가 `pkill`로 강제 종료해서 생긴 부수 효과지, 앱 자체 에러가 아니라고 판단
    - Layer: **Verification Feedback**

40. `find "/Users/ellahwang/Library/Application Support/knowledge-base/knowledge-base-data"`
    - 검증: `data-directory` feature가 실제로 폴더를 만드는지 파일시스템에서 직접 확인
    - 결과: `documents/`, `index/` 하위 폴더까지 생성된 것 확인
    - Layer: **Verification Feedback**

41. `cat > .../documents/welcome.md << EOF ... EOF` + `node -e "...PersistenceService(DATA_DIR.replace('/knowledge-base-data',''))..."`
    - 검증: `document-list`/`question-panel`의 실제 로직(서비스 계층)을 GUI 없이 직접 호출해서 확인하려던 1차 시도
    - 결과: `documents: []`, `answers: []` — 빈 배열이 나와서 실패. 경로에 불필요한 `.replace(...)`를 넣어서 `PersistenceService`가 엉뚱한 폴더를 보고 있었던 게 원인
    - Layer: **Verification Feedback**

42. `node -e "...PersistenceService(process.argv[1])..." "$DATA_DIR"`
    - 검증: 41번의 원인(잘못된 경로 조합)을 고치고 재확인
    - 결과: `documents.list()`가 방금 넣은 `welcome.md`를 정확히 반환, `qa.ask(...)`도 관련 문단 2개를 점수순(2점, 1점)으로 정확히 반환 → 서비스 로직 정상 동작 확인
    - Layer: **Verification Feedback**

43. `rm -f ".../documents/welcome.md"`
    - 검증용으로 넣었던 샘플 파일 제거 — feature_list.json이 요구하는 "기본은 빈 상태(empty state)"를 지키기 위해
    - Layer: **Verification Feedback**(테스트 부산물 정리)

44. `feature_list.json` 작성 (갱신)
    - 4개 feature 전부 `status: pass`로 갱신, evidence에 34~42번에서 실제로 확인한 내용을 그대로 기록, `testedAt`은 실제 검증 시각
    - 근거: AGENTS.md "Working with the Feature List" — 기능 구현 시 evidence와 함께 pass로 갱신하라는 규칙
    - Layer: **State Management** + **Verification Feedback**

45. `claude-progress.md` 작성
    - 이번 세션에서 한 일, 참고한 5개 파일, 내린 결정, 겪은 이슈(ELECTRON_RUN_AS_NODE), starter(약한 하니스) 실행과의 비교를 세션 로그 형식으로 기록
    - 근거: 참고 파일 5번(claude-progress.md)과 같은 세션 로그 형식을 유지하기 위해
    - Layer: **State Management**

46. `find . -maxdepth 4 -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' | sort`
    - 검증: 최종적으로 계획한 파일 구조가 전부 실제로 존재하는지 통째로 확인
    - 결과: AGENTS.md/CLAUDE.md/claude-progress.md/feature_list.json/init.sh/docs/src/설정 파일까지 계획한 그대로 존재함을 확인
    - Layer: **Verification Feedback**


### `lecture-01`의 다섯 개 Layer로 정리

- **Task Specification**
  - 3, 9, 11, 13, 14, 16, 17, 33번
  - 전부 feature_list.json/docs/PRODUCT.md에서 가져온 구체적 기준을 그대로 구현에 옮긴 단계
- **Context Provision**
  - 1, 7, 8, 10, 12, 15, 27, 32번
  - AGENTS.md·CLAUDE.md의 계층 경계·파일 분리·타입 규칙을 코드/폴더 구조로 옮긴 단계
- **Execution Environment**
  - 2, 22~26, 28, 34번
  - init.sh가 요구한 스크립트 이름·의존성·tsconfig를 맞춘 단계
- **Verification Feedback**
  - 35~44, 46번
  - `npm run check/build`, 프로세스 확인, 데이터 폴더 확인, 서비스 로직 직접 호출까지 전부 여기 해당. lecture-01에서 "No tests, no lint, or verification command"가 실패 원인이라고 했던 것과 반대로, 이번엔 검증 수단이 촘촘히 있어서 "다 했다고 우기는" Verification Gap 없이 각 feature를 실제 증거로 뒷받침할 수 있었음
- **State Management**
  - 4, 13(일부), 28, 30, 31, 44, 45번
  - claude-progress.md/feature_list.json/AGENTS.md/CLAUDE.md를 그대로 복사·갱신해서 다음 세션이 이어받을 수 있게 함

starter(약한 하니스) 실행 때 겪은 "구조를 임의로 추측"하거나 "뭘 검증해야 할지 몰라서 대충 넘어가는" 상황이 거의 없었음. 유일하게 순수하게 새로 겪은 문제는 이 샌드박스 자체의 `ELECTRON_RUN_AS_NODE` 환경변수(Harness 파일 어디에도 안 적혀있던 문제) 뿐

### 3. Compare the two results

```sh
# - Was the task completed?
# - How many retries were needed?
# - Did the agent claim "done" too early?
```

#### Was the task completed?

- Starter
  - window startup, document list, QA panel, data directory 4개 다 구현하고 env -u ELECTRON_RUN_AS_NODE npx electron .로 실제 창 기동까지 확인함(project-01.md 15~18번)
- Solution
  - 같은 4개 feature를 React+TS+Electron 계층 구조로 구현, npm run check/npm run build 통과 + ps aux로 프로세스 확인 + 데이터 폴더 생성 확인 + 서비스 로직 직접 호출까지 검증

#### How many retries were needed?

- Starter
  - 2번의 재시도 — ① timeout 명령어 없음 → 백그라운드+sleep+pkill 방식으로 전략 변경, ② ELECTRON_RUN_AS_NODE=1 때문에 GUI 대신 일반 Node로 실행됨 → 원인 찾아서 env -u로 재시도. 둘 다 Execution Environment 레이어(요구사항이나 컨벤션 문제가 아니라 샌드박스 환경 문제)
- Solution
  - 1번의 재시도 — 서비스 로직 검증용 node -e 스크립트에서 경로 조합을 잘못 짜서(.replace(...) 불필요하게 추가) 빈 배열이 나왔던 것 하나뿐.
  - Electron launch 이슈는 starter에서 이미 겪은 문제라 env -u를 처음부터 바로 적용해서 재시도 없이 한 번에 통과함 → 하니스가 없을 때 배운 걸 하니스가 있을 때는 재발 안 하게 적용한 셈

#### Did the agent claim "done" too early?

- 둘 다 아니오
  - 두 실행 모두 사용자에게 "완료했다"고 보고하기 전에 같은 턴 안에서 실제 실행 확인(프로세스 기동, 데이터 폴더 생성, 서비스 응답)까지 마친 뒤에 보고함. feature_list.json도 실제 검증 결과(에비던스)를 먼저 확보하고 나서 "pass"로 채워 넣음 — "됐다고 우기는" 패턴은 없었음
  - 다만 완전히 별개로, 그 사이 사용자가 다른 레포(learn-harness-engineering)의 README를 열었을 때 제가 그 저장소에 대한 질문으로 잘못 판단해서 답한 적이 있었는데, 이건 "검증 없이 됐다고 우김"이 아니라 "질문 대상 경로를 착각함"에 가까운 실수였음(Task Specification 오해)

starter 쪽 실패는 순수하게 Execution Environment 레이어(샌드박스 환경변수, 없는 명령어)에서만 났고, requirements나 아키텍처를 잘못 짜서 rework한 적은 없었음.

solution 쪽은 하니스 파일들이 Task Specification/Context Provision을 미리 채워줬기 때문에 그 두 축에서의 시행착오는 아예 없었고, 남은 유일한 재시도도 클로드가 직접 짠 검증 스크립트의 버그.