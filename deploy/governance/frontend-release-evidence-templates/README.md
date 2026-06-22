# Frontend Release Evidence Templates

Copy one template into
`deploy/governance/frontend-release-evidence-packets` after Claude-owned
frontend evidence exists. Keep status as `missing_frontend_evidence` until all
surface-specific evidence names are represented by redacted `sha256:` hashes and
`redaction_status` is `redacted_no_secrets`.

Templates:

- `agent_ask_progress_ui.evidence.json`
- `agent_evidence_card_ui.evidence.json`
- `comparison_screening_ui.evidence.json`
- `research_library_ui.evidence.json`
- `developer_console_ui.evidence.json`
- `wcag_2_1_aa_audit.evidence.json`

Run:

```sh
npm run check:frontend-release-evidence-packets
npm run check:frontend-release-evidence-packet-fixtures
npm run check:frontend-release-evidence-handoff
```
