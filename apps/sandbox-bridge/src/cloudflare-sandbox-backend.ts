import {
  SANDBOX_BACKEND_REQUIRED_CAPABILITIES,
  SANDBOX_CREATE_TIMEOUT_MS,
  SANDBOX_HARD_TIMEOUT_MS,
  SANDBOX_TERMINATION_GRACE_MS,
  SANDBOX_TOOL_GATEWAY_HOST,
  SANDBOX_TOOL_GATEWAY_URL,
  validateSandboxWorkspacePath,
  type SandboxBackend,
  type SandboxCreateInput,
  type SandboxCreateResult,
  type SandboxDestroyInput,
  type SandboxDestroyResult,
  type SandboxEgressAccess,
  type SandboxExecuteInput,
  type SandboxExecutionEvent,
  type SandboxExecutionHandle,
  type SandboxKillInput,
  type SandboxKillResult,
  type SandboxReadFileInput,
  type SandboxReadFileResult,
  type SandboxWriteFileInput,
  type SandboxWriteResult
} from "@aiphabee/agent-runtime";

import {
  snapshotSandboxGrant,
  type SandboxLeaseDestroyReservation,
  type SandboxLeaseKillReservation,
  type SandboxLeaseRecord,
  type SandboxLeaseRegistry
} from "./lease-registry.js";
import {
  SANDBOX_TOOL_GATEWAY_OUTBOUND_HANDLER,
  type SandboxToolGatewayEgressParams
} from "./tool-gateway-egress.js";

const BACKEND_ID = "cloudflare.sandbox-v0";
const MAX_FILE_BYTES = 1_048_576;
const MAX_OUTPUT_QUEUE_BYTES = 1_048_576;
const MAX_OUTPUT_QUEUE_EVENTS = 1_024;
const UTF8_ENCODER = new TextEncoder();
const TOOL_GATEWAY_TOKEN_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;

class ProviderOperationTimeoutError extends Error {}
class SandboxAdapterRequestRejectedError extends Error {}
class SandboxOutputLimitError extends Error {}

export interface CloudflareSandboxProcess {
  id: string;
  kill(signal?: string): Promise<void>;
  waitForExit(timeoutMs?: number): Promise<number>;
}

export interface CloudflareSandboxSession {
  startProcess(
    command: string,
    options: {
      autoCleanup: false;
      cwd: string;
      env?: Record<string, string>;
      onError(error: Error): void;
      onExit(code: number | null): void;
      onOutput(stream: "stderr" | "stdout", data: string): void;
      processId: string;
    }
  ): Promise<CloudflareSandboxProcess>;
}

export interface CloudflareSandboxHandle {
  createSession(options: {
    commandTimeoutMs: number;
    cwd: string;
    id: string;
  }): Promise<unknown>;
  destroy(): Promise<void>;
  getSession(sessionId: string): Promise<CloudflareSandboxSession>;
  killProcess(processId: string, signal?: string): Promise<void>;
  removeOutboundByHost(hostname: string): Promise<void>;
  readFile(
    path: string,
    options: { encoding: "none"; sessionId: string }
  ): Promise<{ content: ReadableStream<Uint8Array>; success: true }>;
  setOutboundByHost(
    hostname: string,
    methodName: string,
    params: SandboxToolGatewayEgressParams
  ): Promise<void>;
  writeFile(
    path: string,
    content: ReadableStream<Uint8Array>,
    options: { sessionId: string }
  ): Promise<{ success: boolean }>;
}

export interface CloudflareSandboxBackendDependencies {
  getSandbox(providerId: string): CloudflareSandboxHandle;
  leaseRegistry: SandboxLeaseRegistry;
  newId(): string;
  shellQuote(argument: string): string;
}

class AsyncEventQueue implements SandboxExecutionHandle {
  private ended = false;
  private resolveClosed: (() => void) | undefined;
  readonly closed = new Promise<void>((resolve) => {
    this.resolveClosed = resolve;
  });
  private readonly events: Array<{ event: SandboxExecutionEvent; size: number }> = [];
  private queuedBytes = 0;
  private wake: (() => void) | undefined;

  push(event: SandboxExecutionEvent): boolean {
    if (this.ended) return false;
    const size = event.event === "output" ? UTF8_ENCODER.encode(event.chunk).byteLength : 0;
    if (
      event.event === "output" &&
      (this.events.length >= MAX_OUTPUT_QUEUE_EVENTS ||
        this.queuedBytes + size > MAX_OUTPUT_QUEUE_BYTES)
    ) {
      return false;
    }
    this.events.push({ event, size });
    this.queuedBytes += size;
    this.wake?.();
    this.wake = undefined;
    return true;
  }

  close(): void {
    if (this.ended) return;
    this.ended = true;
    this.wake?.();
    this.wake = undefined;
    this.resolveClosed?.();
    this.resolveClosed = undefined;
  }

  async *[Symbol.asyncIterator](): AsyncIterator<SandboxExecutionEvent> {
    while (!this.ended || this.events.length > 0) {
      const queued = this.events.shift();
      if (queued !== undefined) {
        this.queuedBytes -= queued.size;
        yield queued.event;
        continue;
      }
      await new Promise<void>((resolve) => {
        this.wake = resolve;
      });
    }
  }
}

function validateEgressAccess(access: unknown): SandboxEgressAccess {
  if (typeof access !== "object" || access === null || Array.isArray(access)) {
    throw new SandboxAdapterRequestRejectedError("missing sandbox egress access");
  }
  const candidate = access as Record<string, unknown>;
  if (candidate.kind === "deny_all") {
    if (Object.keys(access).length !== 1) {
      throw new SandboxAdapterRequestRejectedError("invalid deny-all egress access");
    }
    return { kind: "deny_all" };
  }
  if (
    candidate.kind !== "tool_gateway" ||
    Object.keys(candidate).sort().join(",") !== "endpoint,kind,run_id,token" ||
    candidate.endpoint !== SANDBOX_TOOL_GATEWAY_URL ||
    typeof candidate.run_id !== "string" ||
    candidate.run_id.length < 1 ||
    candidate.run_id.length > 128 ||
    candidate.run_id.trim() !== candidate.run_id ||
    CONTROL_CHARACTER_PATTERN.test(candidate.run_id) ||
    typeof candidate.token !== "string" ||
    candidate.token.length > 4_096 ||
    !TOOL_GATEWAY_TOKEN_PATTERN.test(candidate.token)
  ) {
    throw new SandboxAdapterRequestRejectedError("invalid Tool Gateway egress access");
  }
  return {
    endpoint: SANDBOX_TOOL_GATEWAY_URL,
    kind: "tool_gateway",
    run_id: candidate.run_id,
    token: candidate.token
  };
}

function workspacePath(path: unknown): string {
  const decision = validateSandboxWorkspacePath(path);
  if (decision.status !== "allowed") {
    throw new SandboxAdapterRequestRejectedError("invalid sandbox workspace path");
  }
  return `/workspace/${decision.workspace_path}`;
}

function bytesStream(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    }
  });
}

async function collectBounded(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    size += result.value.byteLength;
    if (size > MAX_FILE_BYTES) {
      await reader.cancel("sandbox file exceeds adapter limit");
      throw new Error("sandbox file exceeds adapter limit");
    }
    chunks.push(result.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new ProviderOperationTimeoutError("provider operation timed out")),
          timeoutMs
        );
      })
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

export class CloudflareSandboxBackend implements SandboxBackend {
  readonly backend_id = BACKEND_ID;
  readonly capabilities = SANDBOX_BACKEND_REQUIRED_CAPABILITIES;

  constructor(private readonly dependencies: CloudflareSandboxBackendDependencies) {}

  async create(input: SandboxCreateInput): Promise<SandboxCreateResult> {
    const leaseId = this.dependencies.newId();
    const providerId = `ab-${leaseId}`;
    const sessionId = `session-${leaseId}`;
    const lease = {
      access_grant: input.access_grant,
      backend_id: this.backend_id,
      lease_id: leaseId,
      status: "ready"
    } as const;
    const record: SandboxLeaseRecord = {
      backend_id: this.backend_id,
      binding: snapshotSandboxGrant(input.access_grant),
      kill_requested: false,
      lease_id: leaseId,
      provider_id: providerId,
      session_id: sessionId,
      status: "pending"
    };
    let providerCreation: Promise<unknown> | undefined;
    let providerCreationStarted = false;
    let reserved = false;
    try {
      await this.dependencies.leaseRegistry.reserve(record);
      reserved = true;
      providerCreationStarted = true;
      providerCreation = this.dependencies.getSandbox(providerId).createSession({
          commandTimeoutMs: SANDBOX_HARD_TIMEOUT_MS,
          cwd: "/workspace",
          id: sessionId
        });
      await withTimeout(
        providerCreation,
        SANDBOX_CREATE_TIMEOUT_MS - SANDBOX_TERMINATION_GRACE_MS
      );
      await this.dependencies.leaseRegistry.markReady(lease);
      return { lease, status: "created" };
    } catch (error) {
      const providerCreationTimedOut = error instanceof ProviderOperationTimeoutError;
      let providerCleanupConfirmed = false;
      if (providerCreationStarted) {
        try {
          await withTimeout(
            this.dependencies.getSandbox(providerId).destroy(),
            SANDBOX_TERMINATION_GRACE_MS
          );
          providerCleanupConfirmed = true;
        } catch {
          // The create result remains failed; Row 5 owns cleanup retry/audit.
        }
      }
      if (
        reserved &&
        providerCreationTimedOut &&
        providerCreation !== undefined
      ) {
        void providerCreation.then(
          async () => {
            try {
              await withTimeout(
                this.dependencies.getSandbox(providerId).destroy(),
                SANDBOX_TERMINATION_GRACE_MS
              );
              await this.dependencies.leaseRegistry.remove(lease);
            } catch {
              // Keep the pending tombstone when late-create cleanup is unconfirmed.
            }
          },
          async () => {
            if (!providerCleanupConfirmed) return;
            try {
              await this.dependencies.leaseRegistry.remove(lease);
            } catch {
              // Keep the pending tombstone when reconciliation is unconfirmed.
            }
          }
        );
      } else if (reserved && providerCleanupConfirmed) {
        try {
          await this.dependencies.leaseRegistry.remove(lease);
        } catch {
          // Preserve the original provider failure classification.
        }
      }
      return { error_code: "create_failed", retryable: true, status: "failed" };
    }
  }

  execute(input: SandboxExecuteInput): SandboxExecutionHandle {
    const queue = new AsyncEventQueue();
    void this.runProcess(input, queue);
    return queue;
  }

  private async runProcess(input: SandboxExecuteInput, queue: AsyncEventQueue): Promise<void> {
    let sequence = 0;
    let processId: string | undefined;
    let process: CloudflareSandboxProcess | undefined;
    let processBound = false;
    let processStartAttempted = false;
    let processStartStateUncertain = false;
    let processTerminalConfirmed = false;
    let providerId: string | undefined;
    let sandbox: CloudflareSandboxHandle | undefined;
    let outboundStateConfirmedClean = false;
    let toolGatewayConfigurationAttempted = false;
    let toolGatewayConfigurationConfirmed = false;
    let rejectStream: (error: Error) => void = () => undefined;
    let resolveStream: (exitCode: number) => void = () => undefined;
    const streamedExit = new Promise<number>((resolve, reject) => {
      rejectStream = reject;
      resolveStream = resolve;
    });
    void streamedExit.catch(() => undefined);
    try {
      const egressAccess = validateEgressAccess(input.egress_access);
      const command = input.argv.map(this.dependencies.shellQuote).join(" ");
      processId = this.dependencies.newId();
      const reservation = await this.dependencies.leaseRegistry.beginProcess(
        input.lease,
        processId
      );
      if (reservation === undefined) {
        throw new SandboxAdapterRequestRejectedError("lease rejected");
      }
      processBound = true;
      providerId = reservation.record.provider_id;
      const sessionId = reservation.record.session_id;
      sandbox = this.dependencies.getSandbox(providerId);
      await withTimeout(
        sandbox.removeOutboundByHost(SANDBOX_TOOL_GATEWAY_HOST),
        SANDBOX_TERMINATION_GRACE_MS
      );
      outboundStateConfirmedClean = true;
      if (egressAccess.kind === "tool_gateway") {
        const owner = input.lease.access_grant.owner;
        if (owner.kind === "run" && owner.run_id !== egressAccess.run_id) {
          throw new SandboxAdapterRequestRejectedError(
            "Tool Gateway run does not match the sandbox lease owner"
          );
        }
        toolGatewayConfigurationAttempted = true;
        outboundStateConfirmedClean = false;
        await withTimeout(
          sandbox.setOutboundByHost(
            SANDBOX_TOOL_GATEWAY_HOST,
            SANDBOX_TOOL_GATEWAY_OUTBOUND_HANDLER,
            {
              lease_id: input.lease.lease_id,
              run_id: egressAccess.run_id,
              tenant_id: input.lease.access_grant.tenant_id,
              token: egressAccess.token,
              user_id: input.lease.access_grant.user_id
            }
          ),
          SANDBOX_TERMINATION_GRACE_MS
        );
        toolGatewayConfigurationConfirmed = true;
      }
      const session = await sandbox.getSession(sessionId);
      processStartAttempted = true;
      try {
        process = await withTimeout(
          session.startProcess(command, {
            autoCleanup: false,
            cwd: "/workspace",
            env:
              egressAccess.kind === "tool_gateway"
                ? { AIPHABEE_TOOL_GATEWAY_URL: SANDBOX_TOOL_GATEWAY_URL }
                : undefined,
            onError: (error) => {
              rejectStream(error);
            },
            onExit: (code) => {
              if (code === null) {
                rejectStream(new Error("provider process exited without an exit code"));
                return;
              }
              resolveStream(code);
            },
            onOutput: (stream, data) => {
              const accepted = queue.push({
                chunk: data,
                classification: "untrusted_process_output",
                event: "output",
                sequence,
                stream,
                terminal: false
              });
              if (accepted) {
                sequence += 1;
                return;
              }
              rejectStream(new SandboxOutputLimitError("sandbox output queue limit exceeded"));
            },
            processId
          }),
          SANDBOX_TERMINATION_GRACE_MS
        );
      } catch (error) {
        if (error instanceof ProviderOperationTimeoutError) {
          processStartStateUncertain = true;
        }
        throw error;
      }
      if (process.id !== processId) throw new Error("provider process ID mismatch");
      const processBinding = await this.dependencies.leaseRegistry.markProcessRunning(
        input.lease,
        process.id
      );
      if (processBinding.kill_requested) {
        await withTimeout(
          process.kill("SIGTERM"),
          SANDBOX_TERMINATION_GRACE_MS
        );
        await this.dependencies.leaseRegistry.finishKill(input.lease);
      }
      const exitCode = await withTimeout(streamedExit, SANDBOX_HARD_TIMEOUT_MS);
      processTerminalConfirmed = true;
      queue.push({ event: "exit", exit_code: exitCode, sequence: sequence++, terminal: true });
    } catch (error) {
      if (!processStartAttempted) processTerminalConfirmed = true;
      if (process !== undefined) {
        try {
          await withTimeout(
            process.kill("SIGTERM"),
            SANDBOX_TERMINATION_GRACE_MS
          );
          await withTimeout(process.waitForExit(), SANDBOX_TERMINATION_GRACE_MS);
          processTerminalConfirmed = true;
        } catch {
          // The terminal failure remains explicit; Row 5 owns cleanup retry/audit.
        }
      } else if (
        processStartAttempted &&
        providerId !== undefined &&
        processId !== undefined
      ) {
        try {
          await withTimeout(
            this.dependencies.getSandbox(providerId).killProcess(processId, "SIGTERM"),
            SANDBOX_TERMINATION_GRACE_MS
          );
          processTerminalConfirmed = true;
        } catch {
          // The starting process remains registered so destroy or a later kill can recover it.
        }
      }
      queue.push({
        error_code: "execute_failed",
        event: "failed",
        reason: error instanceof ProviderOperationTimeoutError ? "hard_timeout" : "backend_failure",
        retryable:
          !(error instanceof ProviderOperationTimeoutError) &&
          !(error instanceof SandboxAdapterRequestRejectedError) &&
          !(error instanceof SandboxOutputLimitError),
        sequence: sequence++,
        terminal: true
      });
    } finally {
      if (
        sandbox !== undefined &&
        (toolGatewayConfigurationAttempted || !outboundStateConfirmedClean)
      ) {
        try {
          await withTimeout(
            sandbox.removeOutboundByHost(SANDBOX_TOOL_GATEWAY_HOST),
            SANDBOX_TERMINATION_GRACE_MS
          );
          if (!toolGatewayConfigurationAttempted || toolGatewayConfigurationConfirmed) {
            outboundStateConfirmedClean = true;
          }
        } catch {
          outboundStateConfirmedClean = false;
        }
      }
      if (
        processId !== undefined &&
        processBound &&
        processTerminalConfirmed &&
        outboundStateConfirmedClean &&
        !processStartStateUncertain
      ) {
        try {
          await this.dependencies.leaseRegistry.clearProcess(input.lease, processId);
        } catch {
          // A stale process binding fails later authorization closed.
        }
      }
      queue.close();
    }
  }

  async writeFile(input: SandboxWriteFileInput): Promise<SandboxWriteResult> {
    try {
      const authorization = await this.dependencies.leaseRegistry.authorize(input.lease);
      if (authorization.status !== "allowed") {
        throw new SandboxAdapterRequestRejectedError("lease rejected");
      }
      const result = await this.dependencies
        .getSandbox(authorization.record.provider_id)
        .writeFile(workspacePath(input.workspace_path), bytesStream(input.bytes), {
          sessionId: authorization.record.session_id
        });
      if (!result.success) throw new Error("provider write failed");
      return {
        receipt: {
          bytes_written: input.bytes.byteLength,
          lease_id: input.lease.lease_id,
          workspace_path: input.workspace_path
        },
        status: "written"
      };
    } catch (error) {
      return {
        error_code: "file_write_failed",
        retryable: !(error instanceof SandboxAdapterRequestRejectedError),
        status: "failed"
      };
    }
  }

  async readFile(input: SandboxReadFileInput): Promise<SandboxReadFileResult> {
    try {
      const authorization = await this.dependencies.leaseRegistry.authorize(input.lease);
      if (authorization.status !== "allowed") {
        throw new SandboxAdapterRequestRejectedError("lease rejected");
      }
      const result = await this.dependencies
        .getSandbox(authorization.record.provider_id)
        .readFile(workspacePath(input.workspace_path), {
          encoding: "none",
          sessionId: authorization.record.session_id
        });
      return {
        result: {
          bytes: await collectBounded(result.content),
          lease_id: input.lease.lease_id,
          workspace_path: input.workspace_path
        },
        status: "read"
      };
    } catch (error) {
      return {
        error_code: "file_read_failed",
        retryable: !(error instanceof SandboxAdapterRequestRejectedError),
        status: "failed"
      };
    }
  }

  async kill(input: SandboxKillInput): Promise<SandboxKillResult> {
    let reservation: SandboxLeaseKillReservation | undefined;
    try {
      reservation = await this.dependencies.leaseRegistry.requestKill(input.lease);
    } catch {
      return {
        error_code: "kill_failed",
        lease_id: input.lease.lease_id,
        reason: input.reason,
        retryable: true,
        status: "failed",
        terminal: false
      };
    }
    if (reservation === undefined) {
      return {
        error_code: "kill_failed",
        lease_id: input.lease.lease_id,
        reason: input.reason,
        retryable: false,
        status: "failed",
        terminal: false
      };
    }
    if (reservation.status === "already_terminal") {
      return {
        lease_id: input.lease.lease_id,
        reason: input.reason,
        status: "already_terminal",
        terminal: true
      };
    }
    try {
      await withTimeout(
        this.dependencies
          .getSandbox(reservation.provider_id)
          .killProcess(reservation.process_id, "SIGTERM"),
        SANDBOX_TERMINATION_GRACE_MS
      );
      await this.dependencies.leaseRegistry.finishKill(input.lease);
      return {
        lease_id: input.lease.lease_id,
        reason: input.reason,
        status: "killed",
        terminal: true
      };
    } catch {
      return {
        error_code: "kill_failed",
        lease_id: input.lease.lease_id,
        reason: input.reason,
        retryable: true,
        status: "failed",
        terminal: false
      };
    }
  }

  async destroy(input: SandboxDestroyInput): Promise<SandboxDestroyResult> {
    let reservation: SandboxLeaseDestroyReservation | undefined;
    try {
      reservation = await this.dependencies.leaseRegistry.beginDestroy(input.lease);
    } catch {
      return {
        error_code: "destroy_failed",
        lease_id: input.lease.lease_id,
        retryable: true,
        status: "failed",
        terminal: false
      };
    }
    if (reservation === undefined) {
      return {
        error_code: "destroy_failed",
        lease_id: input.lease.lease_id,
        retryable: false,
        status: "failed",
        terminal: false
      };
    }
    if (reservation.status === "already_destroyed") {
      return { lease_id: input.lease.lease_id, status: "already_destroyed", terminal: true };
    }
    try {
      await withTimeout(
        this.dependencies.getSandbox(reservation.provider_id).destroy(),
        SANDBOX_TERMINATION_GRACE_MS
      );
    } catch (error) {
      if (
        reservation.recovery === "fresh" &&
        !(error instanceof ProviderOperationTimeoutError)
      ) {
        try {
          await this.dependencies.leaseRegistry.abortDestroy(input.lease);
        } catch {
          // A repeated destroy can recover the closed destroying state.
        }
      }
      return {
        error_code: "destroy_failed",
        lease_id: input.lease.lease_id,
        retryable: true,
        status: "failed",
        terminal: false
      };
    }
    try {
      await this.dependencies.leaseRegistry.finishDestroy(input.lease);
      return { lease_id: input.lease.lease_id, status: "destroyed", terminal: true };
    } catch {
      return {
        error_code: "destroy_failed",
        lease_id: input.lease.lease_id,
        retryable: true,
        status: "failed",
        terminal: false
      };
    }
  }
}
