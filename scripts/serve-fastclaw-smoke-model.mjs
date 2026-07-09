import { createServer } from "node:http";

const port = Number.parseInt(process.env.FASTCLAW_SMOKE_MODEL_PORT ?? "18081", 10);
if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) {
  throw new Error("FASTCLAW_SMOKE_MODEL_PORT must be an integer between 1024 and 65535");
}

function sendSse(response, chunks) {
  response.writeHead(200, {
    "cache-control": "no-store",
    "content-type": "text/event-stream; charset=utf-8"
  });
  for (const chunk of chunks) response.write(`data: ${JSON.stringify(chunk)}\n\n`);
  response.end("data: [DONE]\n\n");
}

async function readJson(request) {
  const parts = [];
  let size = 0;
  for await (const part of request) {
    size += part.length;
    if (size > 1_048_576) throw new Error("request too large");
    parts.push(part);
  }
  return JSON.parse(Buffer.concat(parts).toString("utf8"));
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || !request.url?.endsWith("/chat/completions")) {
    response.writeHead(404).end();
    return;
  }
  try {
    const input = await readJson(request);
    const messages = Array.isArray(input.messages) ? input.messages : [];
    const toolMessage = [...messages].reverse().find((message) => message?.role === "tool");
    if (toolMessage !== undefined) {
      const content = typeof toolMessage.content === "string" ? toolMessage.content : "";
      sendSse(response, [
        {
          choices: [
            {
              delta: { content: `${content}\nAIPHABEE_SANDBOX_SMOKE_OK`, role: "assistant" },
              finish_reason: "stop"
            }
          ]
        }
      ]);
      return;
    }

    const userMessage = [...messages].reverse().find((message) => message?.role === "user");
    const prompt = typeof userMessage?.content === "string" ? userMessage.content : "";
    const marker = "Command: ";
    const markerIndex = prompt.lastIndexOf(marker);
    if (markerIndex < 0) {
      response.writeHead(400, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "deterministic smoke command missing" }));
      return;
    }
    const command = prompt.slice(markerIndex + marker.length);
    sendSse(response, [
      {
        choices: [
          {
            delta: {
              role: "assistant",
              tool_calls: [
                {
                  function: { arguments: JSON.stringify({ command }), name: "exec" },
                  id: "call_aiphabee_sandbox_smoke",
                  index: 0,
                  type: "function"
                }
              ]
            },
            finish_reason: "tool_calls"
          }
        ]
      }
    ]);
  } catch {
    response.writeHead(400, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "invalid deterministic smoke request" }));
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`${JSON.stringify({ base_url: `http://127.0.0.1:${port}/v1`, status: "ready" })}\n`);
});
