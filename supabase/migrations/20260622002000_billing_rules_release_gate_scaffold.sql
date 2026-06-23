create schema if not exists aiphabee_audit;
create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.billing_rules_release_gate (
  gate_ref text primary key,
  request_id text not null,
  runtime_route text not null default 'GET /usage/runtime' check (
    runtime_route = 'GET /usage/runtime'
  ),
  gate_route text not null default 'POST /usage/release-gates/billing-rules/plan' check (
    gate_route = 'POST /usage/release-gates/billing-rules/plan'
  ),
  account_package_route text not null default 'GET /account/package-pricing' check (
    account_package_route = 'GET /account/package-pricing'
  ),
  subscription_route text not null default 'POST /account/subscription/lifecycle/plan' check (
    subscription_route = 'POST /account/subscription/lifecycle/plan'
  ),
  quota_route text not null default 'POST /usage/quota/plan' check (
    quota_route = 'POST /usage/quota/plan'
  ),
  billing_reconciliation_route text not null default 'POST /usage/billing/reconciliation/plan' check (
    billing_reconciliation_route = 'POST /usage/billing/reconciliation/plan'
  ),
  high_cost_reservation_route text not null default 'POST /usage/high-cost/reservation/plan' check (
    high_cost_reservation_route = 'POST /usage/high-cost/reservation/plan'
  ),
  required_checks text[] not null default array[
    'package_credit_overage_rules_documented',
    'weighted_credit_model_referenced',
    'refund_and_proration_rules_blocked_without_provider_preview',
    'invoice_credits_match_usage_ledger_credits',
    'request_id_trace_links_invoice_ledger_usage_event',
    'high_cost_pre_debit_and_failure_refund_planned'
  ],
  pro_credit_limit integer not null default 5000 check (
    pro_credit_limit = 5000
  ),
  developer_credit_limit integer not null default 10000 check (
    developer_credit_limit = 10000
  ),
  developer_overage_enabled boolean not null default true check (
    developer_overage_enabled = true
  ),
  final_commercial_quote_present boolean not null default false check (
    final_commercial_quote_present = false
  ),
  refund_preview_live boolean not null default false check (
    refund_preview_live = false
  ),
  proration_preview_live boolean not null default false check (
    proration_preview_live = false
  ),
  invoice_credit_match_required boolean not null default true check (
    invoice_credit_match_required = true
  ),
  request_id_trace_required boolean not null default true check (
    request_id_trace_required = true
  ),
  high_cost_pre_debit_required boolean not null default true check (
    high_cost_pre_debit_required = true
  ),
  high_cost_failure_refund_required boolean not null default true check (
    high_cost_failure_refund_required = true
  ),
  live_billing_provider_enabled boolean not null default false check (
    live_billing_provider_enabled = false
  ),
  live_ledger_read_enabled boolean not null default false check (
    live_ledger_read_enabled = false
  ),
  live_ledger_write_enabled boolean not null default false check (
    live_ledger_write_enabled = false
  ),
  invoice_write_enabled boolean not null default false check (
    invoice_write_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  gate_status text not null default 'blocked_live_billing_rules_validation' check (
    gate_status in ('blocked_live_billing_rules_validation')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_audit.billing_rules_drill_event (
  drill_event_ref text primary key,
  request_id text not null,
  drill_kind text not null check (
    drill_kind in ('package_credit_rule', 'subscription_lifecycle', 'usage_reconciliation', 'high_cost_reservation')
  ),
  route text not null,
  outcome text not null default 'planned_no_write' check (
    outcome = 'planned_no_write'
  ),
  request_id_visible boolean not null default true check (
    request_id_visible = true
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_governance.billing_rules_release_gate_contract (
  contract_name text not null default 'billing_rules_release_gate',
  contract_version text not null default '2026-06-22.phase3.billing-rules-release-gate-scaffold.v0',
  runtime_route text not null default 'GET /usage/runtime',
  gate_route text not null default 'POST /usage/release-gates/billing-rules/plan',
  account_package_route text not null default 'GET /account/package-pricing',
  subscription_route text not null default 'POST /account/subscription/lifecycle/plan',
  quota_route text not null default 'POST /usage/quota/plan',
  billing_reconciliation_route text not null default 'POST /usage/billing/reconciliation/plan',
  high_cost_reservation_route text not null default 'POST /usage/high-cost/reservation/plan',
  pro_credit_limit integer not null default 5000 check (
    pro_credit_limit = 5000
  ),
  developer_credit_limit integer not null default 10000 check (
    developer_credit_limit = 10000
  ),
  developer_overage_enabled boolean not null default true check (
    developer_overage_enabled = true
  ),
  final_commercial_quote_present boolean not null default false check (
    final_commercial_quote_present = false
  ),
  refund_preview_live boolean not null default false check (
    refund_preview_live = false
  ),
  proration_preview_live boolean not null default false check (
    proration_preview_live = false
  ),
  invoice_credit_match_required boolean not null default true check (
    invoice_credit_match_required = true
  ),
  request_id_trace_required boolean not null default true check (
    request_id_trace_required = true
  ),
  high_cost_pre_debit_required boolean not null default true check (
    high_cost_pre_debit_required = true
  ),
  high_cost_failure_refund_required boolean not null default true check (
    high_cost_failure_refund_required = true
  ),
  live_billing_provider_enabled boolean not null default false check (
    live_billing_provider_enabled = false
  ),
  live_ledger_read_enabled boolean not null default false check (
    live_ledger_read_enabled = false
  ),
  live_ledger_write_enabled boolean not null default false check (
    live_ledger_write_enabled = false
  ),
  invoice_write_enabled boolean not null default false check (
    invoice_write_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);
