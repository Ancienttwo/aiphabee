# Sprint 2.4 Live Operations Evidence Packets

This directory is intentionally empty until external Sprint 2.4 live-operation
evidence is collected.

Accepted files must be named `<gate_id>.evidence.json`, contain only redacted
metadata and `sha256:` evidence refs, and pass:

```sh
npm run check:sprint2-4-live-operations-evidence-packets
```

Use the operator templates under
`deploy/governance/sprint2-4-live-operations-evidence-templates/` as the safe
starting point. Do not commit raw billing payloads, raw workflow payloads, raw
notification payloads, credential material, database URLs, account IDs,
workspace IDs, invoice IDs, customer IDs, payment identifiers, tokens, or
secrets.
