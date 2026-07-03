---
name: functional-slicing
description: Use when the user asks to split a UI requirement, backlog source, issue, roadmap item, or feature request into parallel functional slices for the linked backend project dashboard.
---

# DSP TRUE Connector UI functional slicing workflow

Use this workflow to turn UI requirements into functional slices while keeping the same staged process as the backend project.

## Outcome

Create slice issues that:

- represent **user-visible UI capabilities or flows**, not technical layers
- are managed on the linked backend GitHub project dashboard in **Backlog**
- remain traceable to the source requirement
- seed later UI-focused decomposition into implementation, QA, and docs tasks

## Read first

1. `AGENTS.md`
2. `README.md`
3. `USER_MANUAL.md`
4. `package.json`
5. `angular.json`
6. `src/app/app.routes.ts`
7. the source issue, requirement, or roadmap item

## Workflow split

- **Board and issue management** happens in the linked backend repo/project.
- **Repository facts and implementation surfaces** come from this UI repo.

## Choice-first rule

Before creating slices, offer **exactly 3 viable slicing choices**.

Each choice must:

1. use a different slicing lens
2. identify likely parallel streams
3. call out the main tradeoff
4. stay focused on Angular UI behavior and operator flows

## UI slicing rules

1. Slice by **screen, route, operator workflow, or visible capability**, not by component/service/file type alone.
2. Prefer boundaries such as:
   - catalog browsing vs management flows
   - dataset/distribution/service management
   - contract negotiation UI
   - data transfer UI
   - audit/configuration/admin flows
   - shared UI enablers such as auth, environments, or navigation only when they are truly shared prerequisites
3. Keep slices independent where possible so later child tasks can run in parallel.
4. If a slice affects connectorA/connectorB runtime differences, say so explicitly.
5. Seed later QA with UI verification scopes such as route navigation, dialog behavior, form validation, state updates, browser flows, and environment-specific behavior.
6. Seed later docs with real repo docs: `README.md`, `USER_MANUAL.md`, `CHANGELOG.md`, `release_notes.md`.

## Required slice content

Each slice should state:

- the user-facing outcome
- in-scope routes/screens/flows
- out-of-scope boundaries
- related slices and handoffs
- dependencies only when truly required
- likely implementation task families
- slice-level QA scope
- slice-level docs scope

## Coverage audit

Before finishing:

1. normalize the source into concrete UI requirement items
2. map every item to at least one slice
3. ensure no requirement item is left uncovered
4. ensure no slice is just a technical-layer bucket

## Do not do this

- do not slice by component/service/model layer only
- do not use backend module names as UI boundaries
- do not seed backend-only verification such as Maven, TCK, or Testcontainers
- do not point later docs work at nonexistent `doc/` files
