#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateExactToolIdReconciliation } from "./check-p0-field-distribution-status-contract.mjs";

const read = (p) => JSON.parse(readFileSync(resolve(process.cwd(), p), "utf8"));
const contract = read("deploy/governance/p0-field-distribution-status.contract.json");
const catalog = read("deploy/tools/p0-tool-catalog.contract.json");
const registry = read("deploy/tools/registry.contract.json");
const registeredNames = [...contract.required_p0_tool_ids, "analyze_public_technical_signal", "parse_chart_image"];

const clone = (v) => JSON.parse(JSON.stringify(v));
const run = (mutate) => {
  const c = clone(contract);
  const cat = clone(catalog);
  const reg = clone(registry);
  const reg25 = [...registeredNames];
  mutate({ c, cat, reg, reg25 });
  return validateExactToolIdReconciliation(c, cat, reg, reg25);
};

const cases = [
  {
    name: "baseline passes",
    mutate: () => {},
    expectEmpty: true
  },
  {
    name: "missing P0 id fails closed",
    mutate: ({ c }) => c.required_p0_tool_ids.pop(),
    expect: "required_p0_tool_ids"
  },
  {
    name: "bumped count rejected",
    mutate: ({ c }) => { c.required_p0_tool_count = 24; },
    expect: "required_p0_tool_count must equal the canonical P0 rights set size"
  },
  {
    name: "unclassified 26th registered tool fails closed",
    mutate: ({ reg25 }) => reg25.push("some_new_unclassified_tool"),
    expect: "unexplained non-P0 tool"
  },
  {
    name: "removed exclusion leaves an unexplained extra",
    mutate: ({ c }) => { c.non_p0_rights_scoped_tools = c.non_p0_rights_scoped_tools.filter((x) => x.id !== "parse_chart_image"); },
    expect: "unexplained non-P0 tool must be classified in non_p0_rights_scoped_tools: parse_chart_image"
  },
  {
    name: "phantom exclusion rejected",
    mutate: ({ c }) => c.non_p0_rights_scoped_tools.push({ id: "not_a_real_tool", reason: "x", authority: "y" }),
    expect: "not_a_real_tool: non_p0_rights_scoped_tools id is not a RegisteredToolName"
  },
  {
    name: "excluded tool also in catalog rejected",
    mutate: ({ c }) => c.non_p0_rights_scoped_tools.push({ id: c.required_p0_tool_ids[0], reason: "x", authority: "y" }),
    expect: "is also in the P0 rights catalog"
  },
  {
    name: "catalog not a subset of registry fails closed",
    mutate: ({ reg }) => { reg.required_tools = reg.required_tools.filter((x) => x !== "resolve_security"); },
    expect: "P0 rights catalog IDs missing from registry required_tools"
  }
];

const failures = [];
for (const testCase of cases) {
  const errs = run(testCase.mutate);
  if (testCase.expectEmpty) {
    if (errs.length !== 0) failures.push(`${testCase.name}: expected no errors, got ${JSON.stringify(errs)}`);
  } else if (!errs.some((e) => e.includes(testCase.expect))) {
    failures.push(`${testCase.name}: expected an error containing "${testCase.expect}", got ${JSON.stringify(errs)}`);
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ status: "invalid_fixtures", failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: "ok", cases: cases.length }, null, 2));
