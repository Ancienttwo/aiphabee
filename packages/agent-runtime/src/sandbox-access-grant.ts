const SANDBOX_BACKEND_ACCESS_GRANT_BRAND: unique symbol = Symbol(
  "aiphabee.sandbox-backend-access-grant"
);
const FASTCLAW_RUNNER_ACTIVATION_BRAND: unique symbol = Symbol(
  "aiphabee.fastclaw-runner-activation"
);

export type SandboxGrantOwnership =
  | Readonly<{ kind: "run"; run_id: string }>
  | Readonly<{ kind: "session"; session_id: string }>;

export interface SandboxBackendAccessGrant {
  readonly [SANDBOX_BACKEND_ACCESS_GRANT_BRAND]: true;
  readonly layer: "research";
  readonly owner: SandboxGrantOwnership;
  readonly run_mode: "runner_remote";
  readonly runner_family: "fastclaw";
  readonly runner_id: "fastclaw.personal-v0";
  readonly runner_selection_contract_version: "2026-07-10.agent-runner-selection.v0";
  readonly source: "agent_runner_selection";
  readonly tenant_id: string;
  readonly user_id: string;
}

export interface InternalFastClawRunnerActivation {
  readonly [FASTCLAW_RUNNER_ACTIVATION_BRAND]: true;
}

const authenticActivations = new WeakSet<object>();

export function createInternalFastClawRunnerActivation(): InternalFastClawRunnerActivation {
  const activation = Object.freeze({
    [FASTCLAW_RUNNER_ACTIVATION_BRAND]: true as const
  });
  authenticActivations.add(activation);
  return activation;
}

export function mintInternalFastClawSandboxGrant(
  activation: InternalFastClawRunnerActivation,
  input: { run_id: string; tenant_id: string; user_id: string }
): SandboxBackendAccessGrant {
  if (!authenticActivations.has(activation)) {
    throw new Error("FASTCLAW_RUNNER_ACTIVATION_REQUIRED");
  }
  const owner = Object.freeze({ kind: "run" as const, run_id: input.run_id });
  return Object.freeze({
    [SANDBOX_BACKEND_ACCESS_GRANT_BRAND]: true as const,
    layer: "research" as const,
    owner,
    run_mode: "runner_remote" as const,
    runner_family: "fastclaw" as const,
    runner_id: "fastclaw.personal-v0" as const,
    runner_selection_contract_version:
      "2026-07-10.agent-runner-selection.v0" as const,
    source: "agent_runner_selection" as const,
    tenant_id: input.tenant_id,
    user_id: input.user_id
  });
}
