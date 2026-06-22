# MCP Target Client Live E2E Packets

This directory accepts redacted, hash-only live target-client E2E evidence
packets named `<client_name>.e2e.json`.

The directory may remain empty until external target-client runs are available.
Run `npm run check:mcp-target-client-live-e2e-packets` after adding packets.
Accepted packets must contain only `sha256:` hashes and redacted locators.

Start from the templates in
`deploy/mcp/target-client-live-e2e-templates`; do not paste raw API keys, OAuth
tokens, prompts, generated answers, document bodies, Console payloads,
connection strings, database URLs, account IDs, workspace IDs, invoice IDs,
customer IDs, payment identifiers, personal contact details, tokens, or secrets.
