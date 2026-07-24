# context/ — Generated Per Project

This folder holds the context files **generated from `../sops/`** for one specific project. In the master copy of the package it is empty except for this note.

- Files here are produced by attaching `sops/sop-init.md` and running initialization (tier detection → codemap generation → per-SOP generation).
- Each file here maps to exactly one SOP in `../sops/` (see the table in `../README.md`).
- Files here contain **only the current project's tier rules**, filled from the actual repo/codemap.
- Regeneration updates these files in place — repo-derived sections refresh, filled project decisions are preserved.
- Never edit `../sops/` to change project behavior — project specifics live here.
