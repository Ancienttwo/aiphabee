# Load / DR / Incident Drill Release Gate Scaffold

Status: local contract scaffold, no live execution.

This scaffold closes the Sprint 3.3 load, disaster-recovery, and incident-drill acceptance surface without claiming production readiness.

## Runtime Surface

- Package: `@aiphabee/observability`
- Runtime readiness: `GET /observability/runtime`
- Plan route: `POST /observability/release-gates/load-dr-incident-drill/plan`
- Contract: `deploy/observability/load-dr-incident-drill-release-gate.contract.json`
- Checker: `npm run check:load-dr-incident-drill-release-gate`

## Covered Scenarios

- Load-test peak traffic fixture
- Database restore drill fixture
- Worker failover plan fixture
- Release rollback plan fixture
- Incident response tabletop fixture
- Status page and stakeholder communications fixture

## Targets

- Peak load-test throughput: at least `100` RPS
- Load-test error rate: at most `50bps`
- Disaster recovery RTO: at most `60` minutes
- Disaster recovery RPO: at most `15` minutes

## Non-Live Boundary

The route emits a standard no-write release plan. It does not invoke a load-test runner, execute a restore, page incident responders, update a status page, emit SQL, or persist records.

The release gate remains `blocked_live_load_dr_incident_validation` until live artifacts, DR evidence, failover execution evidence, incident drill evidence, status-page drill evidence, and ops/SRE/product signoff exist.
