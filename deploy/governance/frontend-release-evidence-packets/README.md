# Frontend Release Evidence Packets

This directory is intentionally empty until Claude-owned frontend evidence is
available.

Copy a template from `deploy/governance/frontend-release-evidence-templates/`
into this directory only after the surface has redacted hash-only evidence.
Accepted packets must not include raw screenshots, base64 images, raw DOM/HTML,
raw API keys, OAuth tokens, Console payloads, connection strings, account IDs,
workspace IDs, payment identifiers, personal contact data, prompts, responses,
or environment values.

Required packet files:

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
