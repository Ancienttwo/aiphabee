create schema if not exists aiphabee_core;
create schema if not exists aiphabee_audit;

create table if not exists aiphabee_core.research_agent_profile (
  profile_id text primary key,
  workspace_id text not null references platform.workspace(workspace_id),
  account_id text not null references platform.account(account_id),
  external_identity text not null unique,
  fastclaw_user_id text,
  fastclaw_agent_id text,
  desired_state text not null default 'disabled' check (
    desired_state in ('active', 'disabled', 'deleted')
  ),
  lifecycle_status text not null default 'disabled' check (
    lifecycle_status in (
      'provision_pending',
      'provisioning',
      'active',
      'disable_pending',
      'disabled',
      'delete_pending',
      'deleted',
      'blocked_retryable'
    )
  ),
  operation_version integer not null default 0 check (operation_version >= 0),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  lease_owner_request_id text,
  lease_expires_at timestamptz,
  last_request_id text,
  last_error_code text,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  activated_at timestamptz,
  disabled_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, account_id),
  check (
    lifecycle_status <> 'active'
    or (fastclaw_user_id is not null and fastclaw_agent_id is not null)
  ),
  check (
    (lease_owner_request_id is null and lease_expires_at is null)
    or (lease_owner_request_id is not null and lease_expires_at is not null)
  ),
  check (deleted_at is null or lifecycle_status = 'deleted')
);

create table if not exists aiphabee_audit.research_agent_lifecycle_event (
  event_id text primary key,
  profile_id text not null references aiphabee_core.research_agent_profile(profile_id),
  request_id text not null,
  intent text not null,
  from_status text,
  to_status text not null,
  outcome text not null check (
    outcome in ('succeeded', 'denied', 'conflict', 'retryable_failure', 'internal_failure')
  ),
  error_code text,
  fastclaw_user_id_hash text,
  fastclaw_agent_id_hash text,
  actor_service text not null default 'aiphabee-worker',
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (profile_id, request_id)
);

create index if not exists research_agent_profile_workspace_status_idx
  on aiphabee_core.research_agent_profile (workspace_id, lifecycle_status);

create unique index if not exists research_agent_profile_fastclaw_user_uidx
  on aiphabee_core.research_agent_profile (fastclaw_user_id)
  where fastclaw_user_id is not null;

create unique index if not exists research_agent_profile_fastclaw_agent_uidx
  on aiphabee_core.research_agent_profile (fastclaw_agent_id)
  where fastclaw_agent_id is not null;

create index if not exists research_agent_profile_lease_idx
  on aiphabee_core.research_agent_profile (lease_expires_at)
  where lease_expires_at is not null;

create index if not exists research_agent_lifecycle_event_profile_created_idx
  on aiphabee_audit.research_agent_lifecycle_event (profile_id, created_at desc);

create index if not exists research_agent_lifecycle_event_request_idx
  on aiphabee_audit.research_agent_lifecycle_event (request_id);
