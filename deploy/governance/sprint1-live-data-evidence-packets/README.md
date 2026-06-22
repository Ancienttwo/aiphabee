# Sprint 1.1 Live Data Evidence Packets

This directory is intentionally empty until external Sprint 1.1 activation
evidence is collected.

Accepted files must be named `<gate_id>.evidence.json`, contain only redacted
metadata and `sha256:` evidence refs, and pass:

```bash
npm run check:sprint1-live-data-evidence-packets
```

Use the operator templates under
`deploy/governance/sprint1-live-data-evidence-templates/` as the safe starting
point. Do not commit raw partner rows, raw database values, billing payloads,
database URLs, account IDs, workspace IDs, invoice IDs, tokens, or secrets.
