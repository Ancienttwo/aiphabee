import type { Client } from "pg";

import {
  activateFastClawPersonalAgentRunner,
  type FastClawAgentRunnerActivationInput,
  type FastClawDedicatedAgentAuthority,
  type FastClawDedicatedAgentAuthorityDecision
} from "@aiphabee/agent-runtime/fastclaw-agent-runner";
import type { AgentRunner } from "@aiphabee/agent-runtime";
import { issueSandboxRunToken } from "@aiphabee/sandbox-run-auth";

import { RESEARCH_AGENT_AUTHORITY_SQL } from "./research-agent-lifecycle.js";

interface RunnerProfileRow {
  account_exists: boolean;
  account_status: "active" | "closed" | "suspended" | null;
  account_id: string | null;
  desired_state: string | null;
  entitlement_approved: boolean;
  external_identity: string | null;
  fastclaw_agent_id: string | null;
  fastclaw_user_id: string | null;
  lifecycle_status: string | null;
  membership_active: boolean;
  product_access_active: boolean;
  profile_id: string | null;
  subscription_active: boolean;
  workspace_id: string | null;
  workspace_exists: boolean;
  workspace_status: "active" | "closed" | "suspended" | null;
}

const CLIENT_LOCKS = new WeakMap<Client, Promise<void>>();

// node-postgres serializes individual statements, not transaction ownership.
// Row-10 intentionally shares one restricted Hyperdrive client across
// concurrent runs, so account-scoped transactions must be serialized as a
// unit or SET LOCAL could cross tenant boundaries.
export async function withFastClawPostgresClientLock<T>(
  client: Client,
  operation: () => Promise<T>
): Promise<T> {
  const previous = CLIENT_LOCKS.get(client) ?? Promise.resolve();
  let release: (() => void) | undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const queued = previous.then(() => current);
  CLIENT_LOCKS.set(client, queued);
  await previous;
  try {
    return await operation();
  } finally {
    release?.();
    if (CLIENT_LOCKS.get(client) === queued) CLIENT_LOCKS.delete(client);
  }
}

export class PostgresFastClawDedicatedAgentAuthority
  implements FastClawDedicatedAgentAuthority
{
  constructor(private readonly client: Client) {}

  async resolve(input: {
    tenant_id: string;
    user_id: string;
  }): Promise<FastClawDedicatedAgentAuthorityDecision> {
    return withFastClawPostgresClientLock(this.client, async () => {
      await this.client.query("begin");
      try {
      await this.client.query(
        "select set_config('aiphabee.account_id', $1, true)",
        [input.user_id]
      );
      const result = await this.client.query<RunnerProfileRow>(
        `with authority as (${RESEARCH_AGENT_AUTHORITY_SQL}),
      profile as (
        select profile_id, workspace_id, account_id, external_identity,
          fastclaw_user_id, fastclaw_agent_id, desired_state, lifecycle_status
        from aiphabee_core.research_agent_profile
        where workspace_id = $2 and account_id = $1
        limit 1
      )
      select authority.*, profile.*
      from authority
      left join profile on true`,
        [input.user_id, input.tenant_id]
      );
      const profile = result.rows[0];
      if (profile === undefined) {
        throw new Error("FastClaw runner authority query returned no row");
      }
      let decision: FastClawDedicatedAgentAuthorityDecision;
      if (!profile.entitlement_approved) {
        decision = {
          code: "FASTCLAW_RESEARCH_ENTITLEMENT_REQUIRED",
          retryable: false,
          status: "blocked"
        };
      } else {
        const activateAllowed =
          profile.account_status === "active" &&
          profile.workspace_status === "active" &&
          profile.membership_active &&
          profile.subscription_active &&
          profile.product_access_active &&
          profile.entitlement_approved;
        if (!activateAllowed) {
          decision = {
            code: "FASTCLAW_DEDICATED_IDENTITY_UNAVAILABLE",
            retryable: false,
            status: "blocked"
          };
        } else if (
          profile.workspace_id !== input.tenant_id ||
          profile.account_id !== input.user_id ||
          profile.desired_state !== "active" ||
          profile.lifecycle_status !== "active" ||
          profile.profile_id === null ||
          profile.external_identity === null ||
          profile.external_identity.length === 0 ||
          profile.fastclaw_user_id === null ||
          profile.fastclaw_user_id.length === 0 ||
          profile.fastclaw_agent_id === null ||
          profile.fastclaw_agent_id.length === 0
        ) {
          decision = {
            code: "FASTCLAW_DEDICATED_IDENTITY_UNAVAILABLE",
            retryable: true,
            status: "blocked"
          };
        } else {
          decision = {
            external_user_identity: profile.external_identity,
            fastclaw_agent_id: profile.fastclaw_agent_id,
            fastclaw_user_id: profile.fastclaw_user_id,
            profile_id: profile.profile_id,
            status: "allowed",
            tenant_id: input.tenant_id,
            user_id: input.user_id
          };
        }
      }
      await this.client.query("commit");
        return decision;
      } catch (error) {
        await this.client.query("rollback").catch(() => undefined);
        throw error;
      }
    });
  }
}

export class SandboxRunTokenFastClawAuthorizationIssuer {
  constructor(private readonly secret: string) {}

  async issue(input: {
    access_grant: Parameters<
      FastClawAgentRunnerActivationInput["sandbox_authorization_issuer"]["issue"]
    >[0]["access_grant"];
    budget: Parameters<
      FastClawAgentRunnerActivationInput["sandbox_authorization_issuer"]["issue"]
    >[0]["budget"];
  }): Promise<{ authorization: string; expires_at: string }> {
    if (input.access_grant.owner.kind !== "run") {
      throw new Error("FASTCLAW_RUN_OWNERSHIP_REQUIRED");
    }
    const ttlSeconds = Math.min(
      600,
      Math.max(1, Math.ceil(input.budget.max_wall_clock_ms / 1_000) + 30)
    );
    const issued = await issueSandboxRunToken({
      maxCalls: Math.min(64, Math.max(4, input.budget.max_steps * 4)),
      runId: input.access_grant.owner.run_id,
      scopes: [
        "sandbox:create",
        "sandbox:destroy",
        "sandbox:exec",
        "sandbox:file",
        "sandbox:status"
      ],
      secret: this.secret,
      tenantId: input.access_grant.tenant_id,
      ttlSeconds,
      userId: input.access_grant.user_id
    });
    return {
      authorization: issued.token,
      expires_at: new Date(issued.claims.exp * 1_000).toISOString()
    };
  }
}

export function createFastClawPersonalAgentRunner(input: {
  client: Client;
  dependencies: Omit<
    FastClawAgentRunnerActivationInput,
    "authority" | "sandbox_authorization_issuer"
  >;
  sandbox_token_secret: string;
}): AgentRunner {
  return activateFastClawPersonalAgentRunner({
    ...input.dependencies,
    authority: new PostgresFastClawDedicatedAgentAuthority(input.client),
    sandbox_authorization_issuer: new SandboxRunTokenFastClawAuthorizationIssuer(
      input.sandbox_token_secret
    )
  });
}
