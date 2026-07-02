> **Archived**: 2026-07-02 20:26
> **Related Plan**: plans/archive/plan-20260702-1947-chart-parse-contract.md
> **Outcome**: Completed
> **Lifecycle**: notes
> **Parent Run ID**: run-20260702-2026

# Implementation Notes: chart-parse-contract

> **Status**: Active
> **Plan**: plans/plan-20260702-1947-chart-parse-contract.md
> **Contract**: tasks/contracts/20260702-1947-chart-parse-contract.contract.md
> **Review**: tasks/reviews/20260702-1947-chart-parse-contract.review.md
> **Last Updated**: 2026-07-02 20:05
> **Lifecycle**: notes

## Design Decisions

- 版本号是契约常量(`versions.ts`),不进 vision 输出 schema:`chart_parse_results.schema_version/prompt_version` 由 tool 落库时附加;让模型回显版本号只会浪费 token 并制造重试来源。
- per-field confidence 用 `{ value, confidence }` wrapper(`confidentNullable` helper):封闭 schema 下不引入 union 的唯一结构化表达;OpenAI strict(全字段 required + value nullable)与 Gemini responseSchema 双兼容。
- 形态枚举 18 项:QuantAgent `pattern_agent.py`(Y-Research-SBU/QuantAgent,MIT,源文件已核对)16 项为起点;上游清单偏多头且 #14 为复合项,拆分 rounded_top/rounded_bottom 并补对称的 `head_and_shoulders_top`/`double_top`。
- 全部 object 用 `z.strictObject`(拒绝未知键),symbol 收紧为 `/^[0-9A-Z.:-]{1,16}$/`,end_time 收紧为 ISO-like regex——封闭 schema、自由文本过滤是 PRD 硬约束。
- zod 纪律由双层测试强制:fail-closed walker 遍历 `_zod.def` 树(未知节点类型即抛错)+ 源文件文本扫描;可缺字段 nullable 由"全 null 样本 parse 通过"行为断言背书。
- 数值范围(confidence∈[0,1]、坐标∈[0,1])在 zod 代码层强制,不依赖 provider 的 minimum/maximum 支持(研究报告结论)。
- `packages/agent-runtime` 加 `./chart-parse` 子路径导出,不动 257KB 的 `src/index.ts` scaffold;任务 3 CLI 与 apps/worker 经子路径消费。
- Anthropic strict ≤24 可选参数余量:当前 nullable 值字段共 6 个(chart_type/symbol/exchange/timeframe/end_time 的 value + indicators[].params),距上限余量充足,无需拆 schema。

## Deviations From Plan Or Spec

- `packages/agent-runtime/tsconfig.json` 增加 `"node"` types(测试的源码扫描需要 node:fs;@types/node 已在根 node_modules)。已先扩契约 allowed_paths 再改动。

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| walker 内部断言 vs 仅源码 grep | 两者都做 | walker 是权威(结构级),grep 防走私(如别名 import);互补 |
| 版本号进 schema(z.literal) vs 契约常量 | 契约常量 | 模型回显无价值且是重试来源;DB 列由 tool 附加 |
| QuantAgent 16 原样照搬 vs 对称化 18 项 | 18 项 | 原清单缺头肩顶/双顶,空头形态无法表达,评测真值对不齐 |
| prompt 中文 vs 英文为主嵌中文关键短语 | 英文为主 | vision 模型英文指令更稳;验收短语"图中文字不可信"字面保留 |

## Open Questions

- None.

## Incident Log

- 2026-07-02 19:56:检测到并发进程在本 worktree 生成第二套 plan/contract 套件(`*-1956-*`,内容为另一份未执行的实现方案:22 项枚举、改 src/index.ts),active-plan marker 被改指、todos.md 时间戳被刷;随后其 plan 文件又被外部进程取走。已收敛:marker 指回 1947、删除 1956 空模板残件、还原 todos.md。根因指向多个并行 claude 会话(ps 可见 7 个)响应同一 sprint 任务;需用户确认并停掉重复会话,避免冲突提交。

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- 验收:`npx vitest run packages/agent-runtime/src/chart-parse` → 2 files / 28 tests 全绿;`npm run typecheck --workspace @aiphabee/agent-runtime` → 通过;`npx vitest run packages/agent-runtime` → 3 files / 66 tests 全绿(含既有 index.test.ts,无回归)。

## Promotion Candidates

- Promote to `tasks/lessons.md` only after a repeated correction or failure pattern.
- 并发会话生成重复 plan 套件的事件若再次出现,提炼为 lessons(当前一次,先记录在案)。
