import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { buildPsqlConnection, dedupCandidates } from "./lib.mjs";

test("psql ignores user startup files and keeps passwords out of argv", () => {
  const { psqlArgv, psqlEnv } = buildPsqlConnection(
    "postgresql://mirror:super-secret@example.test/netquity"
  );
  assert.deepEqual(psqlArgv.slice(1), ["-X", "-v", "ON_ERROR_STOP=1"]);
  assert.equal(psqlArgv.some((value) => value.includes("super-secret")), false);
  assert.equal(psqlEnv.PGPASSWORD, "super-secret");
});

test("duplicate deliveries must be byte-identical", () => {
  const dir = mkdtempSync(resolve(tmpdir(), "netquity-dedup-test-"));
  try {
    const raw = resolve(dir, "raw.mdb");
    const zipped = resolve(dir, "zipped.mdb");
    writeFileSync(raw, "same delivery");
    writeFileSync(zipped, "same delivery");
    const base = {
      schemaName: "nq_fixture"
    };
    const deduped = dedupCandidates(
      [
        { ...base, absPath: zipped, sourceKind: "zip", sourceLabel: "fixture.zip -> fixture.mdb" },
        { ...base, absPath: raw, sourceKind: "mdb", sourceLabel: "fixture.mdb" }
      ],
      "netquity-test"
    );
    assert.equal(deduped.get("nq_fixture").candidate.sourceLabel, "fixture.mdb");

    writeFileSync(zipped, "different delivery");
    assert.throws(
      () =>
        dedupCandidates(
          [
            { ...base, absPath: raw, sourceKind: "mdb", sourceLabel: "fixture.mdb" },
            { ...base, absPath: zipped, sourceKind: "zip", sourceLabel: "fixture.zip -> fixture.mdb" }
          ],
          "netquity-test"
        ),
      /Conflicting duplicate deliveries/u
    );
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});
