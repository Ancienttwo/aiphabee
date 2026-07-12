import { createServer } from "node:http";

const port = Number.parseInt(process.env.FASTCLAW_SMOKE_MODEL_PORT ?? "18081", 10);
const acceptanceCommand =
  "printf 'row10-live-ok' > /workspace/result.txt && cat /workspace/result.txt";
if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) {
  throw new Error("FASTCLAW_SMOKE_MODEL_PORT is invalid");
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
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_048_576) throw new Error("request too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function messageText(message) {
  if (typeof message?.content === "string") return message.content;
  if (!Array.isArray(message?.content)) return "";
  return message.content
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("");
}

createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/healthz") {
    response.writeHead(200, { "content-type": "text/plain" }).end("ok");
    return;
  }
  if (request.method !== "POST" || !request.url?.endsWith("/chat/completions")) {
    response.writeHead(404).end();
    return;
  }
  let input;
  try {
    input = await readJson(request);
    const messages = Array.isArray(input.messages) ? input.messages : [];
    const toolMessage = [...messages].reverse().find((message) => message?.role === "tool");
    if (toolMessage !== undefined) {
      const content = messageText(toolMessage);
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
    const prompt = messageText(userMessage);
    if (!prompt.includes(`exact command: ${acceptanceCommand}`)) {
      throw new Error("deterministic command missing");
    }
    sendSse(response, [
      {
        choices: [
          {
            delta: {
              role: "assistant",
              tool_calls: [
                {
                  function: {
                    arguments: JSON.stringify({ command: acceptanceCommand }),
                    name: "exec"
                  },
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
  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : "invalid request",
      messages: typeof input === "object" && input !== null && Array.isArray(input.messages)
        ? input.messages.map((message) => ({
            content_array: Array.isArray(message?.content),
            content_keys: Array.isArray(message?.content)
              ? message.content.map((part) => Object.keys(part ?? {}).sort())
              : [],
            content_type: typeof message?.content,
            role: typeof message?.role === "string" ? message.role : "invalid"
          }))
        : []
    }));
    response.writeHead(400, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "invalid deterministic request" }));
  }
}).listen(port, "0.0.0.0");
