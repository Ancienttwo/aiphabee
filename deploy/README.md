# Deployment Operations

`deploy/` is a commit-ready surface for deployment and operations runbooks, submission materials, release checklists, helper scripts, and env examples.

## Track

- `deploy/scripts/` for operational scripts.
- `deploy/submissions/` for submission or review materials.
- `deploy/runbooks/` and `deploy/release-checklists/` for operational documentation.
- `deploy/database/` for database migration contracts and no-secret manifests.
- `deploy/model-providers/` for no-secret model provider and AI Gateway contracts.
- `deploy/secrets/` for secret-store contracts and no-secret rotation runbooks.
- `deploy/sql/` for ordered deployment SQL files named like `0001_create_tables.sql`.
- `deploy/*.md` for runbooks and operating notes.
- `deploy/env/.env.example` for documented variable shapes only.

## Do Not Track

- `_ops/`
- private keys, real env files, provider state, production tokens, credential dumps, artifacts, logs, and local-only overrides

Keep external upstream checkouts and source references in `_ref/`; `_ref/` is ignored and must stay out of commits.
