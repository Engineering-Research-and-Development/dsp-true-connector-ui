---
name: functional-slicing
description: Use when the user asks to split a UI requirement, backlog source, issue, roadmap item, or feature request into parallel functional slices for the linked backend project dashboard.
---

# DSP TRUE Connector UI functional slicing workflow

The Copilot-native canonical version of this workflow lives at `.github/skills/functional-slicing/SKILL.md`.

Use this Claude-side file as a compatibility mirror only. Follow the same rules:

- create UI slices for the linked backend dashboard
- slice by routes, screens, operator flows, and visible capabilities
- read this repo's real UI surfaces (`README.md`, `USER_MANUAL.md`, `package.json`, `angular.json`, `src/app/app.routes.ts`)
- seed later UI implementation, QA, and docs work using Angular-native commands and docs

Do not reintroduce backend Java execution examples here.
