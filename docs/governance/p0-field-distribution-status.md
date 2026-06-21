# P0 Field Distribution Status

Status: local Gate 0 distribution-status closeout.

## Scope

This closes the repo-verifiable part of Sprint 0.1 that requires each P0 field
group to carry explicit Web, MCP/API redistribution, export, and derived-use
status labels.

## Evidence

- `deploy/gateway/p0-rights-matrix-coverage.contract.json` defines the P0 rights
  coverage route and release gate.
- `packages/data-access-gateway/src/index.ts` exposes the P0 dataset field
  groups and keeps each group default-deny until a partner matrix is signed.
- `deploy/tools/registry.contract.json` defines the 16 rights-aware P0 tools.
- `deploy/governance/p0-field-distribution-status.contract.json` maps every P0
  dataset group to Web/MCP/export/derived default-deny statuses.

## Not Claimed

This does not claim a signed partner matrix, HKEX/vendor license conclusion,
live rights DB reads, commercial settlement terms, or Gate 0 signoff.
