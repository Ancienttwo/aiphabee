create schema if not exists audit;

create table if not exists audit.subscription_lifecycle_event (
  audit_event_id text primary key,
  request_id text not null,
  workspace_id text not null references core.workspace(workspace_id),
  account_id text not null references core.account(account_id),
  subscription_id text not null references core.workspace_subscription(subscription_id),
  action text not null check (
    action in (
      'upgrade',
      'downgrade',
      'renew',
      'cancel',
      'enter_grace_period',
      'exit_grace_period'
    )
  ),
  current_plan_code text not null references core.subscription_plan(plan_code),
  target_plan_code text not null references core.subscription_plan(plan_code),
  current_billing_state text not null check (
    current_billing_state in ('trialing', 'active', 'grace_period', 'paused', 'canceled')
  ),
  target_billing_state text not null check (
    target_billing_state in ('trialing', 'active', 'grace_period', 'paused', 'canceled')
  ),
  effective_at timestamptz not null,
  grace_period_ends_at timestamptz,
  renewal_period_end timestamptz,
  reason text,
  source_record_id text not null,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now(),
  check (grace_period_ends_at is null or grace_period_ends_at > effective_at)
);
