create schema if not exists core;
create schema if not exists governance;

create table if not exists core.agent_model_output_corpus_release_gate (
  gate_id text primary key,
  request_id text not null,
  unsourced_numeric_sampling_contract_linked boolean not null default true check (
    unsourced_numeric_sampling_contract_linked = true
  ),
  generated_answer_evidence_smoke_linked boolean not null default true check (
    generated_answer_evidence_smoke_linked = true
  ),
  model_execution_audit_smoke_linked boolean not null default true check (
    model_execution_audit_smoke_linked = true
  ),
  live_model_streaming_gate_linked boolean not null default true check (
    live_model_streaming_gate_linked = true
  ),
  eval_v1_contract_linked boolean not null default true check (
    eval_v1_contract_linked = true
  ),
  live_smoke_evidence_ledger_linked boolean not null default true check (
    live_smoke_evidence_ledger_linked = true
  ),
  partner_approved_model_output_corpus_required boolean not null default true check (
    partner_approved_model_output_corpus_required = true
  ),
  persistent_eval_writes_required boolean not null default true check (
    persistent_eval_writes_required = true
  ),
  frontend_evidence_cards_required boolean not null default true check (
    frontend_evidence_cards_required = true
  ),
  release_transition_allowed boolean not null default false check (
    release_transition_allowed = false
  ),
  live_model_output_corpus_enabled boolean not null default false check (
    live_model_output_corpus_enabled = false
  ),
  production_sampling_enabled boolean not null default false check (
    production_sampling_enabled = false
  ),
  persistent_eval_write_enabled boolean not null default false check (
    persistent_eval_write_enabled = false
  ),
  model_call_enabled boolean not null default false check (
    model_call_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  frontend_rendering_enabled boolean not null default false check (
    frontend_rendering_enabled = false
  ),
  gate_status text not null default 'blocked_model_output_corpus_evidence' check (
    gate_status in ('blocked_model_output_corpus_evidence')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists governance.agent_model_output_corpus_release_gate_contract (
  contract_name text not null default 'agent_model_output_corpus_release_gate',
  contract_version text not null default '2026-06-22.phase1.agent-model-output-corpus-release-gate.v0',
  runtime_route text not null default 'GET /agent/runtime',
  gate_route text not null default 'POST /agent/release-gates/model-output-corpus/plan',
  unsourced_numeric_sampling_contract text not null default 'deploy/observability/unsourced-numeric-sampling.contract.json',
  generated_answer_evidence_smoke_route text not null default 'POST /agent/runs/generated-answer-evidence-smoke',
  model_execution_audit_smoke_route text not null default 'POST /agent/runs/model-execution-audit-smoke',
  live_model_streaming_release_gate_route text not null default 'POST /agent/release-gates/live-model-streaming/plan',
  eval_v1_contract text not null default 'deploy/observability/eval-v1.contract.json',
  live_smoke_evidence_ledger_contract text not null default 'deploy/governance/live-smoke-evidence-ledger.contract.json',
  release_transition_allowed boolean not null default false check (
    release_transition_allowed = false
  ),
  live_model_output_corpus_enabled boolean not null default false check (
    live_model_output_corpus_enabled = false
  ),
  production_sampling_enabled boolean not null default false check (
    production_sampling_enabled = false
  ),
  persistent_eval_write_enabled boolean not null default false check (
    persistent_eval_write_enabled = false
  ),
  model_call_enabled boolean not null default false check (
    model_call_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  frontend_rendering_enabled boolean not null default false check (
    frontend_rendering_enabled = false
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);
