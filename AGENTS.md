# DSP TRUE Connector UI — Agent Instructions

Angular 19 frontend for the DSP TRUE Connector ecosystem. This repository contains the UI application only; task management follows the linked backend GitHub repository/project dashboard, while UI code, tests, workflows, and releases live here.

## Read first

Always ground decisions in the real UI repository, not the backend project copy:

1. `README.md`
2. `USER_MANUAL.md`
3. `CHANGELOG.md`
4. `package.json`
5. `angular.json`
6. `src/app/app.routes.ts`
7. `src/app/app.config.ts`
8. `src/environments/*.ts`
9. `.github/workflows/ui-pr-build.yml`
10. `.github/workflows/ui-develop-build.yml`
11. `.github/workflows/ui-release-build.yml`

## Repository reality

- Framework: Angular 19 with standalone components.
- UI library: Angular Material.
- Runtime model: the UI talks to a connector backend via environment-driven API URLs.
- Dual-instance support: `connectorA` and `connectorB` configurations exist for local/demo flows.
- Main code layout:
  - `src/app/components/` — screens and dialogs
  - `src/app/services/` — HTTP and UI services
  - `src/app/models/` — request/response and UI models
  - `src/app/shared/` — shared helpers, directives, utilities
  - `src/environments/` — environment-specific connector endpoints and version metadata

## Build, test, and run

- Install dependencies: `npm ci`
- Production build: `npm run build`
- Test suite: `npm test -- --watch=false --browsers=ChromeHeadless`
- Local watch build: `npm run watch`
- Run local UI instance A: `ng serve --configuration connectorA`
- Run local UI instance B: `ng serve --configuration connectorB`
- Docker/demo setup lives under `docker/`

Prefer the smallest existing command that proves the changed behavior. For instruction-only changes, consistency checks are usually enough unless the change affects executable workflow files.

## Architecture guidance

- Treat `src/app/app.routes.ts` as the route map and user-flow index.
- Treat `src/app/app.config.ts` as the app-level provider and interceptor wiring point.
- Reuse existing services and models instead of inventing parallel API wrappers.
- Keep environment-driven endpoint construction in `src/environments/`, not scattered across components.
- Preserve the current standalone-component and lazy-loading style where it already exists.
- Keep component logic focused; shared HTTP behavior belongs in services, not copied into screens.

## Workflow model

This repo keeps the same workflow family as the backend project:

- `functional-slicing`
- `task-decomposition`
- `task-implementation`
- `slice-implementation`
- `playwright-cli`
- `github-actions-ci-cd-best-practices`

### Important split of responsibilities

- **Backend GitHub repo/project dashboard**: source of truth for backlog, To Do, Ready, In Progress, In Review, Done, and related issue/task management.
- **This UI repo**: source of truth for Angular code, tests, UI workflows, docs, and release automation.

When a workflow skill mentions project-board actions, issue state transitions, or task intake, those actions refer to the linked backend dashboard. When a workflow skill mentions implementation, testing, CI, workflow files, or releases, those actions must use this repository's real Angular assets.

## Non-negotiable constraints

- Do not reuse backend-only guidance such as Maven commands, Java conventions, TCK runs, Testcontainers, Spring Boot modules, or nonexistent `doc/` references in UI instructions.
- Keep task-management flow compatible with the backend project dashboard, but keep repo-executed steps UI-native.
- Preserve connectorA/connectorB behavior and environment separation when changing startup, configuration, or walkthrough steps.
- Do not hardcode backend endpoints into components; use the environment helpers.
- Update user-facing docs when behavior, setup, runtime configuration, or release behavior changes.
- Update `CHANGELOG.md` when a change is externally meaningful.
- If a task touches `.github/workflows/`, use the UI workflows in this repo as the authoritative execution surface.

## Frontend conventions

- Prefer editing the closest existing component/service/spec instead of adding new abstraction layers.
- Keep route-facing behavior aligned with `app.routes.ts`.
- Prefer deterministic unit/component/service tests over manual-only validation whenever practical.
- Use existing Angular Material patterns already present in the repo.
- Keep browser-verifiable flows explicit when a change affects navigation, forms, dialogs, or connectorA/connectorB runtime differences.

## Documentation surfaces

Use the real docs in this repo:

- `README.md` — contributor and setup entry point
- `USER_MANUAL.md` — operator/demo/runtime usage
- `CHANGELOG.md` — shipped behavior changes
- `release_notes.md` — release-facing notes when applicable

Do not point agents at nonexistent backend-style docs such as `doc/architecture.md`, `doc/development_procedure.md`, or module docs that do not exist in this repository.

## GitHub Actions and release guidance

The active UI workflows are:

- `.github/workflows/ui-pr-build.yml`
- `.github/workflows/ui-develop-build.yml`
- `.github/workflows/ui-release-build.yml`

These workflows use Node 22, `npm ci`, `npm run build`, Docker image publishing, and release/version automation for the UI repository. Any workflow-related skill or instruction must reference these files, not backend CI examples.

## How to adapt backend-derived workflow assets

When rewriting or using workflow skills, issue templates, or mirrors in this repo:

1. keep the same workflow stage intent
2. keep project-dashboard references aimed at the backend repo/project
3. replace all repo-executed examples with Angular/UI paths, commands, tests, and docs
4. replace backend module language with UI language: routes, screens, services, models, shared helpers, environments, and workflows
5. replace backend verification with UI verification: build, Angular tests, and manual browser walkthroughs only where automation is not practical

## Available local workflow assets

- `.github/skills/` — canonical Copilot-native workflow skills for this UI repo
- `.claude/skills/` — compatibility mirrors that should stay aligned with the canonical `.github/skills/` versions
- `.github/ISSUE_TEMPLATE/` — workflow templates adapted to UI work while remaining compatible with the backend dashboard process
- `.agents/skills/brainstorming/` — design/clarification workflow used before implementation when ambiguity remains

## Edge cases

| Scenario | Response |
|---|---|
| A workflow step mentions Maven, TCK, Testcontainers, Spring Boot, or backend Java modules | Treat it as drift and rewrite it for Angular/UI execution |
| A workflow step needs board or issue-state changes | Use the linked backend GitHub repo/project as the dashboard of record |
| A workflow step needs code, tests, docs, CI, or releases | Use this UI repo's files, scripts, and workflows |
| A referenced doc path does not exist in this repo | Replace it with a real UI repo surface or remove the reference |
| A UI change affects navigation or visible behavior | Prefer automated tests when practical; otherwise include explicit manual browser verification |
| A change affects connectorA/connectorB runtime behavior | Verify both environment-specific paths if the change touches startup, routing assumptions, config, or API base URLs |
