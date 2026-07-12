import { DurableObject } from "cloudflare:workers";
import { Container } from "@cloudflare/containers";
import {
  ContainerProxy as SandboxContainerProxy,
  Sandbox,
  getSandbox
} from "@cloudflare/sandbox";
import { resolveWorkspacePath, shellQuote } from "@cloudflare/sandbox/bridge";
import { SANDBOX_TOOL_GATEWAY_HOST } from "@aiphabee/agent-runtime";

import {
  createSandboxBridgeHandler,
  defaultRunGuardFactory,
  type BridgeEnv,
  type SandboxHandle
} from "./bridge.js";
import { handleRunGuardRequest } from "./run-guard.js";
import { CloudflareSandboxBackend } from "./cloudflare-sandbox-backend.js";
import {
  DurableObjectSandboxLeaseRegistry,
  handleSandboxLeaseRegistryRequest
} from "./lease-registry.js";
import {
  SANDBOX_TOOL_GATEWAY_OUTBOUND_HANDLER,
  denySandboxOutbound,
  forwardSandboxToolGatewayRequest,
  type SandboxToolGatewayEgressEnv
} from "./tool-gateway-egress.js";
import {
  handleArtifactScannerRequest,
  type ArtifactScannerEnv
} from "./artifact-scanner.js";

export class ArtifactScannerContainer extends Container {
  defaultPort = 8080;
  enableInternet = false;
  pingEndpoint = "scanner/startup";
  sleepAfter = "2m";
}

export class ContainerProxy extends SandboxContainerProxy {
  async fetch(request: Request): Promise<Response> {
    const hostname = new URL(request.url).hostname;
    const props = this.ctx.props;
    const override = props.outboundByHostOverrides?.[hostname];
    if (
      hostname === SANDBOX_TOOL_GATEWAY_HOST &&
      override?.method === SANDBOX_TOOL_GATEWAY_OUTBOUND_HANDLER
    ) {
      return forwardSandboxToolGatewayRequest(
        request,
        this.env as SandboxToolGatewayEgressEnv,
        { params: override.params }
      );
    }
    return super.fetch(request);
  }
}

export class RunGuard extends DurableObject {
  fetch(request: Request): Promise<Response> {
    return handleRunGuardRequest(this.ctx.storage, request);
  }
}

export class SandboxLeaseRegistryObject extends DurableObject {
  fetch(request: Request): Promise<Response> {
    return handleSandboxLeaseRegistryRequest(this.ctx.storage, request);
  }
}

export class AiphaBeeSandbox extends Sandbox {
  enableInternet = false;
  interceptHttps = true;
}

AiphaBeeSandbox.outbound = denySandboxOutbound;
AiphaBeeSandbox.outboundHandlers = {
  [SANDBOX_TOOL_GATEWAY_OUTBOUND_HANDLER]: forwardSandboxToolGatewayRequest
};

export interface Env extends BridgeEnv, SandboxToolGatewayEgressEnv, ArtifactScannerEnv {
  AIPHABEE_SANDBOX: DurableObjectNamespace<AiphaBeeSandbox>;
  SANDBOX_LEASE_REGISTRY: DurableObjectNamespace<SandboxLeaseRegistryObject>;
}

function configuredSandbox(env: Env, sandboxId: string): AiphaBeeSandbox {
  return getSandbox(env.AIPHABEE_SANDBOX, sandboxId, {
    enableDefaultSession: false,
    normalizeId: true,
    sleepAfter: "2m",
    transport: "rpc"
  });
}

export function createCloudflareSandboxBackend(env: Env): CloudflareSandboxBackend {
  return new CloudflareSandboxBackend({
    getSandbox: (providerId) => {
      const sandbox = configuredSandbox(env, providerId);
      return {
        createSession: (options) => sandbox.createSession(options),
        destroy: () => sandbox.destroy(),
        getSession: async (sessionId) => {
          const session = await sandbox.getSession(sessionId);
          return {
            startProcess: async (command, options) => {
              const process = await session.startProcess(command, options);
              return {
                id: process.id,
                kill: (signal) => process.kill(signal),
                waitForExit: async (timeoutMs) => {
                  const result = await process.waitForExit(timeoutMs);
                  return result.exitCode;
                }
              };
            }
          };
        },
        killProcess: (processId, signal) => sandbox.killProcess(processId, signal),
        removeOutboundByHost: (hostname) => sandbox.removeOutboundByHost(hostname),
        readFile: (path, options) => sandbox.readFile(path, options),
        setOutboundByHost: (hostname, methodName, params) =>
          sandbox.setOutboundByHost(hostname, methodName, params),
        writeFile: (path, content, options) => sandbox.writeFile(path, content, options)
      };
    },
    leaseRegistry: new DurableObjectSandboxLeaseRegistry(env.SANDBOX_LEASE_REGISTRY),
    newId: () => crypto.randomUUID(),
    shellQuote
  });
}

const handler = createSandboxBridgeHandler({
  getRunGuard: defaultRunGuardFactory,
  getSandbox: (env, sandboxId) => {
    const sandbox = configuredSandbox(env as Env, sandboxId);
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
  getProviderInstanceHash: async (env, sandboxId) => {
    const instanceId = (env as Env).AIPHABEE_SANDBOX.idFromName(
      sandboxId.toLowerCase()
    ).toString();
    const digest = new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(instanceId))
    );
    return `sha256:${[...digest]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")}`;
  },
  nowMs: () => Date.now(),
  resolveWorkspacePath,
  shellQuote
});

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname === "/internal/artifact-scan") {
      return handleArtifactScannerRequest(request, env);
    }
    return handler(request, env);
  }
} satisfies ExportedHandler<Env>;
