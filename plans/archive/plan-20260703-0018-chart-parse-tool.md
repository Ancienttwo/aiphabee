# Plan: parse_chart_image tool 运行时

> **Status**: Archived
> **Created**: 20260703-0018
> **Slug**: chart-parse-tool
> **Planning Source**: waza-think
> **Orchestration Kind**: host-plan
> **Source Ref**: sprint:plans/sprints/20260702-1905-parse-chart-image.sprint.md#parse_chart_image tool 运行时(PRD Module 4,Script #3)
> **Artifact Level**: work-package
> **Promotion Reason**: worktree_boundary
> **Verification Boundary**: Commands named in the captured planning output plus `repo-harness run verify-contract --contract tasks/contracts/20260703-0018-chart-parse-tool.contract.md --strict`.
> **Rollback Surface**: Before execution remove `plans/plan-20260703-0018-chart-parse-tool.md`; after execution revert branch `codex/chart-parse-tool` or the explicitly reviewed diff.
> **Spec**: `docs/spec.md`
> **Research**: See `docs/researches/`
> **Task Contract**: `tasks/contracts/20260703-0018-chart-parse-tool.contract.md`
> **Task Review**: `tasks/reviews/20260703-0018-chart-parse-tool.review.md`
> **Implementation Notes**: `tasks/notes/20260703-0018-chart-parse-tool.notes.md`

## Agentic Routing
- Selected route: planning
- Routing reason: Captured from waza-think planning output.
- Source ref: sprint:plans/sprints/20260702-1905-parse-chart-image.sprint.md#parse_chart_image tool 运行时(PRD Module 4,Script #3)
- Due diligence:
  - P1 map: See captured planning output below.
  - P2 trace: See captured planning output below.
  - P3 decision rationale: See captured planning output below.

## Workflow Inventory
Complete this inventory before implementation. If any line is unknown, keep the plan in Draft and fill it before projection.

- Active plan: `plans/plan-20260703-0018-chart-parse-tool.md`
- Sprint contract: `tasks/contracts/20260703-0018-chart-parse-tool.contract.md`
- Sprint review: `tasks/reviews/20260703-0018-chart-parse-tool.review.md`
- Implementation notes: `tasks/notes/20260703-0018-chart-parse-tool.notes.md`
- Deferred-goal ledger: `tasks/todos.md`
- Current checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- Scope authority: `tasks/contracts/20260703-0018-chart-parse-tool.contract.md` `allowed_paths`
- Concurrency rule: `.ai/harness/active-plan` selects the active plan for this worktree when present; `.ai/harness/active-worktree` records the owning worktree; `.claude/.active-plan` is a legacy fallback during transition. If another worktree already owns active work, open or switch to the matching worktree instead of serializing unrelated plans.
- Execution isolation: approved contract-level work projects through `repo-harness run plan-to-todo --plan plans/plan-20260703-0018-chart-parse-tool.md` and may start `repo-harness run contract-worktree start --plan plans/plan-20260703-0018-chart-parse-tool.md`.

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
- Contract file: `tasks/contracts/20260703-0018-chart-parse-tool.contract.md`
- Review file: `tasks/reviews/20260703-0018-chart-parse-tool.review.md`
- Implementation notes file: `tasks/notes/20260703-0018-chart-parse-tool.notes.md`
- Template: `.claude/templates/contract.template.md`
- Verification command: `repo-harness run verify-contract --contract tasks/contracts/20260703-0018-chart-parse-tool.contract.md --strict`
- Active plan rule: this captured plan is written to `.ai/harness/active-plan`, the owning worktree is written to `.ai/harness/active-worktree`, and the plan is mirrored to `.claude/.active-plan` unless --no-active is used. Do not infer active execution from the latest non-archived plan.

## Handoff

- Checks file: `.ai/harness/checks/latest.json`
- Session handoff: `.ai/harness/handoff/current.md`

## Promotion Gate

- **Merge/PR unit**: Captured plan `plans/plan-20260703-0018-chart-parse-tool.md` is the proposed mergeable execution unit; revise before execute if this is only a checklist step.
- **Rollback surface**: Before execution remove `plans/plan-20260703-0018-chart-parse-tool.md`; after execution revert branch `codex/chart-parse-tool` or the explicitly reviewed diff.
- **Verification boundary**: Commands named in the captured planning output plus `repo-harness run verify-contract --contract tasks/contracts/20260703-0018-chart-parse-tool.contract.md --strict`.
- **Review/acceptance boundary**: `tasks/reviews/20260703-0018-chart-parse-tool.review.md` must record pass against the captured acceptance criteria.
- **High-risk surface**: Risks named in captured planning output; keep the plan Draft if risk ownership is not concrete.
- **Why not checklist row**: worktree_boundary

## Evidence Contract

- **State/progress path**: `plans/plan-20260703-0018-chart-parse-tool.md` task breakdown, `tasks/todos.md` deferred-goal ledger, `tasks/contracts/20260703-0018-chart-parse-tool.contract.md`, `tasks/reviews/20260703-0018-chart-parse-tool.review.md`, and `tasks/notes/20260703-0018-chart-parse-tool.notes.md`
- **Verification evidence**: `.ai/harness/checks/latest.json`, `.ai/harness/runs/`, and the commands named in the captured planning output
- **Evaluator rubric**: `tasks/reviews/20260703-0018-chart-parse-tool.review.md` must record a passing Waza /check style recommendation
- **Stop condition**: all task breakdown items are complete, sprint verification passes, and the review recommends pass
- **Rollback surface**: Before execution remove `plans/plan-20260703-0018-chart-parse-tool.md`; after execution revert branch `codex/chart-parse-tool` or the explicitly reviewed diff.

## Captured Planning Output

# parse_chart_image tool 运行时(Sprint 任务 4 / PRD Module 4)

## 目标与验收

在 `@aiphabee/agent-runtime` 落出 `parse_chart_image` 的真实 tool 执行路径(AI SDK v7 `tool()`,Workers 进程内函数):imageRef → R2 字节 → generateObject(vision)→ zod 二次校验 → ChartParseResult 落 sink;坏 JSON 走 jsonrepair + 重调 ≤1 的降级状态机;worker 侧以 token 门 live-smoke 路由完成装配。这是 sprint 首个碰已有运行时代码的任务(agent-runtime 首个 actual tool execution 面)。

机器验收(sprint backlog 行 4 原文):清晰样本 fixture 返回过 zod 校验的 ChartParseResult 且 `chart_parse_results` 仅存 imageRef 无图像字节;坏 JSON fixture 断言重试 ≤1 次后 status=parse_failed;`grep -rn "supportsStructuredOutputs" packages/agent-runtime/src` 命中显式 true 配置。

## 前置条件(本会话已核)

- PR #20 已 merge(main `1412927`),`git merge-base --is-ancestor 65f4c1a main` 为真;chart-parse 契约、golden set、chart-parse-eval 全在 main 基线。
- `CHART_PARSE_CONTRACT`(schema+buildPrompt+双版本)与 `safeParseChartParseResult` 在 `@aiphabee/agent-runtime/chart-parse` 子路径,zod 已在 agent-runtime deps。
- `@ai-sdk/openai-compatible@3.0.0-beta.57`:`OpenAICompatibleProviderSettings.supportsStructuredOutputs?: boolean` 存在,`OpenAICompatibleChatLanguageModel` 有 readonly 同名属性可断言(node_modules d.ts 已核)。
- `ai@7.0.0-beta.182`:`tool`/`generateObject`/`NoObjectGeneratedError`/`ImagePart{type:'image', image: DataContent}` 均导出(d.ts 已核)。
- `jsonrepair@3.14.1` npm 可达,纯 JS 无 native 依赖,Workers 兼容;仓库尚无此依赖,本刀新增。
- worker 面:`AIPHABEE_ARTIFACTS` R2 绑定已存在但本地 `RuntimeR2Bucket` 接口仅 `text()`,需向后兼容地扩展字节读取;`runAiGatewayLiveSmoke`(agent-runtime:2559)是 AI Gateway + fetch 注入 + token 门 smoke 路由的完整先例。

## 尽调

### P1 map

- 落点一:`packages/agent-runtime/src/parse-chart-image/`(新目录,镜像 `chart-parse/` 的子路径导出模式,package.json exports 加 `./parse-chart-image`)。不进 7358 行的 `src/index.ts` megafile(小文件原则 + chart-parse 先例)。
- 落点二:`apps/worker/src/index.ts` 一条 token 门 live-smoke 路由(镜像 AI Gateway live smoke 的 env token + 路由 + 测试三件装配),WorkerBindings 增 `AIPHABEE_AGENT_PARSE_CHART_IMAGE_LIVE_SMOKE_TOKEN` 与 vision 模型 env;`RuntimeR2Bucket` 增可选 `arrayBuffer` 读取路径。
- 落点三:`deploy/database/migrations/` 新迁移建 `aiphabee_core.chart_parse_results` + `migrations.contract.json` 登记(登记套路照任务 3 先例:14 位时间戳、file/purpose/schemas/tables/indexes/market_data:false/字面 default_deny、禁词避让、`create schema if not exists` + 每表 `if not exists`)。
- 明确不碰:`packages/tool-registry`(REGISTERED_TOOLS 是 data-tool 的 MCP/api 治理面,7 个跨包消费者,登记 parse_chart_image 需先决 MCP 暴露语义,属后续集成刀);agent-runtime megafile 里既有 release-gate capabilities 的 `actual_tool_execution: false` 标记(它们申报的是 agent 主循环面,主循环本刀仍是 scaffold,翻标记即虚假申报);`packages/chart-parse-eval` 与 `packages/chart-golden-set`(零改动,消费面在录制刀)。

### P2 trace(smoke 请求→落库行)

`POST /agent/tools/parse-chart-image/live-smoke`(Bearer token 门)→ body `{image_ref?|image_base64?, model?}` → worker 装配 deps:fetchImage(image_ref → R2 `arrayBuffer`;image_base64 → 解码字节,首次 POC 不依赖上传链路)+ `createChartVisionModel({accountId, apiToken, gatewayId, modelId})` + 内存 sink + crypto.randomUUID id → executor:fetchImage 得字节(null → 不调模型,`image_not_found` 直接 parse_failed)→ attempt 循环(≤2 次模型调用):`generateObject({model, schema: CHART_PARSE_CONTRACT schema, messages: [user: [image part(字节), text(buildChartParsePrompt())]], temperature: 0})` → 成功对象仍过 `safeParseChartParseResult` 二次校验(不信 provider 宽松)→ 失败(NoObjectGeneratedError 携 raw text / zod fail)→ 本回合先 jsonrepair(raw text)→ JSON.parse → `safeParseChartParseResult`(便宜的本地修复)→ 修复成功即 ready;修复失败且未用完重调额度 → 重调模型 1 次(重试计数 1)→ 两回合耗尽 → `status=parse_failed`,result=null 不返回半成品 → sink.record({id, image_ref(字符串), result_json, schema_version/prompt_version(契约冻结值)/model_version(modelId), calibration_run_id: null(未校准必须人工确认,PRD Data Model v2), token_cost(usage 合计), latency_ms(注入 now 差), status, error_code})→ smoke 响应回 outcome + usage + attempt_count(不回图像字节)。压力点:重试语义必须离线可断言——mock model 记录调用数,坏 JSON fixture 断言调用数 === 2 且 status=parse_failed;可修复坏 JSON fixture 断言调用数 === 1 且 ready(证明 repair 先于重调)。

### P3 decision rationale(五决策点收敛)

- **D1 vision 通道:AI Gateway OpenAI-compat endpoint(`createOpenAICompatible`),默认 model `google-ai-studio/gemini-2.5-flash`,弃 `@ai-sdk/google` 直连。** 理由:(1) 仓库先例——`runAiGatewayLiveSmoke` 已用同构路径(`/ai/v1` + `cf-aig-gateway-id` header + fetch 注入)在 Workers 实证跑通;(2) 成本验收面——PRD Success Criteria 的测量方法明文 "AI Gateway/计费日志 per-image token 统计",直连即丢 Gateway 观测、需自建计费日志;(3) 验收 grep 面——`supportsStructuredOutputs` 只在 openai-compatible 路径存在,sprint 验收行本身编码了该预期;(4) 模型可替换硬约束——compat 的 model 字符串 `{provider}/{model}` 使换档/换 provider 成纯配置变更,`@ai-sdk/google` 锁死 Google;(5) 零新增 provider 依赖。已知代价:Gateway compat 层对 google-ai-studio 的 image + json_schema 翻译完整性 [UNVERIFIED](本会话无凭证跑 live)——变形见"最脆弱假设"。
- **D2 执行路径:纯依赖注入 executor(`createParseChartImageExecutor(deps)`)+ `tool()` 薄包装 + worker smoke 装配。** deps = {fetchImage, model(LanguageModel), sink, generateId, now}——vision 面注入粒度取 LanguageModel 而非更高层函数,让 generateObject→NoObjectGeneratedError→error.text 的真实链路进测试(mock model 按 ai SDK spec 返回坏文本即精确复刻 Scenario 3;ai 包若有 mock util 则用,否则 ~20 行 spec stub 自写)。重试语义定读:PRD "重试上限 1 次" = 模型重调 ≤1(共 ≤2 次调用),"jsonrepair + zod 二次校验" = 每回合的本地修复兜底,先修复后重调(两段 PRD 文本在此读法下自洽,且 "单次分析最多一次视觉解析" 指上层一次分析只调一次 tool,与 tool 内重调不冲突);repair 成功 → status=ready(结果完整合规,非降级);`degraded` 枚举值建在表 check 里(PRD Data Model 定义)但 v1 executor 不产出,parse_failed 即 Scenario 3 的降级标记。tool() 包装只做 inputSchema(`z.object({image_ref: z.string()})`)+ execute 转发,不进主 agent loop(DeepSeek 集成属后续刀)。
- **D3 `supportsStructuredOutputs:true` 落点:`parse-chart-image/provider.ts` 的 `createChartVisionModel`,写在 `createOpenAICompatible` provider settings(grep 命中面),附静默降级风险注释;单测直接断言装配出的 model `.supportsStructuredOutputs === true`(readonly 属性已核可测)。**
- **D4 迁移切刀:本刀只建 `chart_parse_results`,`chart_images` 留任务 5。** image_ref 是 r2_key 字符串逻辑引用非 FK(沿任务 3 sample_id/source_eval_run_id 无 FK 先例),先建无阻塞;chart_images 的全部验收(tenant ownership/保留策略/级联删除)在任务 5,表结构与上传链路同刀设计避免返工。"仅存 imageRef 无图像字节"的机器面三层:迁移 DDL 无 bytea/blob 列 + sink 行类型无字节字段 + fixture 断言 sink 收到的行 image_ref 为字符串且值不含图像字节。生产 DB 写入 wire(Hyperdrive)不在本刀(live DB apply/readback 是任务 4/5 之后的运维动作,与 handoff 残留一致):agent-runtime 只出 `ChartParseResultSink` 接口 + 内存实现,保持包 Workers-pure 零 pg 依赖。
- **D5 预缩放(长边 1000-1568px):切给任务 5。** 缩放的正确位置是写 R2 之前(一次缩放多次消费;tool 每次 parse 缩放浪费且引入 `@cf-wasm/photon` wasm 依赖);PRD Module 5 Recommended Defaults 明文把缩放实现(photon vs 客户端)列在上传链路;fetchImage 注入点即未来预处理的组合缝,不加额外抽象。smoke 的 image_base64 输入自控尺寸,POC 不受阻。

## 设计

### 文件布局

| 文件 | 内容 |
|------|------|
| `packages/agent-runtime/src/parse-chart-image/types.ts` | `ParseChartImageOutcome`(status/result/error_code/attempt_count/usage/latency_ms)、`ChartParseResultRecord`(行形状,字段照 PRD Data Model v2)、`ChartParseResultSink` 接口、`ParseChartImageDeps` |
| `packages/agent-runtime/src/parse-chart-image/provider.ts` | `createChartVisionModel({accountId, apiToken, gatewayId, modelId, fetch?})`:`createOpenAICompatible` + baseURL `/ai/v1` + `cf-aig-gateway-id` + `includeUsage: true` + 显式 `supportsStructuredOutputs: true` → `.chatModel(modelId)` |
| `packages/agent-runtime/src/parse-chart-image/repair.ts` | `repairAndValidate(rawText)`:jsonrepair → JSON.parse → `safeParseChartParseResult`,返回 result 或 null |
| `packages/agent-runtime/src/parse-chart-image/executor.ts` | `createParseChartImageExecutor(deps)` 状态机(P2 trace 全文),usage/latency 采集,sink 落行 |
| `packages/agent-runtime/src/parse-chart-image/sink.ts` | `createInMemoryChartParseResultSink()`(测试/smoke 用) |
| `packages/agent-runtime/src/parse-chart-image/tool.ts` | `createParseChartImageTool(deps)` = `tool({description, inputSchema, execute})` |
| `packages/agent-runtime/src/parse-chart-image/index.ts` | 导出面 + `PARSE_CHART_IMAGE_TOOL_VERSION = "parse-chart-image-tool.v1"` |
| `packages/agent-runtime/src/parse-chart-image/*.test.ts` | provider 断言 / repair / executor 状态机(happy、坏 JSON×2、可修复、fetch null)/ tool 包装 |
| `packages/agent-runtime/package.json`(改) | exports 加 `./parse-chart-image`;deps 加 `jsonrepair@^3.14.1` |
| `apps/worker/src/index.ts`(改) | binding token + vision env + `RuntimeR2Bucket` 可选字节读取 + `POST /agent/tools/parse-chart-image/live-smoke` 路由装配 |
| `apps/worker/src/index.test.ts`(改) | 路由测试镜像既有 live smoke 模式(401/缺 env/装配 happy with 注入) |
| `deploy/database/migrations/<14位时间戳>_parse_chart_image_runtime.sql` | `aiphabee_core.chart_parse_results` DDL:PRD v2 全字段,status check(ready/degraded/parse_failed),索引 (tenant_id, created_at) 与 (schema_version, prompt_version, model_version) 供任务 5 校准匹配查询;无任何字节列 |
| `deploy/database/migrations.contract.json`(改) | +1 登记条目 |
| `package-lock.json`(改) | jsonrepair 安装产物 |

### 关键约定

- 三版本落行:schema_version/prompt_version 取 `CHART_PARSE_CONTRACT` 冻结值(生产解析与评测永不漂移的同一真值源),model_version 记 modelId 字符串。
- `calibration_run_id` 恒为 null(本刀无校准消费;null = 未校准必须人工确认,语义在 PRD Data Model v2)。
- executor 对字节透传零预处理;temperature 0;maxOutputTokens 上限防失控。
- smoke 响应与 sink 行均不含图像字节;smoke 不写 DB(内存 sink)。

## 边界与风险

- **不做**:tool-registry 登记、主 agent loop(DeepSeek)集成、上传路由与 `chart_images` 表、FR-01 路由、预缩放实现、Hyperdrive/pg 生产写入 wire、`--record-fixture` 录制脚本(任务 4 落地后的下一刀)、既有 release-gate scaffold 标记翻转。
- **最脆弱假设(premise collapse)**:AI Gateway compat 层对 google-ai-studio 的 image 输入 + json_schema 严格模式翻译完整性 [UNVERIFIED]。本计划假设其可用;若 live POC 失败,fallback = `@ai-sdk/google` 直连但 baseURL 指 Gateway 的 `google-ai-studio` provider 路由(保住 Gateway 观测面)——通道选型已隔离在 `createChartVisionModel` 单函数,executor/测试/契约/表零改动。POC 面 = smoke 路由(token 门)+ 首次真 fixture 录制。
- **重试语义读法风险**:若外审判 "重试 ≤1" 应读作"仅本地修复不重调模型",改动收敛在 executor 循环上限一处(2→1),断言改调用数 === 1,状态机形状不变。
- **迁移禁词风险**:沿任务 3 实证套路(`token_cost` 下划线连接安全,注释避裸词,字面 default_deny 登记)。
- **回滚面**:agent-runtime 一个新目录 + exports/依赖各一行 + worker 一路由一 token + 未 apply 的迁移 SQL 与登记条目 + lockfile;revert 提交即完全回滚,无已部署数据面(迁移账本 status=local_contract)。
- **10x 视角**:单图单调用无批量面;真正先到的瓶颈是校准数据积累(录制刀)与 Gateway 限流,均不在本刀契约内。

## Task Breakdown

- [x] 脚手架:`parse-chart-image/` 目录骨架 + package.json exports/`jsonrepair@^3.14.1` 依赖 + 迁移 `20260703003000_parse_chart_image_runtime.sql` + migrations.contract.json 登记;`npm run check:database` 绿(69 migrations ok)
- [x] RED:provider 显式 true 断言、repair 语义、executor 四路径、sink 行仅 imageRef 无字节、tool 包装 的失败测试(实证 RED:4/4 文件先失败于缺实现)
- [x] GREEN:types/provider/repair/executor/sink/tool 实现,包内 vitest 全绿(parse-chart-image 14/14;agent-runtime 全包 85/85;弃用的 image part 换成 file part + mediaType,fetchImage 返回 {bytes, mediaType})
- [x] worker 装配:token binding + `RuntimeR2BucketObject`(可选 arrayBuffer/httpMetadata,向后兼容)+ `POST /agent/tools/parse-chart-image/live-smoke` 路由 + 6 个路由测试绿(worker 339/340;wire 断言 response_format=json_schema、默认 model id、data URL image part、响应脱敏)
- [ ] 全 workspace vitest + typecheck 绿;三条验收命令绿(vitest 路径过滤 + `grep -rn "supportsStructuredOutputs" packages/agent-runtime/src` + `npm run check:database`);`/check` 自审 + codex-review 外审闭环,review 按机器格式落盘
- [ ] `LC_ALL=C repo-harness run verify-contract --strict` 到 Fulfilled 终态 → 取指纹回写 review → `contract-worktree finish --no-merge` → push → PR → 回填 sprint 行 4 + handoff 台账

## Annotations
<!-- [NOTE]: prefixed inline. Claude processes all and revises. -->

## Task Breakdown
- [x] 脚手架:`parse-chart-image/` 目录骨架 + package.json exports/`jsonrepair@^3.14.1` 依赖 + 迁移 `20260703003000_parse_chart_image_runtime.sql` + migrations.contract.json 登记;`npm run check:database` 绿(69 migrations ok)
- [x] RED:provider 显式 true 断言、repair 语义、executor 四路径、sink 行仅 imageRef 无字节、tool 包装 的失败测试(实证 RED:4/4 文件先失败于缺实现)
- [x] GREEN:types/provider/repair/executor/sink/tool 实现,包内 vitest 全绿(parse-chart-image 14/14;agent-runtime 全包 85/85;弃用的 image part 换成 file part + mediaType,fetchImage 返回 {bytes, mediaType})
- [x] worker 装配:token binding + `RuntimeR2BucketObject`(可选 arrayBuffer/httpMetadata,向后兼容)+ `POST /agent/tools/parse-chart-image/live-smoke` 路由 + 6 个路由测试绿(worker 339/340;wire 断言 response_format=json_schema、默认 model id、data URL image part、响应脱敏)
- [ ] 全 workspace vitest + typecheck 绿;三条验收命令绿(vitest 路径过滤 + `grep -rn "supportsStructuredOutputs" packages/agent-runtime/src` + `npm run check:database`);`/check` 自审 + codex-review 外审闭环,review 按机器格式落盘
- [ ] `LC_ALL=C repo-harness run verify-contract --strict` 到 Fulfilled 终态 → 取指纹回写 review → `contract-worktree finish --no-merge` → push → PR → 回填 sprint 行 4 + handoff 台账
