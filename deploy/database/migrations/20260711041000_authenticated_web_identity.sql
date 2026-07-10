-- Better Auth 1.6.23 PostgreSQL core schema, generated with `npx auth@1.6.23
-- generate` from the reviewed AiphaBee staging configuration and then made
-- schema-qualified. Product identity remains in platform.account; this schema
-- owns only provider accounts, sessions, verification state, and rate limits.
-- Rights posture remains default_deny: PUBLIC is revoked and runtime grants are
-- applied only by the separately reviewed staging role packet.

BEGIN;

CREATE SCHEMA IF NOT EXISTS aiphabee_auth;
REVOKE ALL ON SCHEMA aiphabee_auth FROM PUBLIC;

CREATE TABLE IF NOT EXISTS aiphabee_auth."user" (
  "id" uuid DEFAULT pg_catalog.gen_random_uuid() NOT NULL PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL,
  "image" text,
  "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS aiphabee_auth."session" (
  "id" uuid DEFAULT pg_catalog.gen_random_uuid() NOT NULL PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamptz NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" uuid NOT NULL REFERENCES aiphabee_auth."user" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS aiphabee_auth."account" (
  "id" uuid DEFAULT pg_catalog.gen_random_uuid() NOT NULL PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" uuid NOT NULL REFERENCES aiphabee_auth."user" ("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS aiphabee_auth."verification" (
  "id" uuid DEFAULT pg_catalog.gen_random_uuid() NOT NULL PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS aiphabee_auth."rateLimit" (
  "id" uuid DEFAULT pg_catalog.gen_random_uuid() NOT NULL PRIMARY KEY,
  "key" text NOT NULL UNIQUE,
  "count" integer NOT NULL,
  "lastRequest" bigint NOT NULL
);

CREATE INDEX IF NOT EXISTS "session_userId_idx"
  ON aiphabee_auth."session" ("userId");
CREATE INDEX IF NOT EXISTS "account_userId_idx"
  ON aiphabee_auth."account" ("userId");
CREATE INDEX IF NOT EXISTS "verification_identifier_idx"
  ON aiphabee_auth."verification" ("identifier");
CREATE INDEX IF NOT EXISTS "rateLimit_lastRequest_idx"
  ON aiphabee_auth."rateLimit" ("lastRequest");

DO $canonical_auth_subject$
BEGIN
  IF to_regclass('platform.account') IS NULL THEN
    RAISE EXCEPTION 'platform.account is required before authenticated Web identity';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'platform'
      AND table_name = 'account'
      AND column_name = 'auth_subject'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE platform.account ADD COLUMN auth_subject text;
  END IF;

END
$canonical_auth_subject$;

CREATE UNIQUE INDEX IF NOT EXISTS platform_account_auth_subject_uidx
  ON platform.account (auth_subject)
  WHERE auth_subject IS NOT NULL;

COMMIT;
