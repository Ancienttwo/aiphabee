# Gate 0 Signed Evidence Packets

This directory is the redacted intake surface for signed Gate 0 evidence.

Copy a template from `deploy/governance/gate0-signed-evidence-templates/` into
this directory as `<packet_id>.evidence.json` only after the external artifact
exists and has been redacted. The packet checker allows this directory to stay
empty while evidence is still external and pending.

Do not commit raw legal memos, raw contracts, raw vendor documents, credentials,
account identifiers, database URLs, bearer tokens, or unredacted source payloads.
Use redacted source locators and hex `sha256` hashes only.

Run the packet and transition gates before editing Sprint status:

```bash
npm run check:gate0-signed-evidence-packets
npm run check:gate0-signed-evidence-packet-fixtures
npm run check:gate0-signed-evidence-handoff
npm run check:gate0-signed-evidence-manifest
npm run check:gate0-signed-evidence-transition-review
npm run check:sprint-completion-audit
```

Packet status meanings:

- `missing`: no accepted external evidence exists yet; evidence refs must stay
  empty.
- `submitted`: a redacted packet has arrived but has not been accepted into the
  manifest.
- `accepted`: the packet can be promoted into
  `deploy/governance/gate0-signed-evidence-manifest.contract.json` after the
  matching manifest checker passes.
- `rejected` / `superseded`: the packet cannot unlock Gate 0.

The Sprint 0.1 checkbox remains blocked until every required packet is accepted
in the manifest and `release_transition_allowed=true`.
