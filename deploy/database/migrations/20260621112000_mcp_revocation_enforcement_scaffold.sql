create schema if not exists aiphabee_core;
create schema if not exists aiphabee_governance;

create table if not exists aiphabee_core.mcp_credential_revocation (
  credential_ref text not null,
  credential_kind text not null check (credential_kind in ('oauth_connection', 'api_key')),
  credential_status text not null check (credential_status in ('active', 'revoked', 'rotated', 'unknown')),
  account_ref text,
  workspace_ref text,
  reason_code text,
  revoked_at timestamptz,
  rotated_at timestamptz,
  future_calls_denied boolean not null default true,
  live_auth_enforcement boolean not null default false,
  persistent_write_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists aiphabee_governance.mcp_revocation_enforcement_contract (
  contract_name text not null default 'mcp_revocation_enforcement',
  contract_version text not null default '2026-06-21.phase2.mcp-revocation-enforcement-scaffold.v0',
  protocol_route text not null default 'POST /mcp',
  enforcement_route text not null default 'POST /mcp/revocations/enforce/plan',
  default_rights_status text not null default 'default_deny',
  live_auth_enforcement boolean not null default false,
  persistent_write_enabled boolean not null default false,
  created_at timestamptz not null default now()
);
