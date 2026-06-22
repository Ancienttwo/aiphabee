create schema if not exists core;
create schema if not exists governance;

create table if not exists core.agent_live_model_streaming_release_gate (
  gate_id text primary key,
  request_id text not null,
  backend_progress_stream_contract_linked boolean not null default true check (
    backend_progress_stream_contract_linked = true
  ),
  model_execution_stream_text_smoke_contract_linked boolean not null default true check (
    model_execution_stream_text_smoke_contract_linked = true
  ),
  live_tool_loop_stream_text_smoke_contract_linked boolean not null default true check (
    live_tool_loop_stream_text_smoke_contract_linked = true
  ),
  generated_answer_evidence_binding_smoke_linked boolean not null default true check (
    generated_answer_evidence_binding_smoke_linked = true
  ),
  ai_gateway_observability_gate_linked boolean not null default true check (
    ai_gateway_observability_gate_linked = true
  ),
  user_stream_auth_redaction_required boolean not null default true check (
    user_stream_auth_redaction_required = true
  ),
  frontend_streaming_ui_required boolean not null default true check (
    frontend_streaming_ui_required = true
  ),
  release_transition_allowed boolean not null default false check (
    release_transition_allowed = false
  ),
  live_model_execution_enabled boolean not null default false check (
    live_model_execution_enabled = false
  ),
  live_model_streaming_enabled boolean not null default false check (
    live_model_streaming_enabled = false
  ),
  persistent_write_enabled boolean not null default false check (
    persistent_write_enabled = false
  ),
  frontend_rendering_enabled boolean not null default false check (
    frontend_rendering_enabled = false
  ),
  gate_status text not null default 'blocked_user_facing_live_model_streaming' check (
    gate_status in ('blocked_user_facing_live_model_streaming')
  ),
  default_rights_status text not null default 'default_deny' check (
    default_rights_status = 'default_deny'
  ),
  created_at timestamptz not null default now()
);

create table if not exists governance.agent_live_model_streaming_release_gate_contract (
  contract_name text not null default 'agent_live_model_streaming_release_gate',
  contract_version text not null default '2026-06-22.phase1.agent-live-model-streaming-release-gate.v0',
  runtime_route text not null default 'GET /agent/runtime',
  gate_route text not null default 'POST /agent/release-gates/live-model-streaming/plan',
  backend_progress_stream_route text not null default 'POST /agent/runs/stream',
  backend_progress_stream_content_type text not null default 'text/event-stream',
  model_execution_audit_smoke_route text not null default 'POST /agent/runs/model-execution-audit-smoke',
  live_tool_loop_smoke_route text not null default 'POST /agent/runs/live-tool-loop-smoke',
  generated_answer_evidence_smoke_route text not null default 'POST /agent/runs/generated-answer-evidence-smoke',
  ai_gateway_observability_release_gate_route text not null default 'POST /agent/release-gates/ai-gateway-observability/plan',
  release_transition_allowed boolean not null default false check (
    release_transition_allowed = false
  ),
  live_model_execution_enabled boolean not null default false check (
    live_model_execution_enabled = false
  ),
  live_model_streaming_enabled boolean not null default false check (
    live_model_streaming_enabled = false
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
