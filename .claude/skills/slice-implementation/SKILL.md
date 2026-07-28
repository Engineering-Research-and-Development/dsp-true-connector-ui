---
name: slice-implementation
description: Use when the user asks to execute a fully decomposed UI slice as one coordinated branch and one PR while keeping task management on the linked backend project dashboard.
---

# DSP TRUE Connector UI slice implementation workflow

The Copilot-native canonical version of this workflow lives at `.github/skills/slice-implementation/SKILL.md`.

Use the same model here:

- slice membership and board state belong to the linked backend dashboard
- branch, code integration, tests, docs, and PRs belong to this UI repo
- execute implementation tasks first, then QA, then docs
- verify with Angular-native build/test/manual-browser checks
- keep docs work limited to real repo docs such as `README.md`, `USER_MANUAL.md`, `CHANGELOG.md`, and `release_notes.md`
