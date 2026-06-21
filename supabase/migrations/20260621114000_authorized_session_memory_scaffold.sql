create schema if not exists core;
create schema if not exists governance;

create table if not exists core.authorized_session_memory (
  memory_ref text not null,
  account_id text not null references core.account(account_id),
  workspace_id text not null references core.workspace(workspace_id),
  memory_key text not null check (
    memory_key in (
      'authorized_tool_scopes',
      'data_retention_acknowledgement',
      'default_currency',
      'default_workspace_id',
      'mcp_scope_consent',
      'preferred_locale',
      'response_depth',
      'watchlist_briefing_consent'
    )
  ),
  authorized_scope text not null,
  consent_state text not null default 'granted' check (
    consent_state in ('granted', 'revoked', 'expired')
  ),
  retention_state text not null default 'active' check (
    retention_state in ('active', 'user_removed', 'expired')
  ),
  live_read_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  source_record_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (memory_ref)
);

create table if not exists governance.authorized_session_memory_contract (
  contract_name text not null default 'authorized_session_memory',
  contract_version text not null default '2026-06-21.phase3.authorized-session-memory-scaffold.v0',
  runtime_route text not null default 'GET /account/runtime',
  plan_route text not null default 'POST /account/authorized-memory/plan',
  authorized_information_only boolean not null default true,
  live_read_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now()
);
