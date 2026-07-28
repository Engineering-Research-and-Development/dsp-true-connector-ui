# DSP TRUE Connector UI repository instructions

## Core rule

This is an Angular UI repository. Do not apply backend-only guidance copied from the Java connector project.

## Read first

- `AGENTS.md`
- `README.md`
- `USER_MANUAL.md`
- `package.json`
- `angular.json`
- `src/app/app.routes.ts`
- `src/app/app.config.ts`
- `.github/workflows/ui-pr-build.yml`
- `.github/workflows/ui-develop-build.yml`
- `.github/workflows/ui-release-build.yml`

## Repo facts

- Angular 19 frontend with standalone components
- Angular Material UI
- Environment-driven API URLs in `src/environments/`
- Main app structure under `src/app/components/`, `src/app/services/`, `src/app/models/`, and `src/app/shared/`
- Connector A / Connector B local configurations are part of the supported workflow

## Commands

- Install: `npm ci`
- Build: `npm run build`
- Test: `npm test -- --watch=false --browsers=ChromeHeadless`
- Watch build: `npm run watch`
- Local UI instances: `ng serve --configuration connectorA` and `ng serve --configuration connectorB`

## Workflow split

- Use the linked backend GitHub repo/project for task-management and board-state operations.
- Use this UI repo for implementation, verification, docs, CI workflow changes, and release behavior.

## Do not reference

- Maven commands
- Java conventions
- TCK/Testcontainers guidance
- Spring Boot module structure
- nonexistent `doc/` paths from the backend repo

## Prefer

- route-aware UI slices and tasks
- existing services/models/shared helpers
- environment-based connector endpoint handling
- real UI workflows under `.github/workflows/ui-*.yml`
- UI docs: `README.md`, `USER_MANUAL.md`, `CHANGELOG.md`, `release_notes.md`
