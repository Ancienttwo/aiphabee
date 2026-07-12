import { describe, expect, it, vi } from "vitest";

import { FASTCLAW_TOOL_INTERCEPTION_CONTRACT_VERSION } from "@aiphabee/agent-runtime/fastclaw-agent-runner";

import {
  createFastClawVpsControlService,
  ServiceBindingFastClawCompliantTransport,
  type FastClawServiceBinding
} from "./fastclaw-service-transport.js";

const encoder = new TextEncoder();

function input(signal = new AbortController().signal) {
  return {
    external_user_identity: "better-auth:019c57d2-2239-7dd3-8122-cde82ffc519a",
    fastclaw_agent_id: "agent-row10",
    fastclaw_user_id: "user-row10",
    prompt: "Resolve the security.",
    run_id: "run-row10",
    sandbox_authorization: "sandbox-run-token",
    signal
  };
}

describe("service-binding FastClaw callback transport", () => {
  it("adds the VPS ingress credential and refuses cross-origin forwarding", async () => {
    const fetchMock = vi.fn(async (request: RequestInfo | URL) => {
      const forwarded = new Request(request);
      return Response.json({
        token: forwarded.headers.get("Authorization")
      });
    });
    const service = createFastClawVpsControlService({
      base_url: "https://89-167-47-141.sslip.io/",
      fetch: fetchMock,
      shared_token: "vps-shared-token-that-is-at-least-thirty-two-bytes"
    });

    const response = await service.fetch(
      "https://89-167-47-141.sslip.io/api/status",
      { headers: { Authorization: "Bearer must-not-cross-vps-boundary" } }
    );
    await expect(response.json()).resolves.toEqual({
      token: "Bearer vps-shared-token-that-is-at-least-thirty-two-bytes"
    });
    await expect(
      service.fetch("https://attacker.invalid/api/status")
    ).rejects.toMatchObject({ code: "FASTCLAW_VPS_ORIGIN_MISMATCH" });
  });

  it("blocks the remote model loop until AiphaBee posts the exact tool result", async () => {
    let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
    let resultRequest: Request | undefined;
    const service: FastClawServiceBinding = {
      fetch: vi.fn(async (requestInput, init) => {
        const request = new Request(requestInput, init);
        if (new URL(request.url).pathname.includes("/tool-results/")) {
          resultRequest = request;
          streamController?.enqueue(
            encoder.encode(
              `${JSON.stringify({
                raw_answer: "raw FastClaw answer",
                run_id: "run-row10",
                type: "final",
                usage: { input_tokens: 120, output_tokens: 40, steps: 1 }
              })}\n`
            )
          );
          streamController?.close();
          return new Response(JSON.stringify({
            call_id: "call-row10",
            replayed: false,
            run_id: "run-row10",
            status: "accepted"
          }), {
            headers: { "content-type": "application/json" },
            status: 200
          });
        }
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            streamController = controller;
            controller.enqueue(
              encoder.encode(
                `${JSON.stringify({ run_id: "run-row10", type: "remote_accepted" })}\n${JSON.stringify({
                  call: { call_id: "call-row10", input: { symbol: "00700.HK" }, name: "resolve_security" },
                  run_id: "run-row10",
                  type: "tool_call"
                })}\n`
              )
            );
          }
        });
        return new Response(stream, {
          headers: { "content-type": "application/x-ndjson" },
          status: 200
        });
      })
    };
    const transport = new ServiceBindingFastClawCompliantTransport({
      admin_api_key: "admin-api-key",
      base_url: "https://fastclaw.internal/",
      service
    });
    const onToolCall = vi.fn(async () => ({ security_id: "sec-1" }));
    const onProgress = vi.fn();

    await expect(transport.run(input(), { onProgress, onToolCall })).resolves.toEqual({
      raw_answer: "raw FastClaw answer",
      usage: { input_tokens: 120, output_tokens: 40, steps: 1 }
    });
    expect(onProgress).toHaveBeenCalledWith("remote_accepted");
    expect(onToolCall).toHaveBeenCalledWith({
      call_id: "call-row10",
      input: { symbol: "00700.HK" },
      name: "resolve_security"
    });
    expect(resultRequest).toBeDefined();
    expect(resultRequest?.headers.get("X-AiphaBee-Tool-Callback-Contract")).toBe(
      FASTCLAW_TOOL_INTERCEPTION_CONTRACT_VERSION
    );
    expect(resultRequest?.headers.get("X-AiphaBee-Sandbox-Authorization")).toBe(
      "sandbox-run-token"
    );
    expect(resultRequest?.headers.get("X-AiphaBee-FastClaw-User-Id")).toBe("user-row10");
    await expect(resultRequest?.json()).resolves.toEqual({ output: { security_id: "sec-1" } });
  });

  it("reports the callback rejection status without exposing the response body", async () => {
    let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
    const service: FastClawServiceBinding = {
      fetch: vi.fn(async (requestInput, init) => {
        const request = new Request(requestInput, init);
        if (new URL(request.url).pathname.includes("/tool-results/")) {
          return Response.json(
            { error: { code: "SECRET_INTERNAL_DETAIL" } },
            { status: 409 }
          );
        }
        return new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              streamController = controller;
              controller.enqueue(
                encoder.encode(
                  `${JSON.stringify({ run_id: "run-row10", type: "remote_accepted" })}\n${JSON.stringify({
                    call: {
                      call_id: "call-row10",
                      input: { symbol: "00700.HK" },
                      name: "resolve_security"
                    },
                    run_id: "run-row10",
                    type: "tool_call"
                  })}\n`
                )
              );
            },
            cancel() {
              streamController = undefined;
            }
          }),
          { headers: { "content-type": "application/x-ndjson" }, status: 200 }
        );
      })
    };
    const errors: string[] = [];
    const transport = new ServiceBindingFastClawCompliantTransport({
      admin_api_key: "admin-api-key",
      base_url: "https://fastclaw.internal/",
      on_error: (code) => errors.push(code),
      service
    });

    await expect(
      transport.run(input(), {
        onProgress: vi.fn(),
        onToolCall: vi.fn(async () => ({ security_id: "sec-1" }))
      })
    ).rejects.toMatchObject({ code: "FASTCLAW_CALLBACK_RESULT_REJECTED_409" });
    expect(errors).toEqual(["FASTCLAW_CALLBACK_RESULT_REJECTED_409"]);
  });

  it("replays the exact callback once after an ambiguous transport failure", async () => {
    let callbackAttempts = 0;
    const service: FastClawServiceBinding = {
      fetch: vi.fn(async (requestInput, init) => {
        const request = new Request(requestInput, init);
        if (new URL(request.url).pathname.includes("/tool-results/")) {
          callbackAttempts += 1;
          if (callbackAttempts === 1) throw new TypeError("connection reset after write");
          return Response.json({
            call_id: "call-row10",
            replayed: true,
            run_id: "run-row10",
            status: "accepted"
          });
        }
        return new Response(
          `${JSON.stringify({ run_id: "run-row10", type: "remote_accepted" })}\n${JSON.stringify({
            call: {
              call_id: "call-row10",
              input: { symbol: "00700.HK" },
              name: "resolve_security"
            },
            run_id: "run-row10",
            type: "tool_call"
          })}\n${JSON.stringify({
            raw_answer: "done",
            run_id: "run-row10",
            type: "final",
            usage: { input_tokens: 1, output_tokens: 1, steps: 1 }
          })}\n`,
          { headers: { "content-type": "application/x-ndjson" } }
        );
      })
    };
    const transport = new ServiceBindingFastClawCompliantTransport({
      admin_api_key: "admin-api-key",
      base_url: "https://fastclaw.internal/",
      service
    });

    await expect(
      transport.run(input(), {
        onProgress: vi.fn(),
        onToolCall: vi.fn(async () => ({ security_id: "sec-1" }))
      })
    ).resolves.toEqual({
      raw_answer: "done",
      usage: { input_tokens: 1, output_tokens: 1, steps: 1 }
    });
    expect(callbackAttempts).toBe(2);
  });

  it("normalizes an unclassified fetch runtime failure into a safe observable code", async () => {
    const errors: string[] = [];
    const transport = new ServiceBindingFastClawCompliantTransport({
      admin_api_key: "admin-api-key",
      base_url: "https://fastclaw.internal/",
      on_error: (code) => errors.push(code),
      service: {
        fetch: vi.fn(async () => {
          throw new TypeError("secret upstream network detail");
        })
      }
    });

    await expect(
      transport.run(input(), { onProgress: vi.fn(), onToolCall: vi.fn() })
    ).rejects.toMatchObject({ code: "FASTCLAW_TRANSPORT_RUNTIME_RUN_REQUEST_TYPEERROR" });
    expect(errors).toEqual(["FASTCLAW_TRANSPORT_RUNTIME_RUN_REQUEST_TYPEERROR"]);
  });

  it("rejects opaque, out-of-order and mismatched callback streams", async () => {
    const responseFor = (lines: unknown[], contentType = "application/x-ndjson") => ({
      fetch: vi.fn(async () =>
        new Response(lines.map((line) => JSON.stringify(line)).join("\n") + "\n", {
          headers: { "content-type": contentType },
          status: 200
        })
      )
    });
    const callbacks = { onProgress: vi.fn(), onToolCall: vi.fn() };
    const opaque = new ServiceBindingFastClawCompliantTransport({
      admin_api_key: "key",
      base_url: "https://fastclaw.internal/",
      service: responseFor([], "text/event-stream")
    });
    await expect(opaque.run(input(), callbacks)).rejects.toMatchObject({
      code: "FASTCLAW_CALLBACK_CONTENT_TYPE_INVALID"
    });

    const mismatched = new ServiceBindingFastClawCompliantTransport({
      admin_api_key: "key",
      base_url: "https://fastclaw.internal/",
      service: responseFor([{ run_id: "other-run", type: "remote_accepted" }])
    });
    await expect(mismatched.run(input(), callbacks)).rejects.toMatchObject({
      code: "FASTCLAW_CALLBACK_RUN_MISMATCH"
    });

    const finalFirst = new ServiceBindingFastClawCompliantTransport({
      admin_api_key: "key",
      base_url: "https://fastclaw.internal/",
      service: responseFor([
        {
          raw_answer: "raw",
          run_id: "run-row10",
          type: "final",
          usage: { input_tokens: 1, output_tokens: 1, steps: 0 }
        }
      ])
    });
    await expect(finalFirst.run(input(), callbacks)).rejects.toMatchObject({
      code: "FASTCLAW_CALLBACK_FINAL_INVALID"
    });
  });

  it("aborts the remote stream when AiphaBee policy rejects the tool", async () => {
    let cancelled = false;
    const service: FastClawServiceBinding = {
      fetch: vi.fn(async (_requestInput, init) => {
        init?.signal?.addEventListener("abort", () => {
          cancelled = true;
        });
        return new Response(
          `${JSON.stringify({ run_id: "run-row10", type: "remote_accepted" })}\n${JSON.stringify({
            call: { call_id: "call-denied", input: {}, name: "resolve_security" },
            run_id: "run-row10",
            type: "tool_call"
          })}\n`,
          { headers: { "content-type": "application/x-ndjson" }, status: 200 }
        );
      })
    };
    const transport = new ServiceBindingFastClawCompliantTransport({
      admin_api_key: "key",
      base_url: "https://fastclaw.internal/",
      service
    });
    await expect(
      transport.run(input(), {
        onProgress: vi.fn(),
        onToolCall: vi.fn(async () => {
          throw new Error("policy denied");
        })
      })
    ).rejects.toThrow("policy denied");
    expect(cancelled).toBe(true);
    expect(service.fetch).toHaveBeenCalledTimes(1);
  });
});
