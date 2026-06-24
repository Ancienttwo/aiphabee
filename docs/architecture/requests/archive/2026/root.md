# Architecture Queue Card: root

> **Status**: Resolved
> **Detected**: 2026-06-24T23:33:53+0800
> **Updated**: 2026-06-25T02:28:50+0800
> **Severity**: medium
> **Change Type**: boundary-or-config
> **File**: `apps/web/src/routes/index.tsx`
> **Functional Block**: `root`
> **Capability ID**: `root`
> **Matched Prefix**: `root`
> **Architecture Domain**: `root`
> **Architecture Capability**: `_root`
> **Architecture Module**: `docs/architecture/index.md`
> **Workstream Directory**: `tasks/workstreams/root/_root`
> **Contract Files**: `none`, `none`
> **Contract Sync Required**: false
> **Spawn Recommended**: false
> **Open Edits**: 11

## Required Follow-up

- Read root `AGENTS.md` / `CLAUDE.md`.
- If functional block is not `root`, read its local `AGENTS.md` / `CLAUDE.md`.
- Decide whether this change affects module boundaries, entrypoints, dependency rules, runtime paths, or verification commands.
- For substantial changes, write a snapshot under `docs/architecture/snapshots/`.
- When a visual explains the boundary better than prose, add or update a Mermaid fenced block in the relevant architecture module or snapshot Markdown first; that Markdown is the semantic source for LLM readers.
- When a human-readable rendering is useful, generate a matching `$mermaid` architecture HTML file under `docs/architecture/diagrams/` and link it back to the Markdown semantic source.
- Treat `mermaid` as an external installed skill dependency at `~/.codex/skills/mermaid`; do not copy, vendor, or inline its templates into this repo.
- If this starts or advances durable execution, run `scripts/workstream-sync.sh ensure --block "root" --request "docs/architecture/requests/root.md"`.
- After the snapshot or diagram is produced, run `scripts/context-contract-sync.sh sync-latest` so the local architecture contract block links to the latest artifacts.

## Touched Files

| Last Event | Severity | Change Type | File |
| --- | --- | --- | --- |
| 2026-06-25T02:28:50+0800 | medium | boundary-or-config | `apps/web/src/routes/index.tsx` |
| 2026-06-25T02:25:57+0800 | medium | boundary-or-config | `apps/web/src/routes/__root.tsx` |
| 2026-06-25T02:21:03+0800 | medium | boundary-or-config | `apps/web/src/routes/ipos/$ipoId.tsx` |
| 2026-06-25T02:20:04+0800 | medium | boundary-or-config | `apps/web/src/routes/documents/index.tsx` |
| 2026-06-25T02:19:55+0800 | medium | boundary-or-config | `apps/web/src/routes/ask/$runId.tsx` |
| 2026-06-25T02:19:47+0800 | medium | boundary-or-config | `apps/web/src/routes/ask/index.tsx` |
| 2026-06-25T02:19:38+0800 | medium | boundary-or-config | `apps/web/src/routes/dashboard.tsx` |
| 2026-06-25T02:15:26+0800 | medium | boundary-or-config | `apps/web/src/routes/compare/index.tsx` |
| 2026-06-25T01:30:44+0800 | medium | boundary-or-config | `apps/web/src/routes/ipos/index.tsx` |
| 2026-06-25T01:29:51+0800 | medium | boundary-or-config | `apps/web/src/routes/ipos/compare.tsx` |
| 2026-06-25T01:27:17+0800 | medium | boundary-or-config | `apps/web/src/routes/ipos/calendar.tsx` |

## Event Fields

```json
{
  "ts": "2026-06-25T02:28:50+0800",
  "file_path": "apps/web/src/routes/index.tsx",
  "severity": "medium",
  "functional_block": "root",
  "capability_id": "root",
  "matched_prefix": "root",
  "architecture_domain": "root",
  "architecture_capability": "_root",
  "architecture_module": "docs/architecture/index.md",
  "workstream_dir": "tasks/workstreams/root/_root",
  "contract_agents": "",
  "contract_claude": "",
  "change_type": "boundary-or-config",
  "request_file": "docs/architecture/requests/root.md",
  "spawn_recommended": false,
  "contract_sync_required": false
}
```

## Archive Resolution

- Status: Resolved
- Archived: 2026-06-25T02:45:57+0800
- Artifacts:
- `docs/architecture/snapshots/20260625-root-web-route-boundary.md`
- Note: Resolved by documenting the root TanStack route shell, IPO workbench route expansion, shared providers, default-deny entitlement boundary, and verification surface.
