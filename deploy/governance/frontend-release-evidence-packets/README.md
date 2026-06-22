# Frontend Release Evidence Packets

This directory is intentionally empty until Claude-owned frontend evidence is
available.

## Frontend release evidence intake readiness

Copy a template from `deploy/governance/frontend-release-evidence-templates/`
into this directory only after the surface has redacted hash-only evidence. The
packet filename must match `<surface_id>.evidence.json`.

| Surface ID | Packet file | Blocks | Required proof |
|---|---|---|---|
| `agent_ask_progress_ui` | `agent_ask_progress_ui.evidence.json` | Sprint 1.3 / AGT-01 | Ask route rendered, public progress events visible, live or guarded stream hash, keyboard/loading/error states, redaction review |
| `agent_evidence_card_ui` | `agent_evidence_card_ui.evidence.json` | Sprint 1.3 / AGT-07 | Clickable evidence cards rendered, source metadata visible, missing-source blocking state, evidence card route or component test, redaction review |
| `comparison_screening_ui` | `comparison_screening_ui.evidence.json` | Sprint 2.1 / ANA-01 ANA-03 ANA-04 | 2-5 security comparison flow, screening condition editor flow, why/rejected reason rendering, responsive route or component test, redaction review |
| `research_library_ui` | `research_library_ui.evidence.json` | Sprint 2.2 / RES-01 RES-02 | Saved research library rendered, run snapshot detail rendered, replay diff state rendered, private share entrypoints guarded, redaction review |
| `developer_console_ui` | `developer_console_ui.evidence.json` | Sprint 2.3 / MCP-09 | Connection wizard rendered, API key/OAuth scope/quota logs rendered, request_id and usage fields visible, target-client example flow rendered, redaction review |
| `wcag_2_1_aa_audit` | `wcag_2_1_aa_audit.evidence.json` | Sprint 3.2 / WCAG-2.1-AA | Keyboard navigation passed, contrast/high-contrast audit passed, chart text summary passed, focus/form-state audit passed, redaction review |

Accepted packets must use `redacted_no_secrets`, have empty
`missing_evidence`, include at least 3 `artifact_hashes`, and provide every
required hash field as a `sha256:` reference:

- `frontend_handoff_hash`
- `screenshot_hash`
- `route_test_hash`
- `accessibility_audit_hash`
- `build_output_hash`
- `review_summary_hash`

The packet can reference evidence by hash or redacted locator only. It must not
include raw screenshots, base64 images, raw DOM/HTML, raw API keys, OAuth tokens,
Console payloads, connection strings, account IDs, workspace IDs,
payment identifiers, personal contact data, prompts, responses, or environment
values.

Forbidden field names and payload classes:

- `raw_screenshot`
- `base64_screenshot`
- `raw_dom`
- `raw_html`
- `raw_prompt`
- `raw_generated_answer`
- `raw_response`
- `raw_api_key`
- `oauth_access_token`
- `oauth_refresh_token`
- `raw_console_payload`
- `connection_string`
- `hyperdrive_connection_string`
- `account_id`
- `workspace_id`
- `payment_identifier`
- `personal_contact`
- `env_value`

Run:

```sh
npm run check:frontend-release-evidence-packets
npm run check:frontend-release-evidence-packet-fixtures
npm run check:frontend-release-evidence-handoff
npm run check:p0-open-requirement-transition-review
npm run check:sprint-completion-audit
npm run check:sprint-exit-gate-transition-review
npm run check:mainline-publication-readiness
```
