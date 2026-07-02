#!/usr/bin/env node
/**
 * Derive the deterministic stand-in fixture from a golden set manifest
 * (see src/fixture-builder.ts). Used by scripts/check-eval.sh and local dry
 * runs; a real vision fixture will replace it when Module 4 lands.
 *
 * tsx is registered for the same reason as bin/chart-parse-eval.mjs: the
 * import chain crosses @aiphabee/agent-runtime's extensionless imports.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function fail(reason) {
  console.log(JSON.stringify({ status: "configuration_failure", reason }, null, 2));
  process.exit(40);
}

try {
  const { register } = await import("tsx/esm/api");
  register();
} catch (error) {
  fail(`tsx loader unavailable (run npm install): ${error instanceof Error ? error.message : String(error)}`);
}

const args = process.argv.slice(2);
const values = {};
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg !== "--manifest" && arg !== "--out") {
    fail(`unknown flag: ${arg}`);
  }
  const value = args[i + 1];
  if (value === undefined || value.startsWith("--")) {
    fail(`flag ${arg} requires a value`);
  }
  values[arg] = value;
  i += 1;
}
if (values["--out"] === undefined) {
  fail("--out <path> is required");
}

const manifestPath = resolve(process.cwd(), values["--manifest"] ?? "tests/golden/chart-parse/manifest.json");
const outPath = resolve(process.cwd(), values["--out"]);

const { buildFixtureFromManifest } = await import(
  new URL("../src/fixture-builder.ts", import.meta.url)
);
const { stableStringifyPretty, sha256Hex } = await import("@aiphabee/chart-golden-set");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const fixture = buildFixtureFromManifest(manifest);
const bytes = stableStringifyPretty(fixture);
await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, bytes, "utf8");
console.log(
  JSON.stringify(
    {
      status: "completed",
      command: "make-eval-fixture",
      out_path: values["--out"],
      sample_count: Object.keys(fixture.outputs).length,
      fixture_sha256: sha256Hex(bytes)
    },
    null,
    2
  )
);
