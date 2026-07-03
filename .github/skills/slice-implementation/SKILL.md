---
name: slice-implementation
description: Use when the user asks to execute a fully decomposed UI slice as one coordinated branch and one PR while keeping task management on the linked backend project dashboard.
---

# DSP TRUE Connector UI slice implementation workflow

Use this workflow when the delivery unit is the **entire remaining UI slice**, not one child task.

## Outcome

Starting from a decomposed slice on the linked backend dashboard:

- gather the full child-task set for the slice
- execute implementation children in dependency order inside this UI repo
- complete the slice-level QA task
- complete the slice-level docs task
- open one PR in this UI repository
- move the slice and child tasks forward on the backend dashboard

## Read first

1. `AGENTS.md`
2. `.github/skills/task-implementation/SKILL.md`
3. `README.md`
4. `USER_MANUAL.md`
5. `package.json`
6. `angular.json`
7. `src/app/app.routes.ts`
8. the parent slice issue and all child issues from the linked backend dashboard

## Workflow split

- **Slice membership, board-state, and issue tracking** belong to the backend repo/project.
- **Branching, code integration, tests, docs, and PRs** belong to this UI repo.

## Eligibility

Use slice PR mode only when:

1. the user wants to ship the whole remaining slice together
2. all open child tasks for that slice are included
3. the slice has exactly one QA child and exactly one docs child

## Scheduling rules

1. Build a DAG from implementation child dependencies.
2. Execute runnable implementation batches first.
3. Run the slice QA task only after all implementation children are satisfied.
4. Run the slice docs task only after implementation plus QA are satisfied.

## UI-specific execution rules

- Treat routes, screens, dialogs, services, environments, shared helpers, and workflows as the main execution surfaces.
- Use existing UI verification commands:
  - `npm run build`
  - `npm test -- --watch=false --browsers=ChromeHeadless`
- Include explicit `[manual]` browser checks where automation is not practical.
- Verify connectorA/connectorB differences when the slice touches environment-based behavior or demo/runtime startup flows.

## Docs rules

Slice docs work updates only real repo docs:

- `README.md`
- `USER_MANUAL.md`
- `CHANGELOG.md`
- `release_notes.md`

## Do not do this

- do not keep backend Java execution examples in a UI slice workflow
- do not reference backend-only CI, TCK, or module docs for repo execution
- do not confuse backend dashboard actions with UI repo PR/branch actions
