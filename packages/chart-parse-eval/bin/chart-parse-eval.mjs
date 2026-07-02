#!/usr/bin/env node
/**
 * Thin CLI shell over ../src/cli.ts.
 *
 * The implementation is TypeScript and its import chain crosses
 * @aiphabee/agent-runtime/chart-parse, whose extensionless relative imports
 * Node's native type stripping cannot resolve — so the tsx runtime loader is
 * registered in-process before the dynamic import. stdout stays a single JSON
 * document; loader noise (if any) goes to stderr.
 */
try {
  const { register } = await import("tsx/esm/api");
  register();
} catch (error) {
  console.log(
    JSON.stringify(
      {
        status: "configuration_failure",
        reason: `tsx loader unavailable (run npm install): ${
          error instanceof Error ? error.message : String(error)
        }`
      },
      null,
      2
    )
  );
  process.exit(40);
}

const { runCli } = await import(new URL("../src/cli.ts", import.meta.url));
process.exit(await runCli(process.argv.slice(2)));
