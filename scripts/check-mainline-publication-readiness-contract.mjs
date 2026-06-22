#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const contractPath = "deploy/governance/mainline-publication-readiness.contract.json";
const packageJsonPath = "package.json";
const expectedChangelog = "| 2026-06-23 | 1.0he | 完成 `mainline-publication-readiness`";

const contract = readJson(contractPath);
const packageJson = readJson(packageJsonPath);
const tracker = readText(contract.tracker);
const todos = readText(contract.todos);
const gitEvidence = collectGitEvidence(contract);
const errors = [
  ...validateContract(contract),
  ...validatePackageScripts(packageJson),
  ...validateFragments(contract, tracker, todos),
  ...validateGitEvidence(contract, gitEvidence),
  ...validateChangelog(tracker)
];

if (errors.length > 0) {
  emit(
    {
      errors,
      git: gitEvidence,
      path: contractPath,
      status: "invalid_mainline_publication_readiness"
    },
    1
  );
}

emit(
  {
    frontend_merge_required: false,
    git: gitEvidence,
    publish_performed: false,
    status: "ok",
    version: contract.version
  },
  0
);

function validateContract(value) {
  const errors = [];

  expectEqual(errors, value.version, "2026-06-23.goal.mainline-publication-readiness.v0", "version");
  expectEqual(errors, value.status, "ready_for_publish_decision", "status");
  expectEqual(errors, value.checker, "scripts/check-mainline-publication-readiness-contract.mjs", "checker");
  expectEqual(errors, value.source_branch, "origin/feat/web-frontend", "source_branch");
  expectEqual(errors, value.fallback_source_branch, "feat/web-frontend", "fallback_source_branch");
  expectEqual(errors, value.target_branch, "main", "target_branch");
  expectEqual(errors, value.remote_main_branch, "origin/main", "remote_main_branch");
  expectEqual(errors, value.tracker, "docs/AiphaBee_Sprint_Tracker_v1.0.md", "tracker");
  expectEqual(errors, value.todos, "tasks/todos.md", "todos");
  expectEqual(errors, value.publish_performed, false, "publish_performed");
  expectEqual(errors, value.push_required_for_remote_ci, true, "push_required_for_remote_ci");
  expectEqual(errors, value.frontend_merge_required, false, "frontend_merge_required");

  const invariants = value.expected_git_invariants ?? {};
  [
    "frontend_source_is_ancestor_of_target",
    "source_has_no_unmerged_commits",
    "target_not_behind_remote_main"
  ].forEach((key) => expectEqual(errors, invariants[key], true, `expected_git_invariants.${key}`));

  if (!Array.isArray(value.observed_external_prs) || value.observed_external_prs.length !== 2) {
    errors.push("observed_external_prs must record the two merged frontend integration PRs");
  } else {
    const mergedPrs = new Map(value.observed_external_prs.map((pr) => [pr.number, pr]));
    expectEqual(errors, mergedPrs.get(1)?.state, "MERGED", "observed_external_prs.#1.state");
    expectEqual(errors, mergedPrs.get(1)?.head_ref, "feat/web-frontend", "observed_external_prs.#1.head_ref");
    expectEqual(errors, mergedPrs.get(2)?.state, "MERGED", "observed_external_prs.#2.state");
    expectEqual(errors, mergedPrs.get(2)?.head_ref, "codex/web-backend-integration", "observed_external_prs.#2.head_ref");
  }

  for (const path of [value.tracker, value.todos]) {
    if (typeof path !== "string" || !existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked path missing: ${path}`);
    }
  }

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};

  if (
    scripts["check:mainline-publication-readiness"] !==
    "node scripts/check-mainline-publication-readiness-contract.mjs"
  ) {
    errors.push("package.json scripts.check:mainline-publication-readiness must run the readiness checker");
  }

  if (!String(scripts.check ?? "").includes("npm run check:mainline-publication-readiness")) {
    errors.push("package.json scripts.check must include npm run check:mainline-publication-readiness");
  }

  return errors;
}

function validateFragments(value, trackerText, todosText) {
  const errors = [];

  for (const fragment of value.required_tracker_fragments ?? []) {
    if (!trackerText.includes(fragment)) {
      errors.push(`tracker missing required fragment: ${fragment}`);
    }
  }

  for (const fragment of value.required_todos_fragments ?? []) {
    if (!todosText.includes(fragment)) {
      errors.push(`tasks/todos.md missing required fragment: ${fragment}`);
    }
  }

  return errors;
}

function validateGitEvidence(value, evidence) {
  const errors = [];

  if (!evidence.git_available) {
    errors.push("git evidence unavailable");
    return errors;
  }

  if (!evidence.source_ref) {
    errors.push(`neither ${value.source_branch} nor ${value.fallback_source_branch} is available`);
    return errors;
  }

  if (evidence.frontend_source_is_ancestor_of_target !== true) {
    errors.push(`${evidence.source_ref} must be an ancestor of ${value.target_branch}`);
  }

  if (evidence.source_unmerged_commit_count !== 0) {
    errors.push(`${evidence.source_ref} has ${evidence.source_unmerged_commit_count} commits not merged into ${value.target_branch}`);
  }

  if (evidence.remote_main_available && evidence.target_behind_remote_main !== 0) {
    errors.push(`${value.target_branch} is behind ${value.remote_main_branch} by ${evidence.target_behind_remote_main} commits`);
  }

  return errors;
}

function validateChangelog(trackerText) {
  return trackerText.includes(expectedChangelog)
    ? []
    : [`tracker changelog must include ${expectedChangelog}`];
}

function collectGitEvidence(value) {
  const sourceRef = firstExistingRef([value.source_branch, value.fallback_source_branch]);
  const remoteMainAvailable = refExists(value.remote_main_branch);
  const targetBranch = value.target_branch;

  if (!runGit(["rev-parse", "--is-inside-work-tree"]).ok) {
    return { git_available: false };
  }

  const targetHead = gitOutput(["rev-parse", "--short=12", targetBranch]);
  const sourceHead = sourceRef ? gitOutput(["rev-parse", "--short=12", sourceRef]) : null;
  const remoteMainHead = remoteMainAvailable ? gitOutput(["rev-parse", "--short=12", value.remote_main_branch]) : null;

  return {
    frontend_source_is_ancestor_of_target: sourceRef
      ? runGit(["merge-base", "--is-ancestor", sourceRef, targetBranch]).ok
      : false,
    git_available: true,
    remote_main_available: remoteMainAvailable,
    remote_main_head: remoteMainHead,
    source_head: sourceHead,
    source_ref: sourceRef,
    source_unmerged_commit_count: sourceRef
      ? Number(gitOutput(["rev-list", "--count", `${targetBranch}..${sourceRef}`]))
      : null,
    target_ahead_remote_main: remoteMainAvailable
      ? Number(gitOutput(["rev-list", "--count", `${value.remote_main_branch}..${targetBranch}`]))
      : null,
    target_behind_remote_main: remoteMainAvailable
      ? Number(gitOutput(["rev-list", "--count", `${targetBranch}..${value.remote_main_branch}`]))
      : null,
    target_branch: targetBranch,
    target_head: targetHead
  };
}

function firstExistingRef(refs) {
  return refs.find((ref) => refExists(ref)) ?? null;
}

function refExists(ref) {
  return runGit(["rev-parse", "--verify", "--quiet", ref]).ok;
}

function gitOutput(args) {
  const result = runGit(args);

  if (!result.ok) {
    return null;
  }

  return result.stdout.trim();
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  return {
    ok: result.status === 0,
    stderr: result.stderr,
    stdout: result.stdout,
    status: result.status
  };
}

function expectEqual(errors, actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${path} expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

function readJson(path) {
  try {
    return JSON.parse(readText(path));
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "invalid_json"
      },
      1
    );
  }
}

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "missing_text"
      },
      1
    );
  }
}

function emit(payload, exitCode) {
  const output = exitCode === 0 ? console.log : console.error;

  output(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
