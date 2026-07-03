---
name: task-implementation
description: Use when the user asks to start implementing a Ready task from the linked backend project dashboard and carry the Angular UI work in this repository through verification and PR handoff.
---

# DSP TRUE Connector UI task implementation workflow

This is the canonical single-task execution path for UI work.

## Outcome

Start from a **Ready** task on the linked backend project dashboard and end with:

- a selected unblocked task implemented in this UI repo
- verification completed with existing UI commands
- docs updated if the task family requires it
- a PR prepared in this UI repository
- the task moved forward on the backend dashboard

## Read first

1. `AGENTS.md`
2. `README.md`
3. `USER_MANUAL.md`
4. `package.json`
5. `angular.json`
6. `src/app/app.routes.ts`
7. `src/app/app.config.ts`
8. the selected issue, including dependencies, prompt, agent instructions, and verification checklist
9. the directly relevant component, service, model, shared utility, environment, or workflow files

## Workflow split

- **Task intake, assignment, and project-board updates** happen on the linked backend repo/project.
- **Implementation, tests, docs, workflows, and PRs** happen in this UI repo.

## Task-family routing

### Implementation task

Produce Angular UI code in the requested scope.

Typical surfaces:

- `src/app/components/...`
- `src/app/services/...`
- `src/app/models/...`
- `src/app/shared/...`
- `src/app/app.routes.ts`
- `src/environments/...`
- `.github/workflows/ui-*.yml`

### Slice-level QA task

The verification checklist is the work. Focus on:

- `npm run build`
- `npm test -- --watch=false --browsers=ChromeHeadless`
- targeted spec runs where practical
- `[manual]` browser walkthroughs for changed screens/routes/dialogs/forms
- connectorA/connectorB verification if relevant

Do not write product code in a QA task unless the task explicitly scopes a test artifact update.

### Slice-level docs task

Update only real docs in this repo:

- `README.md`
- `USER_MANUAL.md`
- `CHANGELOG.md`
- `release_notes.md`

Do not write product code in a docs task unless the task explicitly justifies a doc-linked fix.

## Verification policy

Use existing repo commands only.

Preferred checks:

- build: `npm run build`
- tests: `npm test -- --watch=false --browsers=ChromeHeadless`
- targeted spec execution when the runner supports it and the task is narrow
- `[manual]` UI walkthroughs where browser behavior is the thing being changed
- workflow validation through the real UI workflow files when `.github/workflows/` changes

If a task affects local/demo runtime behavior, verify the relevant connectorA/connectorB path as part of the checklist.

## Ambiguity handling

Stop and clarify before editing when the task leaves uncertainty about:

- which route/screen/flow is in scope
- whether the task affects connectorA, connectorB, or both
- whether the change belongs in a component, service, shared helper, environment, or workflow
- whether the required docs are `README.md`, `USER_MANUAL.md`, `CHANGELOG.md`, or `release_notes.md`

## Do not do this

- do not use Maven, Java, TCK, Testcontainers, or Spring Boot validation language
- do not reference nonexistent backend docs
- do not treat backend project-board actions as if they happen in this repo
- do not open PRs in the backend repo for UI code that lives here
