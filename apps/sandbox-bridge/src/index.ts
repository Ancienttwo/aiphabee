import { DurableObject } from "cloudflare:workers";
import { ContainerProxy, Sandbox, getSandbox } from "@cloudflare/sandbox";
import { resolveWorkspacePath, shellQuote } from "@cloudflare/sandbox/bridge";

import {
  createSandboxBridgeHandler,
  defaultRunGuardFactory,
  type BridgeEnv,
  type SandboxHandle
} from "./bridge.js";
import { handleRunGuardRequest } from "./run-guard.js";

export { ContainerProxy };

export class RunGuard extends DurableObject {
  fetch(request: Request): Promise<Response> {
    return handleRunGuardRequest(this.ctx.storage, request);
  }
}

export class AiphaBeeSandbox extends Sandbox {
  enableInternet = false;
}

export interface Env extends BridgeEnv {
  AIPHABEE_SANDBOX: DurableObjectNamespace<AiphaBeeSandbox>;
}

const handler = createSandboxBridgeHandler({
  getRunGuard: defaultRunGuardFactory,
  getSandbox: (env, sandboxId) => {
    const sandbox = getSandbox(
      env.AIPHABEE_SANDBOX as DurableObjectNamespace<AiphaBeeSandbox>,
      sandboxId,
      {
      enableDefaultSession: false,
      normalizeId: true,
      sleepAfter: "2m",
      transport: "rpc"
      }
    );
    return {
      destroy: () => sandbox.destroy(),
      exec: (command, options) => sandbox.exec(command, options),
      isRunning: async () => {
        try {
          await sandbox.exec("true", { timeout: 5_000 });
          return true;
        } catch {
          return false;
        }
      },
      listFiles: (path) => sandbox.listFiles(path),
      readFile: (path) => sandbox.readFile(path, { encoding: "utf-8" }),
      writeFile: (path, content) => sandbox.writeFile(path, content)
    } as SandboxHandle;
  },
  nowMs: () => Date.now(),
  resolveWorkspacePath,
  shellQuote
});

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handler(request, env);
  }
} satisfies ExportedHandler<Env>;
