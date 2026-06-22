# Live Smoke Capture Packets

Future credentialed live smoke runs may place redacted packet files in this
directory using:

```text
<capture_id>.capture.json
```

Only metadata and hash-only evidence refs are allowed. Do not commit raw command
outputs, account IDs, resource IDs, API tokens, OTLP headers, provider outputs,
prompts, model output text, or environment values.

Run this non-networked checker before moving evidence into the live smoke
ledger:

```bash
npm run check:live-smoke-capture-packets
```

An empty directory is valid while external env is missing. Any JSON packet added
here is treated as release evidence and must pass strict validation.
