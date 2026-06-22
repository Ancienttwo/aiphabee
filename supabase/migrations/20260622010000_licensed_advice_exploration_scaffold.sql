create schema if not exists audit;
create schema if not exists core;
create schema if not exists governance;

create table if not exists core.licensed_advice_exploration (
  licensed_advice_exploration_id text primary key,
  workspace_id text not null references core.workspace(workspace_id),
  proposed_surface text not null check (
    proposed_surface in (
      'personalized_buy_sell_hold',
      'portfolio_rebalance',
      'position_sizing',
      'suitability_based_recommendation',
      'licensed_partner_referral'
    )
  ),
  licensed_entity_id text,
  responsible_officer_id text,
  type4_written_opinion_id text,
  legal_review_status text not null default 'pending' check (
    legal_review_status in ('approved', 'pending', 'rejected')
  ),
  exploration_status text not null default 'blocked_unlicensed_path' check (
    exploration_status in (
      'blocked_missing_context',
      'blocked_supervision_controls_missing',
      'blocked_suitability_controls_missing',
      'blocked_unlicensed_path',
      'blocked_unsupported_surface',
      'planned_no_write'
    )
  ),
  advice_generation_enabled boolean not null default false,
  order_execution_enabled boolean not null default false,
  live_model_execution_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists core.suitability_control_profile (
  suitability_control_profile_id text primary key,
  workspace_id text not null references core.workspace(workspace_id),
  suitability_profile_schema_id text not null,
  advice_record_retention_policy_id text not null,
  human_review_queue_id text not null,
  complaint_handling_policy_id text not null,
  kill_switch_policy_id text not null,
  raw_risk_profile_stored boolean not null default false,
  raw_personal_contact_stored boolean not null default false,
  suitability_required boolean not null default true,
  human_review_required boolean not null default true,
  advice_record_retention_required boolean not null default true,
  persistent_write_enabled boolean not null default false,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists audit.licensed_advice_review_event (
  licensed_advice_review_event_id text primary key,
  request_id text not null,
  workspace_id text not null references core.workspace(workspace_id),
  event_type text not null default 'licensed_advice.exploration.plan' check (
    event_type in (
      'licensed_advice.exploration.plan',
      'licensed_advice.legal_review',
      'licensed_advice.human_review'
    )
  ),
  legal_review_status text not null default 'pending' check (
    legal_review_status in ('approved', 'pending', 'rejected')
  ),
  advice_generation_enabled boolean not null default false,
  order_execution_enabled boolean not null default false,
  raw_risk_profile_stored boolean not null default false,
  raw_personal_contact_stored boolean not null default false,
  write_status text not null default 'planned_no_write' check (
    write_status in ('planned_no_write', 'written')
  ),
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists governance.licensed_advice_exploration_contract (
  contract_name text not null default 'licensed_advice_exploration',
  contract_version text not null default '2026-06-22.phase4.licensed-advice-exploration-scaffold.v0',
  runtime_route text not null default 'GET /compliance/licensed-advice/runtime',
  plan_route text not null default 'POST /compliance/licensed-advice/exploration/plan',
  compliance_release_gate_route text not null default 'POST /public/release-gates/compliance-ops/plan',
  answer_evidence_route text not null default 'POST /agent/runs/validate-answer',
  kill_switch_route text not null default 'POST /agent/kill-switch/plan',
  type4_written_opinion_required boolean not null default true,
  licensed_entity_required boolean not null default true,
  responsible_officer_supervision_required boolean not null default true,
  suitability_controls_required boolean not null default true,
  advice_record_retention_required boolean not null default true,
  human_review_required boolean not null default true,
  kill_switch_required boolean not null default true,
  complaint_handling_required boolean not null default true,
  advice_generation_enabled boolean not null default false,
  order_execution_enabled boolean not null default false,
  live_model_execution_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  raw_risk_profile_stored boolean not null default false,
  raw_personal_contact_stored boolean not null default false,
  sql_emitted boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now()
);
