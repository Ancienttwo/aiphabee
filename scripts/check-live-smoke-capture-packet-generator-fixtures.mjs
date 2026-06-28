#!/usr/bin/env node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { createLiveSmokeCapturePacket } from "./create-live-smoke-capture-packet.mjs";
import { validateCapturePackets } from "./check-live-smoke-capture-packets.mjs";

const contract = readJson("deploy/governance/live-smoke-capture-artifacts.contract.json");
const ledger = readJson("deploy/governance/live-smoke-evidence-ledger.contract.json");
const packageJson = readJson("package.json");
const tmp = mkdtempSync(join(tmpdir(), "aiphabee-live-smoke-packet-"));
const validOutput = join(tmp, "redacted-output.json");
const unsafeOutput = join(tmp, "unsafe-output.json");

writeFileSync(validOutput, JSON.stringify({ status: "ok", redacted_summary: "passed live smoke" }));
writeFileSync(unsafeOutput, JSON.stringify({ raw_output: "Bearer abcdefghijklmnopqrstuvwxyz123456" }));

const scenarios = [
  {
    name: "passed packet validates through production validator",
    run: () => {
      const packet = createLiveSmokeCapturePacket({
        args: [
          "--capture-id",
          "cloudflare_resource_inventory",
          "--redacted-output",
          validOutput,
          "--runner",
          "fixture-runner",
          "--source-locator",
          "fixture:redacted-output",
          "--exit-code",
          "0",
          "--observed-at",
          "2026-06-23T00:00:00.000Z"
        ],
        contract,
        ledger,
        now: () => new Date("2026-06-23T00:00:00.000Z")
      });
      const validation = validateCapturePackets({
        artifactDirectoryExists: true,
        contract,
        ledger,
        packageJson,
        packetFiles: [
          {
            packet,
            path: "/tmp/cloudflare_resource_inventory.capture.json",
            relative: "deploy/governance/live-smoke-capture-packets/cloudflare_resource_inventory.capture.json"
          }
        ]
      });

      if (validation.errors.length > 0 || validation.status !== "partial_capture_packets") {
        throw new Error(`unexpected validation result ${JSON.stringify(validation)}`);
      }
    }
  },
  {
    name: "provider secret passed packet requires cleanup proof",
    expectedError: "provider_secret_store_rotation passed capture requires --cleanup-verified",
    run: () =>
      createLiveSmokeCapturePacket({
        args: [
          "--capture-id",
          "provider_secret_store_rotation",
          "--redacted-output",
          validOutput,
          "--runner",
          "fixture-runner",
          "--source-locator",
          "fixture:redacted-output",
          "--exit-code",
          "0"
        ],
        contract,
        ledger
      })
  },
  {
    name: "unsafe redacted output is rejected before packet write",
    expectedError: "forbidden secret-like pattern",
    run: () =>
      createLiveSmokeCapturePacket({
        args: [
          "--capture-id",
          "ai_gateway_model_execution",
          "--redacted-output",
          unsafeOutput,
          "--runner",
          "fixture-runner",
          "--source-locator",
          "fixture:unsafe-output",
          "--exit-code",
          "0"
        ],
        contract,
        ledger
      })
  }
];

const errors = [];

for (const scenario of scenarios) {
  try {
    scenario.run();
    if (scenario.expectedError) {
      errors.push(`${scenario.name}: expected error containing ${scenario.expectedError}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!scenario.expectedError || !message.includes(scenario.expectedError)) {
      errors.push(`${scenario.name}: ${message}`);
    }
  }
}

rmSync(tmp, { force: true, recursive: true });

if (errors.length > 0) {
  console.error(JSON.stringify({ errors, status: "invalid_live_smoke_capture_packet_generator_fixtures" }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      scenarios: scenarios.length,
      status: "ok"
    },
    null,
    2
  )
);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
