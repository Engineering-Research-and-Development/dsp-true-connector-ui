---
name: task-decomposition
description: Use when the user asks to break a UI slice, issue, or requirement into implementation-ready Angular tasks with one QA task and one docs task for the linked backend project dashboard.
---

# DSP TRUE Connector UI task decomposition workflow

The Copilot-native canonical version of this workflow lives at `.github/skills/task-decomposition/SKILL.md`.

This mirror exists for Claude compatibility only. Keep it aligned with the canonical file:

- issue/task management happens on the linked backend dashboard
- file paths, prompts, and verification must match this Angular UI repo
- implementation tasks reference `src/app/...`, `src/environments/...`, or `.github/workflows/ui-*.yml`
- QA tasks use `npm run build`, `npm test -- --watch=false --browsers=ChromeHeadless`, and explicit browser walkthroughs only when needed
- docs tasks update `README.md`, `USER_MANUAL.md`, `CHANGELOG.md`, and `release_notes.md`
