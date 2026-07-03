---
name: task-implementation
description: Use when the user asks to start implementing a Ready task from the linked backend project dashboard and carry the Angular UI work in this repository through verification and PR handoff.
---

# DSP TRUE Connector UI task implementation workflow

The Copilot-native canonical version of this workflow lives at `.github/skills/task-implementation/SKILL.md`.

This mirror stays intentionally short:

- intake and board updates come from the linked backend dashboard
- code, tests, docs, workflows, and PRs happen in this UI repo
- read `AGENTS.md`, `README.md`, `USER_MANUAL.md`, `package.json`, `angular.json`, `src/app/app.routes.ts`, and the task body before editing
- implement using Angular/UI surfaces, not backend Java examples
- verify with existing UI commands such as `npm run build` and `npm test -- --watch=false --browsers=ChromeHeadless`
- use `[manual]` browser checks only when the task changes visible UI behavior that is not practical to automate immediately
