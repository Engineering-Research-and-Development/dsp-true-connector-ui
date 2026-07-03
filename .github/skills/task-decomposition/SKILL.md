---
name: task-decomposition
description: Use when the user asks to break a UI slice, issue, or requirement into implementation-ready Angular tasks with one QA task and one docs task for the linked backend project dashboard.
---

# DSP TRUE Connector UI task decomposition workflow

Decompose a UI functional slice into execution-ready child tasks while preserving the same workflow structure as the backend project.

## Outcome

Produce child issues that:

- live on the linked backend project dashboard in **To Do**
- preserve slice traceability
- create parallel Angular UI workstreams where safe
- always include:
  - one or more implementation tasks
  - exactly one slice-level QA task
  - exactly one slice-level docs task

## Read first

1. `AGENTS.md`
2. `README.md`
3. `USER_MANUAL.md`
4. `package.json`
5. `angular.json`
6. `src/app/app.routes.ts`
7. the source slice issue

## Workflow split

- **Issue creation/status/board placement** happens in the linked backend repo/project.
- **Task content, file paths, commands, and verification** must match this UI repo.

## Decomposition rules

1. Prefer small, agent-sized Angular tasks.
2. Split by coherent UI work such as:
   - screen/component behavior
   - route wiring
   - service/API integration
   - shared state or shared utility work
   - environment/configuration work
   - workflow/CI changes
3. Do not decompose by arbitrary layers if the user-facing change is still mixed together.
4. Make dependencies explicit and keep them acyclic.
5. Preserve the parent slice tag across every child issue.

## Required task families

### Implementation tasks

Use for actual UI code changes. Prompts should reference real files such as:

- `src/app/components/...`
- `src/app/services/...`
- `src/app/models/...`
- `src/app/shared/...`
- `src/app/app.routes.ts`
- `src/environments/...`
- `.github/workflows/ui-*.yml`

### Slice-level QA task

This is the slice-wide verification task. It should focus on:

- `npm run build`
- `npm test -- --watch=false --browsers=ChromeHeadless`
- targeted Angular specs when practical
- `[manual]` browser walkthroughs for changed routes/screens/dialogs/forms
- connectorA/connectorB verification when the slice affects environment-specific behavior

### Slice-level docs task

This is the slice-wide documentation task. It should update only real repo docs:

- `README.md`
- `USER_MANUAL.md`
- `CHANGELOG.md`
- `release_notes.md`

## Verification guidance to seed into child issues

- Prefer existing Angular unit/component/service tests.
- Use browser/manual checks only where automation is not practical.
- For CI/workflow changes, verify against the real UI workflow files in `.github/workflows/`.
- Never seed Maven, Java, TCK, Testcontainers, or backend module validation into UI tasks.

## Do not do this

- do not reference nonexistent backend docs
- do not use backend Java file examples in implementation prompts
- do not create QA/docs tasks that assume backend execution surfaces
- do not collapse QA and docs into implementation tasks
