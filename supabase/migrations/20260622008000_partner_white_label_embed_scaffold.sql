create schema if not exists audit;
create schema if not exists core;
create schema if not exists governance;

create table if not exists core.partner_program (
  partner_program_id text primary key,
  partner_id text not null,
  partner_name text not null,
  workspace_id text not null references core.workspace(workspace_id),
  partner_type text not null check (
    partner_type in ('brokerage', 'media', 'wealth_platform', 'data_company')
  ),
  brand_mode text not null default 'co_branded' check (
    brand_mode in ('co_branded', 'white_label')
  ),
  commercial_model text not null check (
    commercial_model in (
      'fixed_annual_license',
      'minimum_guarantee_overage',
      'subscription_revenue_share',
      'mcp_api_revenue_share',
      'premium_data_package',
      'sla_quality_credit'
    )
  ),
  signed_contract_required boolean not null default true,
  partner_rights_matrix_required boolean not null default true,
  default_deny_until_signed boolean not null default true,
  live_api_execution_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists core.partner_embed_surface (
  partner_embed_surface_id text primary key,
  partner_program_id text not null references core.partner_program(partner_program_id),
  surface text not null check (
    surface in ('research_widget', 'report_viewer', 'watchlist_widget', 'mcp_api', 'data_api')
  ),
  allowed_origins text[] not null default '{}'::text[],
  csp_required boolean not null default true,
  public_indexing_enabled boolean not null default false,
  script_bundle_generated boolean not null default false,
  embed_rendering_enabled boolean not null default false,
  field_authorization_required boolean not null default true,
  external_redistribution_allowed boolean not null default false,
  persistent_write_enabled boolean not null default false,
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists audit.partner_distribution_event (
  partner_distribution_event_id text primary key,
  request_id text not null,
  partner_id text not null,
  workspace_id text not null references core.workspace(workspace_id),
  event_type text not null default 'partner.white_label_embed.plan' check (
    event_type in ('partner.white_label_embed.plan', 'partner.mcp_api.plan', 'partner.settlement.plan')
  ),
  surface text not null check (
    surface in ('research_widget', 'report_viewer', 'watchlist_widget', 'mcp_api', 'data_api')
  ),
  raw_personal_contact_included boolean not null default false,
  raw_prompt_included boolean not null default false,
  credential_material_stored boolean not null default false,
  write_status text not null default 'planned_no_write' check (
    write_status in ('planned_no_write', 'written')
  ),
  rights_state text not null default 'default_deny' check (rights_state = 'default_deny'),
  created_at timestamptz not null default now()
);

create table if not exists governance.partner_white_label_contract (
  contract_name text not null default 'partner_white_label_embed',
  contract_version text not null default '2026-06-22.phase4.partner-white-label-embed-scaffold.v0',
  runtime_route text not null default 'GET /partner/runtime',
  plan_route text not null default 'POST /partner/white-label-embeds/plan',
  settlement_route text not null default 'POST /usage/partner-reconciliation/plan',
  data_gateway_route text not null default 'POST /gateway/exports/plan',
  signed_contract_required boolean not null default true,
  tenant_isolation_required boolean not null default true,
  partner_rights_matrix_required boolean not null default true,
  field_authorization_required boolean not null default true,
  default_deny_until_signed boolean not null default true,
  external_redistribution_allowed boolean not null default false,
  live_api_execution_enabled boolean not null default false,
  embed_rendering_enabled boolean not null default false,
  persistent_write_enabled boolean not null default false,
  sql_emitted boolean not null default false,
  rights_state text not null default 'default_deny',
  created_at timestamptz not null default now()
);
