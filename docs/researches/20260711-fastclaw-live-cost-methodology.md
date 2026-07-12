# FastClaw Cloudflare Sandbox live cost methodology

> Price readback: 2026-07-11. Currency: USD. This document is a raw list-price
> methodology, not an invoice allocation. Row 10 keeps per-run
> `allocated_invoice_cost_usd=null` unless Billing Read plus an explicit
> allocation policy can attribute account-period cost to these runs.

## Current official rates

- Workers Paid base: $5/month. Includes 10M Worker requests and 30M Worker CPU
  ms; overage is $0.30/M requests and $0.02/M CPU ms. Workers Logs includes 20M
  events/month, then $0.60/M.
- Durable Objects Paid includes 1M requests and 400,000 GB-s/month; overage is
  $0.15/M requests and $12.50/M GB-s.
- Containers: $0.0000025/GiB-s memory, $0.000020/vCPU-s active CPU and
  $0.00000007/GB-s disk. `standard-1` provisions 4 GiB memory, 0.5 vCPU and 8 GB
  disk. Everywhere-else egress is $0.04/GB after the 500 GB monthly allotment.
- R2 Standard: $0.015/GB-month, $4.50/M Class A, $0.36/M Class B, free egress.
  Standard monthly free tier is 10 GB-month, 1M Class A and 10M Class B.
- Hyperdrive queries, pooling and caching have no additional charge on Workers
  Paid; PlanetScale database charges remain separate.

Sources: [Containers](https://developers.cloudflare.com/containers/pricing/),
[Workers, Durable Objects and Logs](https://developers.cloudflare.com/workers/platform/pricing/),
[R2](https://developers.cloudflare.com/r2/pricing/),
[Hyperdrive](https://developers.cloudflare.com/hyperdrive/platform/pricing/),
[Billable usage](https://developers.cloudflare.com/billing/manage/billable-usage/).

## Per-run formula

For one measured run, before account-wide included allotments:

```text
container_memory = memory_gib_seconds * 0.0000025
container_cpu    = active_vcpu_seconds * 0.000020
container_disk   = disk_gb_seconds * 0.00000007
container_egress = egress_gb * regional_rate
worker           = requests / 1M * 0.30 + cpu_ms / 1M * 0.02
durable_object   = requests / 1M * 0.15 + gb_seconds / 1M * 12.50
logs             = events / 1M * 0.60
r2               = class_a / 1M * 4.50 + class_b / 1M * 0.36
                   + gb_month_equivalent * 0.015
raw_list_cost    = sum(all components)
```

The packet must keep raw marginal list cost separate from allocated invoice
cost. Monthly included allotments are account-wide and non-additive: subtracting
the full free/included tier from every run would understate cost, while ignoring
it would overstate the invoice. `allocated_invoice_cost_usd` therefore requires
Billing Read plus an explicit allocation policy and cannot be inferred from a
single run.

## VPS FastClaw cost boundary

FastClaw is hosted on the existing AiphaBee/Salesko VPS; Cloudflare Container
pricing applies only to ephemeral Sandbox and scanner instances. The current
incremental cash cost of placing FastClaw on that already-paid VPS is `$0`, but
that is not the same as a zero allocated cost. A production allocation must use
the VPS provider invoice and divide host compute/storage/traffic by an approved
utilization policy. Until that invoice readback exists, the packet records VPS
cost as `incremental_existing_host_usd=0` and `allocated_vps_cost_usd=null`.

The shared PS staging PostgreSQL is likewise an existing staging resource. Its
incremental row-10 charge is not separately observable; production economics
must add the database plan allocation. The live gate therefore never folds VPS
or PostgreSQL into Cloudflare `raw_list_cost_usd`.

## Useful bounds

For a `standard-1` sandbox, fixed provisioned memory+disk cost is
`4*0.0000025 + 8*0.00000007 = $0.00001056/s`. CPU adds between $0 and
`0.5*0.000020 = $0.00001000/s`.

- 60-second sandbox: $0.0006336-$0.0012336 raw Container cost.
- Ten 60-second concurrent sandboxes: $0.006336-$0.012336.
- 1,000 60-second runs/month: $0.6336-$1.2336 raw Container cost before
  included usage, Worker/DO/log/R2, model, scanner and PlanetScale.
- Always-on `standard-1` for a 30-day month: $27.37-$53.29 in Container
  memory+disk+CPU alone. This is why the design must sleep/destroy per run.

The measured live packet replaces these duration bounds with provider metrics.
It never treats list-price arithmetic as an allocated invoice cost.

## 2026-07-12 live measurement

Packet `sha256:feeb1da01341f58bb1ba5a68fa41320d59be5ebf9e8826c305bd84a0c1215077`
completed ten distinct, provider-linked Sandboxes with maximum concurrency 10.
Container and Durable Object Analytics joined every run through exact hashed
provider IDs; Workers Observability joined requests, CPU and log events through
the per-run correlation hash. No timing/order inference was used.

Complete raw list-price cost across all ten staging runs:

- total: `$0.029066052431813046`
- average: `$0.0029066052431813046/run`
- P50: `$0.0031008049934741527/run`
- P95: `$0.0043181852642341706/run`
- max: `$0.0043181852642341706/run`

These values include the acceptance barrier's deliberate idle allocation and
therefore are a conservative staging measurement, not a normal production run
forecast. Nine successful handoffs also recorded R2 byte-seconds; the tenth run
was the kill-switch path and correctly stored zero bytes.

Components are Container `$0.02484286684618496`, Durable Objects
`$0.0040512255856`, R2 `$0.00004374000002808381`, Workers
`$0.000029819999999999996`, and Workers Logs `$0.00009839999999999999`. The
acceptance barrier deliberately kept all ten
Sandboxes alive together, so this is a conservative staging measurement rather
than a normal production forecast.

The account-scoped token proved Billing Read through the PayGo v1 account-period
endpoint (`200`, 420 usage records). The current account-period contracted cost
is `$3.8600075`; it covers the whole Cloudflare account and is **not** attributed
to Row 10. Every run therefore keeps `allocated_invoice_cost_usd=null`. Monthly
included allowances are not subtracted per run and the `$3.8600075` account
figure is not divided across these ten runs. Scanner, kill, handoff, destroy and
cleanup all passed with `residual_rows=0`; final release remains separately
gated by fresh independent security/compliance acceptance.
