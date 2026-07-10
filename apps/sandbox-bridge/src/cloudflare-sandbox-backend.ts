import {
  SANDBOX_BACKEND_REQUIRED_CAPABILITIES,
  SANDBOX_HARD_TIMEOUT_MS,
  validateSandboxWorkspacePath,
  type SandboxBackend,
  type SandboxCreateInput,
  type SandboxCreateResult,
  type SandboxDestroyInput,
  type SandboxDestroyResult,
  type SandboxExecuteInput,
  type SandboxExecutionEvent,
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

const BACKEND_ID = "cloudflare.sandbox-v0";
const MAX_FILE_BYTES = 1_048_576;
const MAX_OUTPUT_QUEUE_BYTES = 1_048_576;
const MAX_OUTPUT_QUEUE_EVENTS = 1_024;
const PROVIDER_TERMINATION_CONFIRM_TIMEOUT_MS = 15_000;
const UTF8_ENCODER = new TextEncoder();

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
  readFile(
    path: string,
    options: { encoding: "none"; sessionId: string }
  ): Promise<{ content: ReadableStream<Uint8Array>; success: true }>;
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

class AsyncEventQueue implements AsyncIterable<SandboxExecutionEvent> {
  private closed = false;
  private readonly events: Array<{ event: SandboxExecutionEvent; size: number }> = [];
  private queuedBytes = 0;
  private wake: (() => void) | undefined;

  push(event: SandboxExecutionEvent): boolean {
    if (this.closed) return false;
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
    this.closed = true;
    this.wake?.();
    this.wake = undefined;
  }

  async *[Symbol.asyncIterator](): AsyncIterator<SandboxExecutionEvent> {
    while (!this.closed || this.events.length > 0) {
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
    let providerCreationStarted = false;
    let reserved = false;
    try {
      await this.dependencies.leaseRegistry.reserve(record);
      reserved = true;
      providerCreationStarted = true;
      await this.dependencies.getSandbox(providerId).createSession({
        commandTimeoutMs: SANDBOX_HARD_TIMEOUT_MS,
        cwd: "/workspace",
        id: sessionId
      });
      await this.dependencies.leaseRegistry.markReady(lease);
      return { lease, status: "created" };
    } catch {
      let providerCleanupConfirmed = false;
      if (providerCreationStarted) {
        try {
          await withTimeout(
            this.dependencies.getSandbox(providerId).destroy(),
            PROVIDER_TERMINATION_CONFIRM_TIMEOUT_MS
          );
          providerCleanupConfirmed = true;
        } catch {
          // The create result remains failed; Row 5 owns cleanup retry/audit.
        }
      }
      if (reserved && providerCleanupConfirmed) {
        try {
          await this.dependencies.leaseRegistry.remove(lease);
        } catch {
          // Preserve the original provider failure classification.
        }
      }
      return { error_code: "create_failed", retryable: true, status: "failed" };
    }
  }

  execute(input: SandboxExecuteInput): AsyncIterable<SandboxExecutionEvent> {
    const queue = new AsyncEventQueue();
    void this.runProcess(input, queue);
    return queue;
  }

  private async runProcess(input: SandboxExecuteInput, queue: AsyncEventQueue): Promise<void> {
    let sequence = 0;
    let processId: string | undefined;
    let process: CloudflareSandboxProcess | undefined;
    let processBound = false;
    let processTerminalConfirmed = false;
    let providerId: string | undefined;
    let rejectStream: (error: Error) => void = () => undefined;
    let resolveStream: (exitCode: number) => void = () => undefined;
    const streamedExit = new Promise<number>((resolve, reject) => {
      rejectStream = reject;
      resolveStream = resolve;
    });
    void streamedExit.catch(() => undefined);
    try {
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
      const session = await this.dependencies.getSandbox(providerId).getSession(sessionId);
      process = await session.startProcess(command, {
        autoCleanup: false,
        cwd: "/workspace",
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
      });
      if (process.id !== processId) throw new Error("provider process ID mismatch");
      const processBinding = await this.dependencies.leaseRegistry.markProcessRunning(
        input.lease,
        process.id
      );
      if (processBinding.kill_requested) {
        await withTimeout(
          process.kill("SIGTERM"),
          PROVIDER_TERMINATION_CONFIRM_TIMEOUT_MS
        );
        await this.dependencies.leaseRegistry.finishKill(input.lease);
      }
      const exitCode = await withTimeout(streamedExit, SANDBOX_HARD_TIMEOUT_MS);
      processTerminalConfirmed = true;
      queue.push({ event: "exit", exit_code: exitCode, sequence: sequence++, terminal: true });
    } catch (error) {
      if (process !== undefined) {
        try {
          await withTimeout(
            process.kill("SIGTERM"),
            PROVIDER_TERMINATION_CONFIRM_TIMEOUT_MS
          );
          await withTimeout(process.waitForExit(), PROVIDER_TERMINATION_CONFIRM_TIMEOUT_MS);
          processTerminalConfirmed = true;
        } catch {
          // The terminal failure remains explicit; Row 5 owns cleanup retry/audit.
        }
      } else if (providerId !== undefined && processId !== undefined) {
        try {
          await withTimeout(
            this.dependencies.getSandbox(providerId).killProcess(processId, "SIGTERM"),
            PROVIDER_TERMINATION_CONFIRM_TIMEOUT_MS
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
      if (processId !== undefined && processBound && processTerminalConfirmed) {
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
        PROVIDER_TERMINATION_CONFIRM_TIMEOUT_MS
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
        PROVIDER_TERMINATION_CONFIRM_TIMEOUT_MS
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
