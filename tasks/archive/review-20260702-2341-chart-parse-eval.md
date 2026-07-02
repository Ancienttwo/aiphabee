> **Archived**: 2026-07-02 23:41
> **Related Plan**: plans/archive/plan-20260702-2305-chart-parse-eval.md
> **Outcome**: Completed
> **Lifecycle**: review
> **Parent Run ID**: run-20260702-2341

# Task Review: chart-parse-eval

> **Status**: Complete
> **Plan**: plans/plan-20260702-2305-chart-parse-eval.md
> **Contract**: tasks/contracts/20260702-2305-chart-parse-eval.contract.md
> **Notes File**: tasks/notes/20260702-2305-chart-parse-eval.notes.md
> **Checks File**: .ai/harness/checks/latest.json
> **Last Updated**: 2026-07-02 23:40
> **Recommendation**: pass
> **Review Rubric Version**: 1
> **Reviewed Diff Fingerprint**: sha256:c4002a11bb8564872ce7115552712f4aeb65083182206e376786341e6f29ac90
> **Reviewed Scope**: branch+staged+unstaged+untracked

## Human Review Card

- Verdict: pass
- Change type: code-change
- Intended files changed: `packages/chart-parse-eval/`(全新包:bin/src/scripts/tsconfig/package.json)、`deploy/database/migrations/20260703001000_chart_parse_eval_foundation.sql`、`deploy/database/migrations.contract.json`(+1 登记)、根 `package.json`(+1 script)、`package-lock.json`
- Actual files changed: 与 intended 一致(review-fingerprint paths 31 项核对,其余为 plans/tasks 契约工件与 todos.md 自动时间戳;`packages/agent-runtime`/`packages/chart-golden-set` 未动,零越界)
- Commands passed: `npx vitest run packages/chart-parse-eval`(47/47)、`npm run check:chart-parse-eval`(双跑 run 工件 sha256 一致 + 三键 + 100 行回放 + insufficient + 校准 lineage 全 PASS)、`npm run check:database`(68 migrations ok)、`npm run typecheck`(全 workspace)、`npm run lint`、`npx vitest run`(861 passed | 1 skipped 全 workspace)、`npm run test:golden`
- External acceptance: Codex(read-only,reasoning high)No findings——0×P1 + 0×P2(见 External Acceptance Advice)
- Residual risks: 见 Residual Risks / Follow-ups
- Reviewer action required: none
- Rollback: 纯新增包 + 未应用迁移 SQL 与登记条目 + 根 package.json 一行 script + lockfile;revert 提交(或弃分支)即完全回滚,无已部署数据面(迁移账本 status=local_contract)

## Mode Evidence

- Selected route: contract worktree(capture-plan --execute → worktree `AiphaBee-wt-chart-parse-eval`,基点 402e547 = PR #19 merge commit)
- P1/P2/P3 evidence: plan `## Captured Planning Output` 尽调三节 + 四决策点收敛;前置门 `gh pr merge 19 --merge` → `git merge-base --is-ancestor d9aeb06 main` 实测通过后开工
- Root cause or plan evidence: sprint 任务 3 验收行逐条映射到 `check:chart-parse-eval` 机器断言(见 Verification Evidence)

## Verification Evidence

- Waza `/check` run: Rubric v1 八维自审;发现并修复 1 项——DB 写入失败(如 ECONNREFUSED)被 `emitError` 误归 exit 60(invariant_violation),按治理语义改判 exit 50(storage_failure,`databaseFailure` 专用出口 + reason 声明工件已写、幂等重跑安全),补回归测试(坏连接串 → 50)。另两项自审观察按"记录不改码"处置:①`sample_count` 在 run 汇总(=manifest 样本数)与 calibration 行(=观测承载样本数)语义不同,notes 已记;②calibrate.test 的 metrics 桩用类型断言,测试专用。
- Commands run: RED `npx vitest run packages/chart-parse-eval`(7/7 文件失败,模块未实现)→ GREEN 46/46 → 修复后 47/47;`npm run check:chart-parse-eval` PASS(双跑 run 工件 sha256 = `458e569a47b53d7ea80b901690fa5f83ff76d9fab36aa94d92babdc21ebc54e6`);全 workspace vitest 861 passed | 1 skipped;typecheck/lint/test:golden/check:database 全绿
- Manual checks: 验收行逐条核对——①runner JSON 三键:`cli.test.ts` 断言 + check 脚本 jq `has()` 三连;②写入 `eval_runs`+`eval_sample_results`:`pg-sink.test.ts` 断言 SQL 形状(单事务、on conflict do nothing、rollback 重抛)+ JsonArtifactSink 工件同构落盘;逐样本可回放:run 工件 100 行 sample rows + observations,双跑字节一致;③样本不足 → `insufficient` 且不产 thresholds:`cli.test.ts` + check 脚本 `--min-samples 101` jq 断言 `has("thresholds")|not`;④calibration run 三版本 + sample_count:`calibrate.test.ts` lineage 断言 + check 脚本 jq;⑤版本漂移门(fixture schema/prompt ≠ 契约 → 40)与覆盖门(键集合 ≠ manifest ids → 60):cli.test 负例
- Supporting artifacts: `.ai/harness/checks/latest.json`;`/tmp/codex-review-chart-parse-eval.log`(外审原始输出)
- Implementation notes reviewed: yes(含校准观测面从清晰子集放宽到全 schema 合规样本的 plan 偏差记录:真 manifest 清晰子集仅 11 张,样本门结构性不可达;矩阵仍只算清晰子集)
- Run snapshot: `.ai/harness/runs/`

## External Acceptance Advice

> **External Acceptance**: pass
> **External Reviewer**: Codex
> **External Source**: codex-review
> **External Started**: 2026-07-02T23:19:00+0800
> **External Completed**: 2026-07-02T23:36:00+0800
> **Review Rubric Version**: 1
> **Reviewed Diff Fingerprint**: sha256:c4002a11bb8564872ce7115552712f4aeb65083182206e376786341e6f29ac90
> **Reviewed Scope**: branch+staged+unstaged+untracked

- P1 blockers: none
- P2 advisories:
  - none(Codex 结论 "No findings":变更边界零越界——未提前实现 provider/R2/golden_set_samples/Module 5 路由;静态追踪 run→executeEvalRun→双 sink 与 calibrate insufficient/成功路径均符合验收语义)
- Acceptance checklist: pass——Codex 独立复验 `npm run typecheck --workspace @aiphabee/chart-parse-eval` 通过;read-only sandbox 内 vitest 不可跑(EPERM 预期),以静态审查覆盖;residual 与本地一致(live DB apply/readback 未做,属运行时能力)
- Reviewer detail: OpenAI Codex CLI,read-only sandbox,reasoning effort high,`codex exec` 对 main(402e547)基线 + 工作树 + 未跟踪文件全量审查,tokens 108k

## Behavior Diff Notes

- 新增工程面:`@aiphabee/chart-parse-eval` 包(CLI `run`/`calibrate` + 库导出 record 类型/比对语义/isotonic/双 sink);三表迁移(aiphabee_core.eval_runs/eval_sample_results/calibration_runs,账本 local_contract 未 apply);根 `check:chart-parse-eval` script。零现有行为变更(agent-runtime/chart-golden-set/apps 均未动;tool 运行时与路由属任务 4/5)。

## Residual Risks / Follow-ups

- live DB 写入路径(withPgSink 走真 Postgres)未做 apply/readback:SQL 形状已离线断言,连接失败路径已测(exit 50);首次真库运行属任务 4/5 之后的运维动作,风险受 on-conflict 幂等与单事务约束。
- fixture-only 验收 ⇒ 真实 vision 模型三项指标未知:接口按数据形状(fixture v1)设计,Module 4 落地后录制真 fixture 直接回放,runner 零改动。
- 清晰子集仅 11 张 ⇒ field_matrix 分层达标断言统计噪声偏大:golden set 扩容(`--count` 提升)后自然改善;校准观测面已按全合规样本设计,不受此限。
- 校准观测含 info_missing 样本的非 null 字段:相比 PRD"清晰图矩阵"表述是取样面扩展(方法论上校准需要难样本),矩阵聚合面未变;若上游要求严格清晰面校准,`calibrate` 增一个子集过滤旗标即可(单点改动)。

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | 验收 4 断言全机器化(三键/落库回放/insufficient/lineage);47 测试含 40/50/60 负例;RED→GREEN 留痕 |
| Product depth | 8/10 | tier 池化 isotonic + 阈值零硬编码 + draft 阻断语义;真实模型指标与逐字段校准留待样本量扩容 |
| Design quality | 9/10 | fixture 数据形状解耦 Module 4 选型;确定性 id + on-conflict 幂等;env-gated DB;版本漂移/覆盖双门 |
| Code quality | 9/10 | 11 个小文件分层;治理语义逐项镜像 chart-golden-set;工件零时间戳全链确定性 |

## Failing Items

- None.

## Retest Steps

1. `npx vitest run packages/chart-parse-eval`(47/47)
2. `npm run check:chart-parse-eval`(双跑哈希一致 + 三键 + insufficient + lineage)
3. `npm run check:database` && `npm run typecheck`
4. `LC_ALL=C repo-harness run verify-contract --contract tasks/contracts/20260702-2305-chart-parse-eval.contract.md --strict`
