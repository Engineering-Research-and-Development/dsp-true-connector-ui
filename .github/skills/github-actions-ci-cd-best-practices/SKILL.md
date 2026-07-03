---
name: github-actions-ci-cd-best-practices
description: Use when creating or reviewing GitHub Actions workflows for this Angular UI repository, especially when changing Node builds, tests, Docker image publishing, or release automation.
---

# GitHub Actions CI/CD best practices for DSP TRUE Connector UI

Use this skill for workflow work in this repository.

## Repository-specific anchors

The active workflow surfaces are:

- `.github/workflows/ui-pr-build.yml`
- `.github/workflows/ui-develop-build.yml`
- `.github/workflows/ui-release-build.yml`

These workflows currently use:

- Node 22
- `npm ci`
- `npm run build`
- GHCR Docker image publishing
- release/version automation from `package.json` and `src/environments/*.ts`

## Core rules

1. Keep workflow examples and recommendations anchored to this UI repo, not the backend repo.
2. Use least-privilege `permissions`.
3. Prefer `actions/setup-node@v6` with npm caching where appropriate.
4. Keep build, test, image, and release concerns explicit.
5. When changing release automation, account for both `package.json` and the environment version fields.

## Use this skill when

- a task touches `.github/workflows/*.yml`
- a task changes build/test/release automation
- a task changes Docker image publishing for the UI
- a task needs workflow advice specific to Angular/npm/GitHub Actions

## UI workflow guidance

### Build and test

- install with `npm ci`
- build with `npm run build`
- if tests are added to CI, use the existing Angular/Karma stack rather than inventing a new runner

### Versioning and release flow

- keep `package.json` and `src/environments/*.ts` version values aligned
- treat `.github/workflows/ui-release-build.yml` as the release automation reference
- do not replace UI release logic with backend release examples

### Docker/image publishing

- keep GHCR image names aligned with this repo
- keep Docker build context and Dockerfile references local to this repo

### Security and maintainability

- keep actions pinned to stable versions
- keep workflow `permissions` explicit
- do not introduce secret handling patterns that are broader than necessary

## Do not do this

- do not use Maven/Gradle examples
- do not describe backend connector workflows as if they are this repo's CI surface
- do not point workflow guidance at nonexistent backend docs
