-- Durable metadata for explicitly approved FastClaw memory and artifact handoff.
-- R2 stores bytes; this table is the tenant/owner/retention/scan authority.
-- rights posture: default_deny; market_data false; no public read policy.

create schema if not exists aiphabee_core;

create table if not exists aiphabee_core.durable_agent_handoff (
  handoff_id text primary key,
  workspace_id text not null references platform.workspace(workspace_id),
  owner_account_id text not null references platform.account(account_id),
  run_id text not null,
  lease_id text not null,
  kind text not null check (kind in ('memory', 'artifact')),
  storage_key text not null,
  content_type text not null,
  byte_size bigint not null check (
    byte_size > 0
    and (
      (kind = 'memory' and byte_size <= 65536)
      or (kind = 'artifact' and byte_size <= 10485760)
    )
  ),
  content_hash_sha256 text not null check (
    content_hash_sha256 ~ '^sha256:[0-9a-f]{64}$'
  ),
  classification text not null check (
    classification in ('public_derived', 'tenant_confidential', 'user_private')
  ),
  retention_policy text not null check (
    retention_policy in ('temporary_30d', 'user_managed')
  ),
  expires_at timestamptz,
  approval jsonb not null check (
    jsonb_typeof(approval) = 'object'
    and approval ?& array['approved_at', 'approver', 'decision_id']
  ),
  scan jsonb not null check (
    jsonb_typeof(scan) = 'object'
    and scan ->> 'status' = 'clean'
    and scan ->> 'classification' = classification
    and scan ?& array['engine', 'scanned_at', 'signature_version']
  ),
  provenance jsonb not null check (
    jsonb_typeof(provenance) = 'object'
    and provenance ->> 'source' = 'sandbox'
    and provenance ->> 'runner_id' = 'fastclaw.personal-v0'
    and provenance ->> 'source_run_id' = run_id
    and provenance ?& array['generated_at', 'tool_call_ids', 'workspace_path']
  ),
  evidence jsonb not null check (
    jsonb_typeof(evidence) = 'object'
    and jsonb_typeof(evidence -> 'evidence_ids') = 'array'
    and jsonb_array_length(evidence -> 'evidence_ids') > 0
  ),
  contract_version text not null check (
    contract_version = '2026-07-11.durable-memory-artifact-handoff.v0'
  ),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, storage_key),
  check (
    left(
      storage_key,
      length('agent-handoff/v0/' || workspace_id || '/' || owner_account_id || '/' || run_id || '/')
    ) = 'agent-handoff/v0/' || workspace_id || '/' || owner_account_id || '/' || run_id || '/'
  ),
  check (
    (retention_policy = 'temporary_30d' and expires_at is not null)
    or (retention_policy = 'user_managed' and expires_at is null)
  )
);

alter table aiphabee_core.durable_agent_handoff enable row level security;
alter table aiphabee_core.durable_agent_handoff force row level security;

do $do$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'aiphabee_core'
      and tablename = 'durable_agent_handoff'
      and policyname = 'durable_agent_handoff_owner_scope'
  ) then
    create policy durable_agent_handoff_owner_scope
    on aiphabee_core.durable_agent_handoff
    for select
    using (
      owner_account_id = (select platform.current_account_id())
      and (select platform.is_workspace_member(workspace_id))
    );
  end if;
end $do$;

create index if not exists durable_agent_handoff_owner_active_idx
  on aiphabee_core.durable_agent_handoff (workspace_id, owner_account_id, created_at desc)
  where deleted_at is null;

create index if not exists durable_agent_handoff_run_idx
  on aiphabee_core.durable_agent_handoff (workspace_id, run_id, created_at desc);

create index if not exists durable_agent_handoff_expiry_idx
  on aiphabee_core.durable_agent_handoff (expires_at)
  where deleted_at is null and expires_at is not null;
