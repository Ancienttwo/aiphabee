import type {
  SandboxBackend,
  SandboxBackendAccessGrant,
  SandboxDestroyResult,
  SandboxEgressAccess,
  SandboxExecutionHandle,
  SandboxExecutionEvent,
  SandboxKillReason,
  SandboxKillResult,
  SandboxLease
} from "./index.js";

export const SANDBOX_TERMINATION_GRACE_MS = 15_000;
export const SANDBOX_CREATE_TIMEOUT_MS = 30_000;

const UTF8_ENCODER = new (
  globalThis as unknown as {
    TextEncoder: new () => { encode(input?: string): Uint8Array };
  }
).TextEncoder();
const TIMER_RUNTIME = globalThis as unknown as {
  clearTimeout(handle: unknown): void;
  setTimeout(handler: () => void, milliseconds: number): unknown;
};
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;

export type SandboxLifecycleControlReason =
  | "client_cancelled"
  | "global_kill"
  | "kill_switch"
  | "tenant_kill";

export interface SandboxLifecycleAbortSignal {
  readonly aborted: boolean;
  addEventListener(type: "abort", listener: () => void, options: { once: true }): void;
  removeEventListener(type: "abort", listener: () => void): void;
}

export type SandboxTerminalState =
  | "client_cancelled"
  | "completed"
  | "create_failed"
  | "execution_failed"
  | "global_killed"
  | "hard_timeout"
  | "kill_switch"
  | "soft_timeout"
  | "stream_interrupted"
  | "tenant_killed";

export type SandboxTerminalKillStatus =
  | "already_terminal"
  | "confirmed"
  | "failed"
  | "not_requested"
  | "unconfirmed";

export type SandboxTerminalCleanupStatus =
  | "already_destroyed"
  | "backend_owned_unconfirmed"
  | "destroyed"
  | "failed"
  | "not_required"
  | "unconfirmed";

export interface SandboxObservedExecutionUsage {
  cleanup_wall_clock_ms: number;
  estimated: false;
  execution_wall_clock_ms: number;
  exit_code: number | null;
  lifecycle_wall_clock_ms: number;
  measurement: "observed";
  output_event_count: number;
  stderr_bytes: number;
  stdout_bytes: number;
}

export interface SandboxTerminalLifecycleRecord {
  cleanup: {
    execution_closed: boolean;
    release_safe: boolean;
    status: SandboxTerminalCleanupStatus;
  };
  execution_terminal_seen: boolean;
  kill_status: SandboxTerminalKillStatus;
  lease_id: string | null;
  record_key: string;
  requested_kill_reason: SandboxKillReason | null;
  run_id: string;
  terminal_record_count: 1;
  terminal_state: SandboxTerminalState;
  usage: SandboxObservedExecutionUsage;
  version: "2026-07-11.sandbox-terminal-lifecycle.v0";
}

export interface RunSandboxTerminalLifecycleInput {
  access_grant: SandboxBackendAccessGrant;
  argv: readonly [string, ...string[]];
  backend: SandboxBackend;
  control?: {
    reason: SandboxLifecycleControlReason;
    signal: SandboxLifecycleAbortSignal;
  };
  egress_access: SandboxEgressAccess;
  record_terminal(record: SandboxTerminalLifecycleRecord): Promise<void>;
  run_id: string;
}

export class SandboxTerminalLifecycleError extends Error {
  readonly code: "INVALID_INPUT" | "TERMINAL_RECORD_FAILED";
  readonly record?: SandboxTerminalLifecycleRecord;

  constructor(
    code: "INVALID_INPUT" | "TERMINAL_RECORD_FAILED",
    message: string,
    options?: { cause?: unknown; record?: SandboxTerminalLifecycleRecord }
  ) {
    super(message, { cause: options?.cause });
    this.name = "SandboxTerminalLifecycleError";
    this.code = code;
    this.record = options?.record;
  }
}

interface ExecutionObservation {
  execution_terminal_seen: boolean;
  exit_code: number | null;
  output_event_count: number;
  requested_kill_reason: SandboxKillReason | null;
  stderr_bytes: number;
  stdout_bytes: number;
  terminal_state: SandboxTerminalState;
}

interface ExecutionMeter {
  output_event_count: number;
  stderr_bytes: number;
  stdout_bytes: number;
}

interface LifecycleDecision extends ExecutionObservation {
  kill_status: SandboxTerminalKillStatus;
}

function validateRunId(runId: string): void {
  if (
    runId.length === 0 ||
    runId.length > 128 ||
    runId.trim() !== runId ||
    CONTROL_CHARACTER_PATTERN.test(runId)
  ) {
    throw new SandboxTerminalLifecycleError(
      "INVALID_INPUT",
      "run_id must be a non-empty opaque identifier without surrounding whitespace or control characters"
    );
  }
}

function elapsedSince(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

function controlTerminalState(reason: SandboxLifecycleControlReason): SandboxTerminalState {
  switch (reason) {
    case "client_cancelled":
      return "client_cancelled";
    case "global_kill":
      return "global_killed";
    case "kill_switch":
      return "kill_switch";
    case "tenant_kill":
      return "tenant_killed";
  }
}

function executionFailureTerminalState(
  reason: SandboxExecutionEvent & { event: "failed" }
): SandboxTerminalState {
  switch (reason.reason) {
    case "backend_failure":
      return "execution_failed";
    case "client_cancelled":
      return "client_cancelled";
    case "global_kill":
      return "global_killed";
    case "hard_timeout":
      return "hard_timeout";
    case "kill_switch":
      return "kill_switch";
    case "soft_timeout":
      return "soft_timeout";
    case "stream_interrupted":
      return "stream_interrupted";
    case "tenant_kill":
      return "tenant_killed";
  }
}

function timeout<T>(milliseconds: number, value: T): {
  cancel(): void;
  promise: Promise<T>;
} {
  let timer: unknown;
  let timerSet = false;
  return {
    cancel() {
      if (timerSet) TIMER_RUNTIME.clearTimeout(timer);
    },
    promise: new Promise<T>((resolve) => {
      timer = TIMER_RUNTIME.setTimeout(() => resolve(value), milliseconds);
      timerSet = true;
    })
  };
}

async function boundedOperation<T>(
  operation: Promise<T>,
  milliseconds: number
): Promise<{ status: "settled"; value: T } | { status: "rejected" } | { status: "timed_out" }> {
  const deadline = timeout(milliseconds, { status: "timed_out" } as const);
  try {
    return await Promise.race([
      operation.then(
        (value) => ({ status: "settled", value }) as const,
        () => ({ status: "rejected" }) as const
      ),
      deadline.promise
    ]);
  } finally {
    deadline.cancel();
  }
}

function mapKillResult(
  result: Awaited<ReturnType<typeof boundedOperation<SandboxKillResult>>>
): SandboxTerminalKillStatus {
  if (result.status !== "settled") {
    return result.status === "timed_out" ? "unconfirmed" : "failed";
  }
  if (result.value.status === "already_terminal") return "already_terminal";
  if (result.value.status === "killed") return "confirmed";
  return "failed";
}

async function requestKill(
  backend: SandboxBackend,
  lease: SandboxLease,
  reason: SandboxKillReason
): Promise<SandboxTerminalKillStatus> {
  return mapKillResult(
    await boundedOperation(
      Promise.resolve().then(() => backend.kill({ lease, reason })),
      SANDBOX_TERMINATION_GRACE_MS
    )
  );
}

async function destroyLease(
  backend: SandboxBackend,
  lease: SandboxLease
): Promise<{
  execution_closed: boolean;
  release_safe: boolean;
  status: SandboxTerminalCleanupStatus;
}> {
  const result = await boundedOperation<SandboxDestroyResult>(
    Promise.resolve().then(() => backend.destroy({ lease })),
    SANDBOX_TERMINATION_GRACE_MS
  );
  if (result.status === "timed_out") {
    return { execution_closed: true, release_safe: false, status: "unconfirmed" };
  }
  if (result.status === "rejected") {
    return { execution_closed: true, release_safe: false, status: "failed" };
  }
  if (result.value.status === "destroyed") {
    return { execution_closed: true, release_safe: true, status: "destroyed" };
  }
  if (result.value.status === "already_destroyed") {
    return { execution_closed: true, release_safe: true, status: "already_destroyed" };
  }
  return { execution_closed: true, release_safe: false, status: "failed" };
}

async function consumeExecution(
  iterator: AsyncIterator<SandboxExecutionEvent>,
  meter: ExecutionMeter
): Promise<ExecutionObservation> {
  try {
    while (true) {
      const next = await iterator.next();
      if (next.done) {
        return {
          execution_terminal_seen: false,
          exit_code: null,
          output_event_count: meter.output_event_count,
          requested_kill_reason: "stream_interrupted",
          stderr_bytes: meter.stderr_bytes,
          stdout_bytes: meter.stdout_bytes,
          terminal_state: "stream_interrupted"
        };
      }
      const event = next.value;
      if (event.event === "output") {
        const bytes = UTF8_ENCODER.encode(event.chunk).byteLength;
        meter.output_event_count += 1;
        if (event.stream === "stdout") meter.stdout_bytes += bytes;
        else meter.stderr_bytes += bytes;
        continue;
      }
      if (event.event === "exit") {
        return {
          execution_terminal_seen: true,
          exit_code: event.exit_code,
          output_event_count: meter.output_event_count,
          requested_kill_reason: null,
          stderr_bytes: meter.stderr_bytes,
          stdout_bytes: meter.stdout_bytes,
          terminal_state: event.exit_code === 0 ? "completed" : "execution_failed"
        };
      }
      return {
        execution_terminal_seen: true,
        exit_code: null,
        output_event_count: meter.output_event_count,
        requested_kill_reason: event.reason === "backend_failure" ? null : event.reason,
        stderr_bytes: meter.stderr_bytes,
        stdout_bytes: meter.stdout_bytes,
        terminal_state: executionFailureTerminalState(event)
      };
    }
  } catch {
    return {
      execution_terminal_seen: false,
      exit_code: null,
      output_event_count: meter.output_event_count,
      requested_kill_reason: "stream_interrupted",
      stderr_bytes: meter.stderr_bytes,
      stdout_bytes: meter.stdout_bytes,
      terminal_state: "stream_interrupted"
    };
  }
}

function emptyObservation(
  terminalState: SandboxTerminalState,
  meter: ExecutionMeter = { output_event_count: 0, stderr_bytes: 0, stdout_bytes: 0 }
): ExecutionObservation {
  return {
    execution_terminal_seen: false,
    exit_code: null,
    output_event_count: meter.output_event_count,
    requested_kill_reason: null,
    stderr_bytes: meter.stderr_bytes,
    stdout_bytes: meter.stdout_bytes,
    terminal_state: terminalState
  };
}

function controlPromise(
  control: RunSandboxTerminalLifecycleInput["control"]
): { cancel(): void; promise: Promise<SandboxLifecycleControlReason> } | undefined {
  if (control === undefined) return undefined;
  let listener: (() => void) | undefined;
  return {
    cancel() {
      if (listener !== undefined) control.signal.removeEventListener("abort", listener);
    },
    promise: new Promise((resolve) => {
      listener = () => resolve(control.reason);
      control.signal.addEventListener("abort", listener, { once: true });
      if (control.signal.aborted) listener();
    })
  };
}

async function recordTerminal(
  input: RunSandboxTerminalLifecycleInput,
  record: SandboxTerminalLifecycleRecord
): Promise<SandboxTerminalLifecycleRecord> {
  try {
    await input.record_terminal(record);
  } catch (cause) {
    throw new SandboxTerminalLifecycleError(
      "TERMINAL_RECORD_FAILED",
      "terminal lifecycle cleanup completed but terminal record persistence failed",
      { cause, record }
    );
  }
  return record;
}

export async function runSandboxTerminalLifecycle(
  input: RunSandboxTerminalLifecycleInput
): Promise<SandboxTerminalLifecycleRecord> {
  validateRunId(input.run_id);
  if (
    input.access_grant.owner.kind !== "run" ||
    input.access_grant.owner.run_id !== input.run_id
  ) {
    throw new SandboxTerminalLifecycleError(
      "INVALID_INPUT",
      "run lifecycle identity must match the run-owned sandbox access grant"
    );
  }
  const lifecycleStartedAt = Date.now();
  const preAbortedReason = input.control?.signal.aborted ? input.control.reason : undefined;

  if (preAbortedReason !== undefined) {
    const record: SandboxTerminalLifecycleRecord = {
      cleanup: { execution_closed: true, release_safe: true, status: "not_required" },
      execution_terminal_seen: false,
      kill_status: "not_requested",
      lease_id: null,
      record_key: `${input.run_id}:no-lease:terminal:v0`,
      requested_kill_reason: preAbortedReason,
      run_id: input.run_id,
      terminal_record_count: 1,
      terminal_state: controlTerminalState(preAbortedReason),
      usage: {
        cleanup_wall_clock_ms: 0,
        estimated: false,
        execution_wall_clock_ms: 0,
        exit_code: null,
        lifecycle_wall_clock_ms: elapsedSince(lifecycleStartedAt),
        measurement: "observed",
        output_event_count: 0,
        stderr_bytes: 0,
        stdout_bytes: 0
      },
      version: "2026-07-11.sandbox-terminal-lifecycle.v0"
    };
    return recordTerminal(input, record);
  }

  const createAttempt = Promise.resolve()
    .then(() => input.backend.create({ access_grant: input.access_grant }))
    .catch(
      (): Awaited<ReturnType<SandboxBackend["create"]>> => ({
        error_code: "create_failed",
        retryable: true,
        status: "failed"
      })
    );
  const createDeadline = timeout(input.backend.capabilities.policy.create_timeout_ms, {
    kind: "create_timeout"
  } as const);
  const externalControl = controlPromise(input.control);
  const firstCreate = await Promise.race([
    createAttempt.then((result) => ({ kind: "create", result }) as const),
    createDeadline.promise,
    ...(externalControl === undefined
      ? []
      : [externalControl.promise.then((reason) => ({ kind: "control", reason }) as const)])
  ]);

  if (firstCreate.kind === "control") {
    const settledCreate = await Promise.race([
      createAttempt.then((result) => ({ kind: "create", result }) as const),
      createDeadline.promise
    ]);
    createDeadline.cancel();
    externalControl?.cancel();
    if (settledCreate.kind === "create" && settledCreate.result.status === "created") {
      const cleanupStartedAt = Date.now();
      const cleanup = await destroyLease(input.backend, settledCreate.result.lease);
      const record: SandboxTerminalLifecycleRecord = {
        cleanup,
        execution_terminal_seen: false,
        kill_status: "not_requested",
        lease_id: settledCreate.result.lease.lease_id,
        record_key: `${input.run_id}:${settledCreate.result.lease.lease_id}:terminal:v0`,
        requested_kill_reason: firstCreate.reason,
        run_id: input.run_id,
        terminal_record_count: 1,
        terminal_state: controlTerminalState(firstCreate.reason),
        usage: {
          cleanup_wall_clock_ms: elapsedSince(cleanupStartedAt),
          estimated: false,
          execution_wall_clock_ms: 0,
          exit_code: null,
          lifecycle_wall_clock_ms: elapsedSince(lifecycleStartedAt),
          measurement: "observed",
          output_event_count: 0,
          stderr_bytes: 0,
          stdout_bytes: 0
        },
        version: "2026-07-11.sandbox-terminal-lifecycle.v0"
      };
      return recordTerminal(input, record);
    }
    if (settledCreate.kind === "create_timeout") {
      void createAttempt.then(async (result) => {
        if (result.status === "created") await destroyLease(input.backend, result.lease);
      });
    }
    const record: SandboxTerminalLifecycleRecord = {
      cleanup: {
        execution_closed: true,
        release_safe: false,
        status: "backend_owned_unconfirmed"
      },
      execution_terminal_seen: false,
      kill_status: "not_requested",
      lease_id: null,
      record_key: `${input.run_id}:no-lease:terminal:v0`,
      requested_kill_reason: firstCreate.reason,
      run_id: input.run_id,
      terminal_record_count: 1,
      terminal_state: controlTerminalState(firstCreate.reason),
      usage: {
        cleanup_wall_clock_ms: 0,
        estimated: false,
        execution_wall_clock_ms: 0,
        exit_code: null,
        lifecycle_wall_clock_ms: elapsedSince(lifecycleStartedAt),
        measurement: "observed",
        output_event_count: 0,
        stderr_bytes: 0,
        stdout_bytes: 0
      },
      version: "2026-07-11.sandbox-terminal-lifecycle.v0"
    };
    return recordTerminal(input, record);
  }

  createDeadline.cancel();
  if (firstCreate.kind === "create_timeout") {
    externalControl?.cancel();
    void createAttempt.then(async (result) => {
      if (result.status === "created") await destroyLease(input.backend, result.lease);
    });
  }
  const createResult = firstCreate.kind === "create" ? firstCreate.result : undefined;
  if (createResult === undefined || createResult.status === "failed") {
    externalControl?.cancel();
    const record: SandboxTerminalLifecycleRecord = {
      cleanup: {
        execution_closed: true,
        release_safe: false,
        status: "backend_owned_unconfirmed"
      },
      execution_terminal_seen: false,
      kill_status: "not_requested",
      lease_id: null,
      record_key: `${input.run_id}:no-lease:terminal:v0`,
      requested_kill_reason: null,
      run_id: input.run_id,
      terminal_record_count: 1,
      terminal_state: "create_failed",
      usage: {
        cleanup_wall_clock_ms: 0,
        estimated: false,
        execution_wall_clock_ms: 0,
        exit_code: null,
        lifecycle_wall_clock_ms: elapsedSince(lifecycleStartedAt),
        measurement: "observed",
        output_event_count: 0,
        stderr_bytes: 0,
        stdout_bytes: 0
      },
      version: "2026-07-11.sandbox-terminal-lifecycle.v0"
    };
    return recordTerminal(input, record);
  }

  const lease = createResult.lease;
  const executionStartedAt = Date.now();
  const meter: ExecutionMeter = {
    output_event_count: 0,
    stderr_bytes: 0,
    stdout_bytes: 0
  };
  let executionHandle: SandboxExecutionHandle | undefined;
  let iterator: AsyncIterator<SandboxExecutionEvent> | undefined;
  let execution: Promise<ExecutionObservation>;
  try {
    executionHandle = input.backend.execute({
      argv: input.argv,
      egress_access: input.egress_access,
      lease
    });
    iterator = executionHandle[Symbol.asyncIterator]();
    execution = consumeExecution(iterator, meter);
  } catch {
    execution = Promise.resolve(emptyObservation("execution_failed", meter));
  }
  const softDeadline = timeout(input.backend.capabilities.policy.soft_timeout_ms, {
    kind: "soft_timeout"
  } as const);
  const hardDeadline = timeout(input.backend.capabilities.policy.hard_timeout_ms, {
    kind: "hard_timeout"
  } as const);
  let decision: LifecycleDecision;

  try {
    const first = await Promise.race([
      execution.then((observation) => ({ kind: "execution", observation }) as const),
      softDeadline.promise,
      hardDeadline.promise,
      ...(externalControl === undefined
        ? []
        : [externalControl.promise.then((reason) => ({ kind: "control", reason }) as const)])
    ]);

    if (first.kind === "execution") {
      const observation = first.observation;
      const killStatus =
        observation.terminal_state === "stream_interrupted"
          ? await requestKill(input.backend, lease, "stream_interrupted")
          : "not_requested";
      decision = { ...observation, kill_status: killStatus };
    } else if (first.kind === "control") {
      decision = {
        ...emptyObservation(controlTerminalState(first.reason), meter),
        kill_status: await requestKill(input.backend, lease, first.reason),
        requested_kill_reason: first.reason
      };
    } else if (first.kind === "hard_timeout") {
      decision = {
        ...emptyObservation("hard_timeout", meter),
        kill_status: await requestKill(input.backend, lease, "hard_timeout"),
        requested_kill_reason: "hard_timeout"
      };
    } else {
      const softKillStatus = await requestKill(input.backend, lease, "soft_timeout");
      if (softKillStatus === "confirmed" || softKillStatus === "already_terminal") {
        decision = {
          ...emptyObservation("soft_timeout", meter),
          kill_status: softKillStatus,
          requested_kill_reason: "soft_timeout"
        };
      } else {
        const afterSoft = await Promise.race([
          execution.then((observation) => ({ kind: "execution", observation }) as const),
          hardDeadline.promise,
          ...(externalControl === undefined
            ? []
            : [externalControl.promise.then((reason) => ({ kind: "control", reason }) as const)])
        ]);
        if (afterSoft.kind === "hard_timeout") {
          decision = {
            ...emptyObservation("hard_timeout", meter),
            kill_status: await requestKill(input.backend, lease, "hard_timeout"),
            requested_kill_reason: "hard_timeout"
          };
        } else if (afterSoft.kind === "control") {
          decision = {
            ...emptyObservation(controlTerminalState(afterSoft.reason), meter),
            kill_status: await requestKill(input.backend, lease, afterSoft.reason),
            requested_kill_reason: afterSoft.reason
          };
        } else {
          decision = {
            ...afterSoft.observation,
            kill_status: softKillStatus,
            requested_kill_reason: "soft_timeout",
            terminal_state: "soft_timeout"
          };
        }
      }
    }
  } finally {
    softDeadline.cancel();
    hardDeadline.cancel();
    externalControl?.cancel();
  }

  if (iterator !== undefined) {
    try {
      void iterator.return?.().catch(() => undefined);
    } catch {
      // Stream closure is best-effort; provider destroy remains cleanup authority.
    }
  }
  const cleanupStartedAt = Date.now();
  let cleanup = await destroyLease(input.backend, lease);
  if (executionHandle !== undefined) {
    const streamClosed = await boundedOperation(
      Promise.all([executionHandle.closed, execution]).then(() => undefined),
      SANDBOX_TERMINATION_GRACE_MS
    );
    if (streamClosed.status !== "settled") {
      cleanup = { ...cleanup, execution_closed: false, release_safe: false };
    }
  }
  const executionWallClockMs = elapsedSince(executionStartedAt);
  const cleanupWallClockMs = elapsedSince(cleanupStartedAt);
  const record: SandboxTerminalLifecycleRecord = {
    cleanup,
    execution_terminal_seen: decision.execution_terminal_seen,
    kill_status: decision.kill_status,
    lease_id: lease.lease_id,
    record_key: `${input.run_id}:${lease.lease_id}:terminal:v0`,
    requested_kill_reason: decision.requested_kill_reason,
    run_id: input.run_id,
    terminal_record_count: 1,
    terminal_state: decision.terminal_state,
    usage: {
      cleanup_wall_clock_ms: cleanupWallClockMs,
      estimated: false,
      execution_wall_clock_ms: executionWallClockMs,
      exit_code: decision.exit_code,
      lifecycle_wall_clock_ms: elapsedSince(lifecycleStartedAt),
      measurement: "observed",
      output_event_count: meter.output_event_count,
      stderr_bytes: meter.stderr_bytes,
      stdout_bytes: meter.stdout_bytes
    },
    version: "2026-07-11.sandbox-terminal-lifecycle.v0"
  };
  return recordTerminal(input, record);
}
