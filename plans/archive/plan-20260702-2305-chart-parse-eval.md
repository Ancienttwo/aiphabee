# Plan: 评测 runner + 校准 CLI(chart-parse-eval)

> **Status**: Archived
> **Created**: 20260702-2305
> **Slug**: chart-parse-eval
> **Planning Source**: waza-think
> **Orchestration Kind**: host-plan
> **Source Ref**: sprint:plans/sprints/20260702-1905-parse-chart-image.sprint.md#评测 runner + 校准 CLI(PRD Module 3,Script #2)
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: npx vitest run packages/chart-parse-eval;npm run check:chart-parse-eval(双跑哈希一致+jq 断言三键/insufficient 无 thresholds/calibration 三版本+sample_count);npm run check:database;npm run typecheck;LC_ALL=C repo-harness run verify-contract --strict
> **Rollback Surface**: 纯新增 packages/chart-parse-eval 包 + 一个未应用的迁移 SQL 与 contract 登记条目 + 根 package.json 一行 script + lockfile;revert 提交即完全回滚,无已部署数据面(迁移账本 status=local_contract)
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260702-2305-chart-parse-eval.contract.md`
> **Task Review**: `tasks/reviews/20260702-2305-chart-parse-eval.review.md`
> **Implementation Notes**: `tasks/notes/20260702-2305-chart-parse-eval.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260702-1905-parse-chart-image.sprint.md#评测 runner + 校准 CLI(PRD Module 3,Script #2)
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260702-2305-chart-parse-eval.md`
- Sprint contract: `tasks/contracts/20260702-2305-chart-parse-eval.contract.md`
- Sprint review: `tasks/reviews/20260702-2305-chart-parse-eval.review.md`
- Implementation notes: `tasks/notes/20260702-2305-chart-parse-eval.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260702-2305-chart-parse-eval.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260702-2305-chart-parse-eval.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260702-2305-chart-parse-eval.md`.

## Approach
### Strategy
Use the captured planning output below as the execution source of truth.

### Trade-offs
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Captured plan | Preserves the approved Codex Plan or Waza think decision | Requires the captured text to be concrete enough to execute | Use |

## Detailed Design
### File Changes
| File | Action | Description |
|------|--------|-------------|
| See captured planning output | Follow | Implement only the approved scope named below |

### Code Snippets
See captured planning output.

### Data Flow
See captured planning output.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Captured plan lacks enough detail | Medium | Execution may need clarification | Stop before implementation if the captured output contradicts repo rules or lacks concrete file targets |

## Task Contracts
- Contract file: `tasks/contracts/20260702-2305-chart-parse-eval.contract.md`
- Review file: `tasks/reviews/20260702-2305-chart-parse-eval.review.md`
- Implementation notes file: `tasks/notes/20260702-2305-chart-parse-eval.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260702-2305-chart-parse-eval.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260702-2305-chart-parse-eval.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: 纯新增 packages/chart-parse-eval 包 + 一个未应用的迁移 SQL 与 contract 登记条目 + 根 package.json 一行 script + lockfile;revert 提交即完全回滚,无已部署数据面(迁移账本 status=local_contract)
- **Verification boundary**: npx vitest run packages/chart-parse-eval;npm run check:chart-parse-eval(双跑哈希一致+jq 断言三键/insufficient 无 thresholds/calibration 三版本+sample_count);npm run check:database;npm run typecheck;LC_ALL=C repo-harness run verify-contract --strict
- **Review/acceptance boundary**: `tasks/reviews/20260702-2305-chart-parse-eval.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260702-2305-chart-parse-eval.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260702-2305-chart-parse-eval.contract.md`, `tasks/reviews/20260702-2305-chart-parse-eval.review.md`, and `tasks/notes/20260702-2305-chart-parse-eval.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260702-2305-chart-parse-eval.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: 纯新增 packages/chart-parse-eval 包 + 一个未应用的迁移 SQL 与 contract 登记条目 + 根 package.json 一行 script + lockfile;revert 提交即完全回滚,无已部署数据面(迁移账本 status=local_contract)

## Captured Planning Output

# 评测 runner + 校准 CLI(Sprint 任务 3 / PRD Module 3)

## 目标与验收

新建工程面 CLI `packages/chart-parse-eval`(`@aiphabee/chart-parse-eval`),对 golden set(任务 2 manifest)批量回放解析输出并产出三项指标与两级落库证据,再从评测证据离线校准置信度产出阈值工件。让"读得多准"可度量、置信度可用(PRD Module 3 Purpose)。

机器验收(sprint backlog 行 3 原文):runner JSON 输出含 `schema_compliance` / `field_matrix` / `null_negative` 三键并写入 `eval_runs`+`eval_sample_results`(fixture 断言逐样本可回放);样本不足 fixture 下校准命令输出 `insufficient` 且不产 thresholds;产出的 calibration run 含 schema/prompt/model 三版本与 sample_count。

## 前置条件(本会话已核)

- PR #19 已 merge(`402e547`),`git merge-base --is-ancestor d9aeb06 main` 为真;`@aiphabee/chart-golden-set` 与 `tests/golden/chart-parse/manifest.json`(100 样本)可消费。
- `CHART_PARSE_CONTRACT`(`@aiphabee/agent-runtime/chart-parse` 子路径导出已核)提供 schema+buildPrompt+双版本冻结;`safeParseChartParseResult` 是 schema 合规判定的唯一入口。
- `eval_runs`/`eval_sample_results`/`calibration_runs` 物理表名无撞车(全部迁移 SQL 已 grep;`check:eval-v1` 是 observability 契约非 DB 表)。

## 尽调

### P1 map

- 落点:新包 `packages/chart-parse-eval`(bin CLI + src),消费 `@aiphabee/chart-golden-set`(manifest 类型、`truthAsChartParseResult`、`VARIANT_DIMENSIONS`)与 `@aiphabee/agent-runtime/chart-parse`(契约)。治理语义镜像 `packages/chart-golden-set/src/cli.ts`(EXIT_CODES 0/40/50/60、`runCli(argv, io)` 返回退出码、单文档 JSON stdout、tsx bin 壳)。
- DB 面:PlanetScale Postgres(Hyperdrive 通道),迁移账本 `deploy/database/migrations/`(14 位时间戳)+ `migrations.contract.json` 逐条登记(需 file/purpose/schemas/tables/market_data:false/default_rights_status:default_deny)+ `npm run check:database`;禁词表含裸 `token`/`secret`/`password`/`drop`/`delete`(`token_cost` 列名安全,注释措辞避开裸词)。schema 命名空间取 `aiphabee_core`(产品域工程数据;`platform` 是多产品伞层,PRD "owner: platform" 指平台工程 ownership 而非 platform schema)。
- pg 先例:data-ingest bin 直连 `pg` Client,连接串走 env(`DATA_INGEST_DATABASE_URL`/`DATABASE_URL`)+ 显式启用门 env(`DATA_INGEST_ENABLE_DB_WRITE=1`),核心逻辑不 import pg。
- CI 面:lint/typecheck/test/test:golden,不跑 DB、不产图像 → 评测测试必须离线可回放,fixture 模式不得依赖磁盘图像字节。

### P2 trace(评测→校准路径)

`chart-parse-eval run --fixture <path>` → 读 manifest(`set_version` 即 golden_set_version)+ fixture(声明 schema/prompt/model 版本;schema/prompt 与 CHART_PARSE_CONTRACT 不一致 → exit 40 版本漂移门)→ 覆盖性校验(fixture 键集合 ≠ manifest sample id 集合 → exit 60)→ 逐样本:raw 过 `safeParseChartParseResult`(schema_compliance 分子分母)→ 合规样本按子集分派:清晰子集(degradation=none 且 info_missing=none)算 field_matrix 逐字段命中(truth 直比),负例子集(info_missing≠none)算 null_negative(truth 为 null 的 P0/P1 标量字段解析值必须为 null)→ 逐样本行(parse_json/field_accuracy/null_negative_pass/error_code/token_cost/latency_ms)+ 置信度观测流(field, tier, confidence, correct)→ 汇总 `eval_runs` 行(三版本 + metrics 三键)→ JsonArtifactSink 落 `runtime/chart-parse-eval/<run_id>/`(无时间戳、stable stringify、双跑字节一致)→ stdout 汇总文档(含工件 sha256)。设 `CHART_PARSE_EVAL_ENABLE_DB_WRITE=1` + 连接串 env 时 PgEvalSink 以确定性 id `on conflict do nothing` 幂等入库。`calibrate --run-artifact <path>` → 读 run 工件的观测流 → 门槛检查(样本量/分层观测量)不足 → `{"status":"insufficient", reasons, sample_count}` 且不产 thresholds、不写 calibration 行、exit 0 → 充足 → 按 tier 池化 isotonic(PAV)→ 从校准曲线反解各 tier 的 auto/confirm 置信度切点 → thresholds+reliability+三版本+sample_count 组装 calibration run(全 tier 可达 → status ready;任一 tier 目标不可达 → status draft 且 thresholds 为 null,自动路由保持阻断)→ 落工件/DB(ready 落库时同三版本组旧 ready 行置 superseded)。压力点:任何非确定源(时钟、Math.random、遍历顺序)破坏双跑一致——工件零时间戳,DB `created_at` 走列默认值。

### P3 decision rationale(四决策点收敛)

- **D1 vision 调用面:fixture 回放是任务 3 的唯一解析源,不接真 provider。** 核心按 `SampleParseOutcome`(raw | error_code,附 token_cost/latency_ms)消费输入,任务 3 只交付 FixtureParser(`--fixture` 必填)。验收只要求 fixture 断言可回放;真模型评测是运行时能力,vision 通道选型(直连 vs AI Gateway)是 PRD Module 4 open decision,现在接入即提前锁死 + 引入 CI 跑不动的依赖。Module 4 落地后把 tool 的 provider 调用适配成同形状输入即可增量接 live 模式,runner 零改动。跑分框架(promptfoo/OpenAI Evals,PRD 标 [UNVERIFIED])同理弃用:三项指标是 `safeParseChartParseResult` + truth 直比的确定性计算,框架增重零验收收益,PRD Freedoms 明示选型自由。
- **D2 DB 迁移此刻落、golden_set_samples 表不建。** 新迁移 `20260703001000_chart_parse_eval_foundation.sql` 建 `aiphabee_core.eval_runs`/`eval_sample_results`/`calibration_runs` 三表(sprint Architecture Notes 点名;字段照 PRD Data Model v2)。`golden_set_samples` 沿用上轮决策不建:manifest sample id 是稳定引用,`eval_sample_results.sample_id` 存 text 无 FK(建表即多一个无人填充的 FK 目标)。`calibration_runs.source_eval_run_id` 同样只作逻辑引用不设 FK——工件模式校准的来源 run 可能不在库内。评测写库 = 运行时能力:核心定义 `EvalSink` 接口,默认 JsonArtifactSink(验收面),`CHART_PARSE_EVAL_ENABLE_DB_WRITE=1` + `CHART_PARSE_EVAL_DATABASE_URL`(回退 `DATABASE_URL`)时 bin 层接 PgEvalSink(镜像 data-ingest:pg 只进 bin/注入 queryable,SQL 参数化,单事务,确定性 id + on conflict do nothing 幂等)。PgEvalSink 以假 queryable 捕获 (text, values) 离线断言 SQL 形状。
- **D3 校准:tier 池化 isotonic(PAV),阈值全部数据导出,零硬编码启用值。** mapping_fn_version = `isotonic-pav.v1`;弃 temperature scaling(需迭代拟合,MVP 无增益;isotonic 是 PRD 点名默认且构造性单调)。100 样本下逐字段曲线太稀 → 观测按 P0/P1/P2 tier 池化出三条曲线,thresholds 内 `field_tier` 映射表声明字段→tier 继承(逐字段校准是样本量扩容后的演进项)。切点语义:`auto_match_min_confidence` = 校准后准确率首次达到 tier 目标(默认 p0 0.95/p1 0.90/p2 0.80,即 PRD Success Criteria Target 列)的最小原始置信度;`confirm_min_confidence` 对应降级线(默认 0.85/0.80/0.70,PRD Degradation Threshold 列);目标经 `--auto-targets`/`--confirm-targets` 旗标传入并回写进 thresholds.targets 供审计。PRD 的 0.85/0.60 参考初值不出现在任何代码路径——启用自动路由是 Module 5 读 `status=ready` 行的机制。门槛:观测承载样本数 < `--min-samples`(默认 50)或任一 tier 观测数 < `--min-tier-observations`(默认 30)→ insufficient(不产 thresholds、不落行、exit 0,是合法业务结论非错误)。数据充足但任一 tier 目标不可达(曲线平坦/反转的表现)→ 行落 status=draft、thresholds=null、reliability 记录曲线证据,自动路由维持阻断(PRD failure path 2 的机制化)。
- **D4 CLI 治理:逐项镜像 chart-golden-set。** 子命令 `run`/`calibrate`;EXIT_CODES {0 completed, 40 configuration_failure, 50 storage_failure, 60 invariant_violation};`runCli(argv, io, deps?)` 返回码可测;单 JSON 文档 stdout 含产物 sha256(双跑幂等断言);bin 壳 `bin/chart-parse-eval.mjs` 走 `tsx/esm/api` register(import 链穿 agent-runtime 无扩展名导入,Node 22 直跑必炸,任务 2 实证);根 script `check:chart-parse-eval` → `packages/chart-parse-eval/scripts/check-eval.sh`(镜像 check-golden-set.sh,不进 CI,与 check:chart-golden-set 先例一致)。

## 设计

### 文件布局

| 文件 | 内容 |
|------|------|
| `packages/chart-parse-eval/package.json` | `@aiphabee/chart-parse-eval`;deps:`@aiphabee/agent-runtime`(file:)、`@aiphabee/chart-golden-set`(file:)、`pg@^8.22.0`(仅 bin 消费);devDeps:`tsx`、`@types/node` |
| `packages/chart-parse-eval/tsconfig.json` | 对齐 chart-golden-set(types: ["node","vitest"]) |
| `packages/chart-parse-eval/bin/chart-parse-eval.mjs` | tsx register 壳 + env 读取(连接串/启用门)+ pg Client 装配 → `runCli` |
| `src/cli.ts` | runCli 分发 run/calibrate、parseFlags、emit、EXIT_CODES |
| `src/fixture.ts` | fixture 类型 + loadFixture(结构校验、契约版本一致性门、样本覆盖门) |
| `src/fixture-builder.ts` | 从 manifest truth 确定性派生 fixture(perfect + 定点 schema 违规 + 定点字段错 + 定点 null 违规;seeded,check 脚本与本地演练用) |
| `src/compare.ts` | 逐字段命中函数(P0 精确比对;P1 end_time 精确/指标名集合相等;P2 参数数组相等/anchor L∞≤容差且线数一致)、null 负例判定 |
| `src/metrics.ts` | 三键聚合 + 置信度观测流抽取(field, tier, confidence, correct;固定序) |
| `src/run.ts` | run 编排:manifest+fixture → 逐样本行 + eval_run 行 + 观测流 |
| `src/calibrate.ts` | PAV isotonic、门槛、切点反解、reliability 分箱、calibration run 组装 |
| `src/sink.ts` | `EvalSink` 接口 + JsonArtifactSink(stable stringify、无时间戳) |
| `src/pg-sink.ts` | PgEvalSink(注入 queryable、参数化 SQL、事务、on conflict do nothing、ready 落库时同三版本旧 ready 置 superseded) |
| `src/*.test.ts` | 单测 + 小 manifest 集成 + 真 manifest 派生 fixture 集成(无图像依赖) |
| `packages/chart-parse-eval/scripts/check-eval.sh` | 双跑哈希一致 + jq 断言(metrics 三键;insufficient 无 thresholds;calibration 三版本+sample_count) |
| `deploy/database/migrations/20260703001000_chart_parse_eval_foundation.sql` | 三表 DDL(aiphabee_core;status check 约束;`eval_sample_results.eval_run_id` FK→eval_runs;sample_id/source_eval_run_id 无 FK;Module 5 查询索引 (schema_version,prompt_version,model_version,status)) |
| `deploy/database/migrations.contract.json`(改) | +1 登记条目 |
| `package.json`(根,改) | +`check:chart-parse-eval` script |
| `package-lock.json`(改) | workspaces 安装产物 |

### fixture 形状

```jsonc
{
  "fixture_version": "chart-parse-eval-fixture.v1",
  "schema_version": "…",   // 必须 === CHART_PARSE_CONTRACT.schemaVersion,否则 exit 40
  "prompt_version": "…",   // 同上
  "model_version": "fixture-derived.v1", // 流入 eval_runs.model_version
  "outputs": {
    "cgs-000": { "raw": { /* ChartParseResult 候选 */ }, "token_cost": 1548, "latency_ms": 1200 },
    "cgs-001": { "error_code": "vision_timeout" }   // 计入 schema_compliance 分母,合规=false
  }
}
```

### 指标与落库形状

- `schema_compliance` = {total, passed, rate};判定 = `safeParseChartParseResult(raw).success`,error_code 样本记 false。
- `field_matrix` 只在清晰子集(degradation=none 且 info_missing=none)计算:P0 {symbol, exchange, timeframe} / P1 {end_time, indicator_names} / P2 {indicator_params, drawn_line_anchors},每字段 {n, hits, accuracy} + tier_rollup + auxiliary.patterns(形态命中率观测位,不入 tier,承接 golden-set 残留项的可见性)+ clear_sample_count + anchor_tolerance(默认 0.05,`--anchor-tolerance` 旗标,PRD 注明容差初值待校准)。
- `null_negative` 在 info_missing≠none 子集:期望 null 字段 = truth 为 null 的 {symbol, exchange, timeframe, end_time},全部解析为 null 才 pass;{total, passed, rate}。
- 逐样本行(`eval_sample_results` / 工件同构):{id: `<run_id>-<sample_id>`, eval_run_id, sample_id, parse_json, field_accuracy(逐字段 {hit} + 失配摘要), null_negative_pass(非负例样本为 null), error_code, token_cost, latency_ms}。
- `eval_runs` 行:{id: `cper-<sha256(set_version+三版本+fixture_sha)前16>`, golden_set_version, schema_version, prompt_version, model_version, metrics(三键), status: completed}。
- calibration run:{id: `ccal-<sha256(source_run_id+mapping_fn_version+targets+门槛)前16>`, source_eval_run_id, golden_set_version, schema_version, prompt_version, model_version, sample_count, mapping_fn_version: "isotonic-pav.v1", thresholds: {targets, tiers: {pX: {auto_match_min_confidence, confirm_min_confidence}}, field_tier} | null, reliability: {tiers: {pX: {observation_count, bins[10], isotonic 拐点}}}, status: ready|draft}。

## 边界与风险

- **不做**:真 vision provider 调用与选型(Module 4)、golden_set_samples 表与 R2 上传、promptfoo/OpenAI Evals、逐字段 isotonic、2 次采样一致性增强、FR-01 路由消费(Module 5)、新 check script 进 CI。
- **最脆弱假设**:fixture 回放验收 ⇒ 真实模型的三项指标在 Module 4 接 live 前未知。设计已为此变形:解析源是数据形状(SampleParseOutcome)而非调用约定,Module 4 无论选直连还是 Gateway,适配层只产同形状数据,runner/校准零改动。若 Module 4 改变输出粒度(如增加分区裁切),fixture_version bump + 评测回归即可。
- **确定性风险**:工件含时间戳/非稳定序即破坏双跑一致——工件零时钟、stable stringify、观测流固定序;DB `created_at` 走列默认值不进工件。
- **迁移禁词风险**:SQL 注释与列注释避开裸 `token`/`secret`/`password`;`token_cost` 列名经正则实证安全(`\btoken\b` 不匹配下划线连接)。
- **回滚面**:纯新增包 + 一个未应用的迁移 SQL 与 contract 登记条目 + 根 package.json 一行 script + lockfile;revert 提交即完全回滚,无已部署数据面(迁移账本 status=local_contract,未接任何远端 apply)。
- **10x 视角**:1000 样本时逐样本工件与 jsonb 行线性增长,单事务插入先到瓶颈——分批事务是演进路径,不进 v1。

## Task Breakdown

- [x] 脚手架:`packages/chart-parse-eval` 骨架(package.json/tsconfig/bin tsx 壳)+ 迁移 SQL + migrations.contract.json 登记;`npm run check:database` 绿
- [x] RED:compare/metrics 语义、fixture 版本漂移门(40)与覆盖门(60)、runner 三键与逐样本行、双跑字节一致、calibrate insufficient(无 thresholds)与 happy(单调、三版本+sample_count)、draft 降级(tier 目标不可达)、pg-sink SQL 形状 的失败测试(实证 RED:7/7 文件先失败)
- [x] GREEN:fixture/fixture-builder/compare/metrics/run/calibrate/sink/pg-sink/cli 实现,包内 vitest 全绿(46/46;观测流语义修正:校准观测取全部 schema 合规样本的可比对字段,矩阵仍只算清晰子集——真 manifest 清晰子集仅 11 张,详见 notes)
- [x] CLI 接线:bin 壳 + scripts/check-eval.sh + 根 `check:chart-parse-eval`;对真 manifest 派生 fixture 双跑哈希一致 + jq 断言通过(check 全链 PASS)
- [ ] 全 workspace vitest + typecheck 绿;`/check` 自审 + codex-review 外审闭环,review 按机器格式落盘
- [ ] `LC_ALL=C repo-harness run verify-contract --strict` → `contract-worktree finish --no-merge` → push → PR → 回填 sprint 行 3 + handoff 台账

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] 脚手架:`packages/chart-parse-eval` 骨架(package.json/tsconfig/bin tsx 壳)+ 迁移 SQL + migrations.contract.json 登记;`npm run check:database` 绿
- [x] RED:compare/metrics 语义、fixture 版本漂移门(40)与覆盖门(60)、runner 三键与逐样本行、双跑字节一致、calibrate insufficient(无 thresholds)与 happy(单调、三版本+sample_count)、draft 降级(tier 目标不可达)、pg-sink SQL 形状 的失败测试(实证 RED:7/7 文件先失败)
- [x] GREEN:fixture/fixture-builder/compare/metrics/run/calibrate/sink/pg-sink/cli 实现,包内 vitest 全绿(46/46;观测流语义修正:校准观测取全部 schema 合规样本的可比对字段,矩阵仍只算清晰子集——真 manifest 清晰子集仅 11 张,详见 notes)
- [x] CLI 接线:bin 壳 + scripts/check-eval.sh + 根 `check:chart-parse-eval`;对真 manifest 派生 fixture 双跑哈希一致 + jq 断言通过(check 全链 PASS)
- [ ] 全 workspace vitest + typecheck 绿;`/check` 自审 + codex-review 外审闭环,review 按机器格式落盘
- [ ] `LC_ALL=C repo-harness run verify-contract --strict` → `contract-worktree finish --no-merge` → push → PR → 回填 sprint 行 3 + handoff 台账
