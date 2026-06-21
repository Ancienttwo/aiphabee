create schema if not exists audit;
create schema if not exists core;
create schema if not exists governance;

create table if not exists core.support_ticket (
  support_ticket_ref text not null,
  target_request_id text not null,
  workspace_id text,
  support_agent_id text,
  category text not null,
  reason text not null,
  ticket_status text not null default 'planned_no_write',
  request_id_visible boolean not null default true,
  sensitive_content_released boolean not null default false,
  live_log_reads_enabled boolean not null default false,
  live_billing_reads_enabled boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now(),
  primary key (support_ticket_ref)
);

create table if not exists audit.support_investigation_event (
  support_event_ref text not null,
  support_ticket_ref text not null references core.support_ticket(support_ticket_ref),
  target_request_id text not null,
  support_agent_id text not null,
  event_kind text not null default 'planned',
  allowed_lookup_fields text[] not null default '{}',
  forbidden_default_fields text[] not null default '{}',
  sensitive_content_released boolean not null default false,
  write_status text not null default 'planned_no_write',
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now(),
  primary key (support_event_ref)
);

create table if not exists governance.support_request_id_contract (
  contract_name text not null default 'support_request_id_investigation',
  contract_version text not null default '2026-06-21.phase3.support-request-id-investigation-scaffold.v0',
  runtime_route text not null default 'GET /support/runtime',
  help_center_route text not null default 'GET /support/help-center',
  investigation_route text not null default 'POST /support/request-id-investigation/plan',
  request_id_required boolean not null default true,
  support_agent_required boolean not null default true,
  live_log_reads_enabled boolean not null default false,
  live_billing_reads_enabled boolean not null default false,
  persistent_writes_enabled boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now()
);
