> **Archived**: 2026-07-02 23:41
> **Related Plan**: plans/archive/plan-20260702-2305-chart-parse-eval.md
> **Outcome**: Completed
> **Lifecycle**: notes
> **Parent Run ID**: run-20260702-2341

# Implementation Notes: chart-parse-eval

> **Status**: Active
> **Plan**: plans/plan-20260702-2305-chart-parse-eval.md
> **Contract**: tasks/contracts/20260702-2305-chart-parse-eval.contract.md
> **Review**: tasks/reviews/20260702-2305-chart-parse-eval.review.md
> **Last Updated**: 2026-07-02 23:30
> **Lifecycle**: notes

## Design Decisions

- **解析源 = fixture 回放**(plan D1 落地):`run --fixture` 必填,fixture 声明 schema/prompt/model 三版本;schema/prompt 与 `CHART_PARSE_CONTRACT` 漂移 → exit 40,样本覆盖不一致 → exit 60。真 provider 通道零依赖,Module 4 落地后适配成同形状输入即可。
- **迁移**:`20260703001000_chart_parse_eval_foundation.sql` 建 `aiphabee_core.eval_runs/eval_sample_results/calibration_runs`;`eval_sample_results.eval_run_id` 是唯一 FK;`sample_id`/`source_eval_run_id` 只作逻辑引用(manifest 是样本真值源;工件模式校准的来源 run 可能不在库内)。`golden_set_samples` 表沿用上轮决策不建。
- **确定性 id**:run id = `cper-<sha256(set_version+三版本+fixture_sha+容差)前16>`,calibration id = `ccal-<sha256(source+mapping+门槛+targets+observations)前16>`;配合 `on conflict (id) do nothing` 使 DB 写入幂等,工件零时间戳(`created_at` 走列默认值)。
- **DB 写入门**:`CHART_PARSE_EVAL_ENABLE_DB_WRITE=1` + `CHART_PARSE_EVAL_DATABASE_URL`(回退 `DATABASE_URL`),镜像 data-ingest env 姿态;pg 只在 cli 层动态 import,`PgEvalSink` 注入 queryable 离线断言 SQL 形状。
- **校准**:tier 池化 isotonic(PAV,`isotonic-pav.v1`);阈值 = 校准曲线首次达到 tier 目标的最小原始置信度;目标经 `--auto-targets`/`--confirm-targets` 传入(默认取 PRD Success Criteria Target/Degradation 列)并回写 thresholds.targets。insufficient(样本/分层观测门)→ 不产 thresholds、不落行、exit 0;数据充足但任一 tier 目标不可达 → status=draft 且 thresholds=null(Module 5 只认 ready,自动路由保持阻断)。ready 落库时同三版本旧 ready 行置 superseded。

## Deviations From Plan Or Spec

- **校准观测流的取样面从"清晰子集"放宽到"全部 schema 合规样本的可比对字段"**(truth 非 null 的 applicable 字段)。原因:实测已提交 manifest 的清晰子集(degradation=none 且 info_missing=none)只有 11 张(info_missing≠none 占 75),只用清晰样本喂校准,默认样本门(50)结构性不可达;方法论上生产截图多为降质/缺标注图,置信度校准恰恰需要难样本上的低置信观测。`field_matrix` 仍严格按 PRD 只聚合清晰子集;null 负例判定面不变(info_missing≠none)。plan 的 P2 trace 原文写观测取自清晰子集,以本条为准。

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| promptfoo / OpenAI Evals 接入 | 弃用,in-repo 直算 | 三项指标是 safeParse+truth 直比的确定性计算;PRD Freedoms 明示选型自由,框架接入被标 [UNVERIFIED] 且 CI 无外呼 |
| temperature scaling | 弃用,isotonic PAV | 需迭代拟合;isotonic 是 PRD 点名默认、构造性单调、零依赖 |
| 逐字段 isotonic | 弃用,tier 池化 + field_tier 映射 | 单字段观测量太稀;样本量扩容后可演进 |
| golden_set_samples 表现在建 | 不建 | manifest sample id 是稳定引用;建表即多一个无人填充的 FK 目标 |
| calibrate 直连 DB 读 eval 证据 | 弃用,消费 run 工件文件 | 离线可回放是验收面;DB 是运行时能力 |

## Open Questions

- 真实 vision fixture 的录制流程(Module 4 落地后):建议 tool 运行时留 `--record-fixture` 通道,把真模型输出按 `chart-parse-eval-fixture.v1` 形状落盘,直接喂本 runner。
- 清晰子集只有 11 张 → field_matrix 的分层达标断言(P0≥95% 等)在样本量上噪声偏大;golden set 扩容(`--count` 提升)时矩阵置信度自然改善,不阻塞本任务。

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- 包内 vitest:46/46(RED 先行:7/7 文件先失败再转绿)
- `npm run check:chart-parse-eval`:双跑 run 工件 sha256 一致(`458e569a…`)+ 三键断言 + 100 行可回放 + insufficient 无 thresholds + 校准三版本/sample_count/双跑一致,全 PASS
- 全 workspace:`npx vitest run` 861 passed / 1 skipped;`npm run typecheck`、`npm run lint`、`npm run check:database`(68 migrations ok)、`npm run test:golden` 全绿

## Promotion Candidates

- Promote to `tasks/lessons.md` only after a repeated correction or failure pattern.
- Promote to `docs/researches/` only when it is durable repo knowledge with evidence.
- Promote to harness asset files only after verification across more than one task or fixture.
