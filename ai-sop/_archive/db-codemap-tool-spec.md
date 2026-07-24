# db-codemap-tool-spec.md — Deprecated / Merged

This file is kept only as a historical pointer.

The DB Codemap Tool described in earlier SOP drafts has been **merged into the unified `codemap-tool`**. There is no separate DB-only tool or `dbmap` command.

See `codemap-tool-spec.md` for the authoritative spec, and `codemap-tool/README.md` for usage. One command generates both the codebase map and the DB map together:

```bash
node codemap-tool/bin/cli.js generate <path>
```
