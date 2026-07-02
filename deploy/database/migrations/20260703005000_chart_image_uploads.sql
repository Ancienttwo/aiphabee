-- Chart image upload metadata for parse_chart_image Module 5.
--
-- R2 keeps the screenshot bytes. This table stores tenant-scoped ownership,
-- media metadata, and an active/removed marker used before any object read.
--
-- rights posture: default_deny (user upload metadata only; market_data false)

create schema if not exists aiphabee_core;

create table if not exists aiphabee_core.chart_images (
  id text primary key,
  tenant_id text not null,
  user_id text not null,
  r2_key text not null,
  content_type text not null check (
    content_type in ('image/png', 'image/jpeg', 'image/webp')
  ),
  byte_size integer not null check (byte_size > 0),
  content_hash_sha256 text not null check (
    content_hash_sha256 ~ '^sha256:[0-9a-f]{64}$'
  ),
  retention_policy text not null default 'user_managed' check (
    retention_policy in ('user_managed')
  ),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, r2_key)
);

create index if not exists chart_images_tenant_created_idx
  on aiphabee_core.chart_images (tenant_id, created_at);

create index if not exists chart_images_tenant_active_key_idx
  on aiphabee_core.chart_images (tenant_id, r2_key)
  where deleted_at is null;

create index if not exists chart_images_tenant_active_id_idx
  on aiphabee_core.chart_images (tenant_id, id)
  where deleted_at is null;
