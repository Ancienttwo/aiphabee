import type { Client } from "pg";
import type {
  FastClawFinalPostCheck,
  FastClawToolPolicyExecutor
} from "@aiphabee/agent-runtime/fastclaw-agent-runner";
import type { AgentRunner } from "@aiphabee/agent-runtime";

import {
  ServiceBindingFastClawArtifactScanner,
  type ArtifactScannerServiceBinding
} from "./fastclaw-artifact-scanner.js";
import { createFastClawPersonalAgentRunner } from "./fastclaw-agent-runner.js";
import {
  ServiceBindingFastClawCompliantTransport,
  type FastClawServiceBinding
} from "./fastclaw-service-transport.js";
import {
  PostgresFastClawTerminalUsageSink,
  ServiceBindingFastClawRunKiller,
  type FastClawObservedTerminalUsageContext,
  type SandboxBridgeServiceBinding
} from "./fastclaw-live-control.js";
import {
  createWorkerDurableHandoffStores,
  type DurableHandoffR2Bucket
} from "./durable-memory-artifact-handoff.js";
import { PostgresResearchAgentProductControlRepository } from "./research-agent-product-control.js";

export interface FastClawLiveCompositionInput {
  client: Client;
  fastclaw_admin_api_key: string;
  fastclaw_base_url: string;
  fastclaw_control_service: FastClawServiceBinding;
  post_check: FastClawFinalPostCheck;
  sandbox_token_secret: string;
  tool_policy_executor: FastClawToolPolicyExecutor;
  transport_error_observer?: (code: string) => void;
}

// This is the only live FastClaw runner composition. It remains a private
// factory: callers must still supply exact PG authority, AiphaBee post-check
// and tool-policy execution; no route, plan-tier selector or local FastClaw
// tool fallback is introduced here.
export function createFastClawLiveAgentRunner(input: FastClawLiveCompositionInput): AgentRunner {
  return createFastClawPersonalAgentRunner({
    client: input.client,
    dependencies: {
      post_check: input.post_check,
      tool_policy_executor: input.tool_policy_executor,
      transport: new ServiceBindingFastClawCompliantTransport({
        admin_api_key: input.fastclaw_admin_api_key,
        base_url: input.fastclaw_base_url,
        on_error: input.transport_error_observer,
        service: input.fastclaw_control_service
      })
    },
    sandbox_token_secret: input.sandbox_token_secret
  });
}

export interface FastClawLiveControlPlaneInput extends FastClawLiveCompositionInput {
  artifact_scanner_service: ArtifactScannerServiceBinding;
  artifact_scanner_shared_key: string;
  durable_handoff_bucket: DurableHandoffR2Bucket;
  sandbox_bridge_service: SandboxBridgeServiceBinding;
}

// Row 10's private composition binds the runner, authoritative scan, durable
// stores, terminal usage and kill dispatch to one PG/client authority. It does
// not expose a route or enable product selection.
export function createFastClawLiveControlPlane(input: FastClawLiveControlPlaneInput) {
  const productControlRepository = new PostgresResearchAgentProductControlRepository(
    input.client
  );
  return Object.freeze({
    artifact_scanner: new ServiceBindingFastClawArtifactScanner({
      service: input.artifact_scanner_service,
      shared_key: input.artifact_scanner_shared_key
    }),
    create_terminal_usage_sink: (context: FastClawObservedTerminalUsageContext) =>
      new PostgresFastClawTerminalUsageSink(productControlRepository, context),
    durable_handoff: createWorkerDurableHandoffStores({
      bucket: input.durable_handoff_bucket,
      client: input.client
    }),
    run_killer: new ServiceBindingFastClawRunKiller(
      input.sandbox_bridge_service,
      input.sandbox_token_secret
    ),
    runner: createFastClawLiveAgentRunner(input)
  });
}
