create schema if not exists core;
create schema if not exists governance;

create table if not exists core.agent_label_budget_release_gate (
  gate_id text primary key,
  request_id text not null,
  fact_label_requires_evidence_card boolean not null default true check (
    fact_label_requires_evidence_card = true
  ),
  calculation_label_requires_calculation_ref boolean not null default true check (
    calculation_label_requires_calculation_ref = true
  ),
  inference_label_requires_evidence_strength boolean not null default true check (
    inference_label_requires_evidence_strength = true
  ),
  unknown_label_requires_missing_reason boolean not null default true check (
    unknown_label_requires_missing_reason = true
  ),
  confidence_score_display_allowed boolean not null default false check (
    confidence_score_display_allowed = false
  ),
  high_cost_budget_estimate_required boolean not null default true check (
    high_cost_budget_estimate_required = true
  ),
  high_cost_confirmation_required boolean not null default true check (
    high_cost_confirmation_required = true
  ),
  pre_debit_required boolean not null default true check (
    pre_debit_required = true
  ),
  failure_refund_required boolean not null default true check (
    failure_refund_required = true
  ),
  live_queue_writes_enabled boolean not null default false check (
    live_queue_writes_enabled = false
  ),
  live_ledger_writes_enabled boolean not null default false check (
    live_ledger_writes_enabled = false
  ),
  live_tool_execution_enabled boolean not null default false check (
    live_tool_execution_enabled = false
  ),
  frontend_rendering_enabled boolean not null default false check (
    frontend_rendering_enabled = false
  ),
  gate_status text not null default 'blocked_live_label_budget_validation' check (
    gate_status in ('blocked_live_label_budget_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists governance.agent_label_budget_release_gate_contract (
  contract_name text not null default 'agent_label_budget_release_gate',
  contract_version text not null default '2026-06-21.phase3.agent-label-budget-release-gate-scaffold.v0',
  runtime_route text not null default 'GET /agent/runtime',
  gate_route text not null default 'POST /agent/release-gates/label-budget/plan',
  tool_loop_route text not null default 'POST /agent/runs/plan',
  analytics_high_cost_route text not null default 'POST /analytics/high-cost/plan',
  usage_reservation_route text not null default 'POST /usage/high-cost/reservation/plan',
  fact_label_requires_evidence_card boolean not null default true check (
    fact_label_requires_evidence_card = true
  ),
  inference_label_requires_evidence_strength boolean not null default true check (
    inference_label_requires_evidence_strength = true
  ),
  unknown_label_requires_missing_reason boolean not null default true check (
    unknown_label_requires_missing_reason = true
  ),
  high_cost_budget_estimate_required boolean not null default true check (
    high_cost_budget_estimate_required = true
  ),
  high_cost_confirmation_required boolean not null default true check (
    high_cost_confirmation_required = true
  ),
  pre_debit_required boolean not null default true check (
    pre_debit_required = true
  ),
  failure_refund_required boolean not null default true check (
    failure_refund_required = true
  ),
  live_queue_writes_enabled boolean not null default false check (
    live_queue_writes_enabled = false
  ),
  live_ledger_writes_enabled boolean not null default false check (
    live_ledger_writes_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);
