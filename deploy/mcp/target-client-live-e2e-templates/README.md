# MCP Target Client Live E2E Handoff Templates

These templates are for the operator or frontend owner who has external live
target-client evidence. They validate as `missing_external_e2e` packets before
execution and must be copied into `deploy/mcp/target-client-live-e2e-packets`
only after replacing the template metadata with redacted, hash-only evidence
from the real MCP target client and Developer Console surfaces.

Operator order:

1. Run `npm run check:mcp-target-client-live-e2e-handoff`.
2. Gather evidence for each target client in this order:
   - `mcp_inspector`
   - `typescript_sdk_client`
   - `claude_desktop`
   - `cursor`
   - `chatgpt_connector`
3. Copy each matching template to `deploy/mcp/target-client-live-e2e-packets`
   as `<client_name>.e2e.json`.
4. Replace `observed_at`, `status`, `client_version`, `request_id`, all hash
   fields, `artifact_hashes`, `operator`, `source_locator`, and
   `redaction_status` with redacted metadata from the external run. Use
   `sha256:` refs only.
5. Run `npm run check:mcp-target-client-live-e2e-packets`.
6. Run `npm run check:mcp-target-client-live-e2e-packet-fixtures` before
   updating any release gate notes.
7. Only after all target-client packets validate as accepted, review
   `deploy/mcp/target-clients-console-release-gate.contract.json`; the release
   gate remains the source of truth for transition state.

Required evidence names per target client:

- `connectivity`
- `initialize`
- `tools_list`
- `tools_call`
- `developer_console_request_log_row`
- `usage_panel_reconciliation`
- `scope_panel_reconciliation`
- `credential_panel_reconciliation`
- `error_panel_reconciliation`
- `redaction_review`

Do not paste raw API keys, OAuth tokens, prompts, generated answers, document
bodies, Console payloads, SQL connection strings, Hyperdrive connection strings,
database URLs, account IDs, workspace IDs, invoice IDs, customer IDs, payment
identifiers, personal contact details, tokens, or secrets into these packets.
