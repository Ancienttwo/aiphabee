# P0 Open Requirement Evidence Templates

Copy one template into
`deploy/governance/p0-open-requirement-evidence-packets` after evidence exists.
Keep status as `missing_external_evidence` until all requirement-specific
evidence names are represented by redacted `sha256:` hashes and
`redaction_status` is `redacted_no_secrets`.

Templates:

- `AGT-01.evidence.json`
- `AGT-07.evidence.json`
- `MCP-09.evidence.json`

Run:

```sh
npm run check:p0-open-requirement-evidence-packets
npm run check:p0-open-requirement-evidence-handoff
```
