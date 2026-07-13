# Lecture 01. Strong Models Don't Mean Reliable Execution

## Harness?

- Harness here means **all the engineering infrastructure beyond the model weights.**

> Anthropic ran a controlled experiment that illustrates the point perfectly. Same prompt ("build a 2D retro game editor"), same model (Opus 4.5), two runs. First run: bare, no support — 20 minutes, $9, the game's core features didn't work. Second run: full harness — a planner, generator, evaluator three-agent architecture — 6 hours, $200, the game was fully playable.

## Where Agents Actually Get Stuck

- **요구사항이 충분하지 않을 때**
  - Agent는 오직 guess만 가능함
  - 결과가 생각한 것과 다르면 토큰과 시간을 더 소모해서 rework 시켜야 함
  - e.g. "Search 기능을 만들어줘" - Full text or structed quries?, Should results be paginated? Highlighted?
- **명시적인 Convention이 없을 때**
  - Agent가 comply할 수 없음
  - e.g. 팀이 SQLAIchemy 2.0 syntax를 표준으로 쓸 때 - Agent는 기본적으로 1.x code만 작성함
  - e.g. 회사에서 모든 API endpoints는 OAuth 2.0 인증을 거쳐야 함 - Agent는 내 Slack에서 공유된 내용을 모름
- **환경 setup이 불완전할 때**
  - 불완전한 환경 setup, missing dependencies, wrong tool versions
  - e.g. Agent는 pip install error, Node version 불일치 문제에서 context window를 낭비함
- **Verification 방법이 없을 때**
  - No tests, no lint, or verification command
  - Context Anxiety: Agent는 context 부족을 감지하면 rush to finish, skip verification steps, and choose a simple solution over the optimal one
- **Cross-session state loss**
  - 모든 새로운 session은 project 구조를 재탐색하고, code organization을 다시 이해해야 함
  - Persistant state를 저장하는 장치가 없는 Agent는 작업 시간이 30분을 초과하는 테스크에서 실패율이 급격히 증가함

## Key Terminology

- **Capability Gap**
  - 벤치마크 성능(SWE-bench Verified)과 실제 작업 성능 사이의 간극
- **Harness**
  - 모델 외부의 모든 것
  - **instructions, tools, environment, state management, verification feedback**
- **Harness-Induced Failure**
  - 모델의 역량은 충분한데 실행 환경에 구조적 결함이 있는 경우
- **Verification Gap**
  - Agent가 자신의 deliverable output에 갖는 자신감과 실제 correctness 간 간극
  - e.g. The agent says "I'm done" when it's not 
- **Diagnostic Loop**
  - harness engineering의 core methodology
  - **Execute, observe failure, attribute to a specific harness layer, fix that layer, re-execute**
- **Definition of Done**
  - command에 의해 검증될 수 있는 조건들을 정의
  - tests pass, lint is clean, type checks pass

## When Things Fail, Fix the Harness First

- Ask yourself: **was the task unclear? Was context insufficient? Were there no verification methods?**
- Map each failure to one of the five defense layers
  - **task specification, context provision, execution environment, verification feedback, state management**
  - **Attribute every failure to a specific layer**

| **Failure Pattern** | **Bottleneck Layer** | **Solution** |
| :--- | :--- | :--- |
| 요구사항을 마음대로 구현함 | Task Specification | 구체적인 Criteria 명시 |
| 기술 스택 버전이나 규칙을 어김 | Context Provision | AGENTS.md, 규칙 문서화 |
| 패키지 설치나 빌드 단계에서 뻗음 | Execution Environment | 의존성 및 툴 버전 고정 |
| 에러 난 코드를 다 했다고 우김 | Verification Feedback | pytest, mypy 같은 검증 명령어 강제 |
| 세션이 끊겨 앞부분 작업을 까먹음 | State Management | progress.md 등으로 Persistant state 저장 |

```
e.g. "Search 기능을 만들어줘" 라고 하는 대신

Completion criteria:
- New endpoint GET /api/search?q=xxx
- Supports pagination, default 20 items
- Results include highlighted snippets
- All new code passes pytest
- Type checking passes (mypy --strict)
```

- **Place an AGENTS.md file in the repo root**
  - **project's tech stack, architectural conventions, and verification commands**
- **Build a diagnostic loop**
  - Treat them as signals that your harness has exposed a defect
- **Each failure, identify the layer, fix it, and never fail that way again**
  - for each task, did it succeed or fail, and which layer caused the failure
  - After a few rounds you'll see which layer is the bottleneck, and you can focus your energy there.

## The Million-Line Experiment

- **break large goals into small building blocks**
  - **design, code, review, test**
  - let the agent assemble them one by one, then use those blocks to compose more complex tasks
- 핵심은 모델을 탓하지 않는 것
  - **"what is the agent still missing, and can that missing capability be supplied in a way that is both understandable and executable?"**

## A More Down-to-Earth Example

- A team used Claude Sonnet to add new API endpoints to a mid-sized Python web app (FastAPI + PostgreSQL + Redis, ~15,000 lines of code).
- "add user preferences endpoints under /api/v2/users."
  - The agent spent 40% of its context window exploring the repo structure
- Later they added AGENTS.md (describing project architecture and tech stack versions), explicit verification commands (pytest tests/api/v2/ && python -m mypy src/), and architecture decision records
  - The same model succeeded in all three independent runs, with ~60% better context efficiency

## Key Takeaways

- When things fail, check the harness first, then the model.
- Every failure is a signal: your harness has a structural defect. Find it and fix it.
- **Work through the five layers systematically: task not clearly defined, insufficient context, misconfigured environment, missing verification, loss of state between sessions.**