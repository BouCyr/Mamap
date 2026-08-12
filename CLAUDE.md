# CLAUDE.md

Instructions for Claude Code (and any other assistant) working in this repo.

## Project

Mamap generates fictional city maps: a 3D city model, flattened into a final
2D map. Read these before making any change:

- [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) — goals, constraints, phased
  roadmap.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — module layout, data
  contracts between pipeline stages, coding conventions.

Follow the phase order in `PROJECT_PLAN.md` unless told otherwise. Do not
jump ahead to a later phase's work while an earlier one is unfinished.

## Language rule — strict

**Everything written in this project uses plain, simplified English.** This
applies without exception to:

- Code: variable, function, and file names.
- Comments and JSDoc.
- Commit messages and PR descriptions.
- All docs (`docs/`, `README.md`, this file).
- Any UI text, labels, or messages shown to a user.

Rules:

1. Short sentences. One idea per sentence.
2. Common, everyday words. If a simpler word says the same thing, use it.
   - Say "use" not "utilize". Say "start" not "initiate". Say "show" not
     "render" when talking to a user (in code, "render" as a technical term
     for drawing is fine).
3. No jargon, buzzwords, or corporate phrasing ("leverage", "synergy",
   "seamless", "robust solution", "best-in-class").
4. No idioms, metaphors, or culture-specific references. A non-native
   English reader must be able to follow every sentence on first read.
5. Avoid abbreviations and acronyms unless they are standard in this
   codebase and already spelled out once nearby (e.g. introduce "RNG
   (random number generator)" before using "RNG" alone).
6. Active voice, plain tense. "The function returns a list", not "A list is
   returned by the function".
7. Explain *why*, not *what*. Do not write a comment that only restates the
   code in words — if the code is already clear, skip the comment.
8. No filler or hedging ("it might perhaps be possible that", "in some
   sense"). State things directly.

If a sentence needs a second read to understand, rewrite it simpler. When in
doubt, prefer the version a beginner would write over the version that
sounds more advanced.

## Other standing rules (see docs/ARCHITECTURE.md for full detail)

- Plain modern ECMAScript (ES modules). No TypeScript, no framework.
- Dependencies: as few as possible, limited to technical/mathematical
  utility libraries, always pinned to an exact version.
- `src/core/` must stay portable: no DOM, no Node-only APIs. Only
  `src/render/`, `src/cli/`, `src/web/` may be environment-specific.
- Do not add features, abstractions, or error handling beyond what the
  current phase/task needs.
