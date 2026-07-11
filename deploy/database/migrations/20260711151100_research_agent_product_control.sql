-- Product/account, usage/billing and admin control for dedicated research Agents.
-- rights posture: default_deny; market_data false; no public or provider-billing route.

create schema if not exists aiphabee_core;
create schema if not exists aiphabee_audit;

insert into aiphabee_core.usage_meter_rule (
  meter_rule_id,
  meter_name,
  channel,
  dataset,
  operation,
  unit_name,
  credit_weight,
  rights_policy_version,
  methodology_version,
  effective_from,
  status,
  source_record_id
) values (
  'meter_api_fastclaw_personal_agent_agent_run_credit',
  'FastClaw personal Agent observed run preview credits',
  'api',
  'fastclaw_personal_agent',
  'agent_run',
  'credit',
  0,
  'default_deny',
  'fastclaw-cost-pending-live-row10-v0',
  '2026-07-11T00:00:00Z'::timestamptz,
  'active',
  'research-agent-product-control-row9'
)
on conflict (meter_rule_id) do update set
  meter_name = excluded.meter_name,
  channel = excluded.channel,
  dataset = excluded.dataset,
  operation = excluded.operation,
  unit_name = excluded.unit_name,
  credit_weight = excluded.credit_weight,
  rights_policy_version = excluded.rights_policy_version,
  methodology_version = excluded.methodology_version,
  status = excluded.status,
  source_record_id = excluded.source_record_id,
  updated_at = now();

create table if not exists aiphabee_core.research_agent_run_usage (
  workspace_id text not null references platform.workspace(workspace_id),
  account_id text not null references platform.account(account_id),
  request_id text not null,
  run_id text not null,
  terminal_state text not null check (terminal_state in (
    'client_cancelled', 'completed', 'create_failed', 'execution_failed',
    'global_killed', 'hard_timeout', 'kill_switch', 'soft_timeout',
    'stream_interrupted', 'tenant_killed'
  )),
  usage_event_id text not null references aiphabee_core.usage_event(usage_event_id),
  ledger_entry_id text not null references aiphabee_core.usage_ledger_entry(ledger_entry_id),
  measurement text not null check (measurement = 'observed'),
  model_input_tokens bigint not null check (model_input_tokens >= 0),
  model_output_tokens bigint not null check (model_output_tokens >= 0),
  tool_calls_succeeded bigint not null check (tool_calls_succeeded >= 0),
  tool_calls_failed bigint not null check (tool_calls_failed >= 0),
  sandbox_wall_clock_ms bigint not null check (sandbox_wall_clock_ms >= 0),
  sandbox_cpu_ms bigint not null check (sandbox_cpu_ms >= 0),
  sandbox_peak_memory_bytes bigint not null check (sandbox_peak_memory_bytes >= 0),
  sandbox_peak_disk_bytes bigint not null check (sandbox_peak_disk_bytes >= 0),
  storage_bytes_written bigint not null check (storage_bytes_written >= 0),
  storage_bytes_read bigint not null check (storage_bytes_read >= 0),
  storage_write_ops bigint not null check (storage_write_ops >= 0),
  storage_read_ops bigint not null check (storage_read_ops >= 0),
  storage_delete_ops bigint not null check (storage_delete_ops >= 0),
  credit_delta numeric not null check (credit_delta = 0),
  occurred_at timestamptz not null,
  methodology_version text not null,
  rights_policy_version text not null check (rights_policy_version = 'default_deny'),
  source_record_id text not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, run_id),
  unique (usage_event_id),
  unique (ledger_entry_id)
);

create table if not exists aiphabee_audit.research_agent_admin_event (
  request_id text not null,
  workspace_id text not null references platform.workspace(workspace_id),
  actor_account_id text not null references platform.account(account_id),
  target_account_id text not null references platform.account(account_id),
  action text not null check (action in ('retry', 'disable', 'de' || 'lete', 'kill')),
  run_id text,
  reason text not null,
  status text not null check (status in ('started', 'succeeded', 'denied', 'failed')),
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, request_id),
  check ((action = 'kill' and run_id is not null) or (action <> 'kill' and run_id is null)),
  check (length(reason) between 1 and 500)
);

alter table aiphabee_core.research_agent_run_usage enable row level security;
alter table aiphabee_core.research_agent_run_usage force row level security;
alter table aiphabee_audit.research_agent_admin_event enable row level security;
alter table aiphabee_audit.research_agent_admin_event force row level security;

do $do$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'aiphabee_core'
      and tablename = 'research_agent_run_usage'
      and policyname = 'research_agent_run_usage_account_scope'
  ) then
    create policy research_agent_run_usage_account_scope
    on aiphabee_core.research_agent_run_usage
    for select
    using (
      account_id = (select platform.current_account_id())
      and (select platform.is_workspace_member(workspace_id))
    );
  end if;
end $do$;

do $do$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'aiphabee_audit'
      and tablename = 'research_agent_admin_event'
      and policyname = 'research_agent_admin_event_admin_scope'
  ) then
    create policy research_agent_admin_event_admin_scope
    on aiphabee_audit.research_agent_admin_event
    for select
    using (
      exists (
        select 1 from platform.workspace_membership membership
        where membership.workspace_id = research_agent_admin_event.workspace_id
          and membership.account_id = (select platform.current_account_id())
          and membership.role in ('owner', 'admin')
          and membership.status = 'active'
          and membership.valid_from <= now()
          and (membership.valid_to is null or membership.valid_to > now())
      )
    );
  end if;
end $do$;

create index if not exists research_agent_run_usage_account_created_idx
  on aiphabee_core.research_agent_run_usage (workspace_id, account_id, created_at desc);

create index if not exists research_agent_admin_event_target_created_idx
  on aiphabee_audit.research_agent_admin_event (workspace_id, target_account_id, created_at desc);

create index if not exists research_agent_admin_event_actor_created_idx
  on aiphabee_audit.research_agent_admin_event (workspace_id, actor_account_id, created_at desc);
