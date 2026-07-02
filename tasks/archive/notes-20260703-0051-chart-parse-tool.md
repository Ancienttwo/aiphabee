> **Archived**: 2026-07-03 00:51
> **Related Plan**: plans/archive/plan-20260703-0018-chart-parse-tool.md
> **Outcome**: Completed
> **Lifecycle**: notes
> **Parent Run ID**: run-20260703-0051

# Implementation Notes: chart-parse-tool

> **Status**: Active
> **Plan**: plans/plan-20260703-0018-chart-parse-tool.md
> **Contract**: tasks/contracts/20260703-0018-chart-parse-tool.contract.md
> **Review**: tasks/reviews/20260703-0018-chart-parse-tool.review.md
> **Last Updated**: 2026-07-03 00:45
> **Lifecycle**: notes

## Design Decisions

- **vision 通道 = AI Gateway openai-compatible(plan D1 落地)**:`createChartVisionModel` 镜像 `runAiGatewayLiveSmoke` 的 provider 装配(baseURL `/ai/v1` + `cf-aig-gateway-id`),显式 `supportsStructuredOutputs: true`(provider settings 层,验收 grep 面 provider.ts:34);默认 model `google-ai-studio/gemini-2.5-flash`,换档/换 provider 只改 model 字符串或 `AIPHABEE_CHART_VISION_MODEL` env。wire 级证据:worker 路由测试断言请求体 `response_format.type === "json_schema"`(证明该旗标真实翻转了输出格式,而非只是常量存在)。
- **重试语义定读(plan D2)**:模型重调 ≤1(`PARSE_CHART_IMAGE_MAX_MODEL_CALLS = 2`),每回合先 jsonrepair + `safeParseChartParseResult` 本地修复再考虑重调;修复成功 → `status=ready`(结果完整合规,非降级);两回合耗尽 → `parse_failed`,result 恒为 null 不回半成品。`degraded` 枚举建在表 check(PRD Data Model v2 定义)但 v1 executor 不产出。`generateObject` 显式 `maxRetries: 0`——重试预算由本状态机独占,防 provider 级重试把真实视觉调用放大超出 PRD 上限。
- **注入面**:deps = {fetchImage, model(LanguageModel), sink, generateId, now}。fetchImage 返回 `{bytes, mediaType} | null`(MIME 语义放在数据源头:R2 `httpMetadata.contentType` / smoke 的 `media_type` 字段);vision 面注入粒度取 LanguageModel,`ai/test` 的 `MockLanguageModelV4`(带 `doGenerateCalls` 计数)让 NoObjectGeneratedError→error.text→jsonrepair 全链在离线测试里真实走通。
- **迁移切刀(plan D4)**:只建 `aiphabee_core.chart_parse_results`(`20260703003000_parse_chart_image_runtime.sql`),无任何字节列;`image_ref`/`calibration_run_id` 逻辑引用无 FK(沿 sample_id 先例);`chart_images` 留给任务 5 与上传链路同刀设计。"仅存 imageRef" 三层机器证据:DDL 无 bytea + 行类型无字节字段 + 测试断言行键集合与二进制值扫描。
- **worker 装配 = token 门 live-smoke 路由**:`POST /agent/tools/parse-chart-image/live-smoke`,三段门(smoke header 403 → missing env 424 → Bearer ≥16 字符 403)镜像 `AGENT_LIVE_TOOL_LOOP` 先例;输入 `image_base64`(inline POC,不依赖上传链路)或 `image_ref`(R2 路径);响应脱敏(model id 只出 hash,不回图像字节),smoke 用内存 sink 不写 DB。`RuntimeR2Bucket.get` 返回类型扩展为 `RuntimeR2BucketObject`(可选 `arrayBuffer`/`httpMetadata`,既有 text-only 调用与 fake 零改动)。
- **每次调用必落一行**:fetchImage 抛异常(R2 故障)也走 `image_fetch_failed` 落行而非裸 reject(自审修复项,含回归测试)。

## Deviations From Plan Or Spec

- **ai@7 beta 已弃用 `image` content part**:plan P2 trace 写 "image part",实现改用 `{type: "file", data, mediaType}`(SDK deprecation warning 驱动),连带 fetchImage 返回形状从裸 bytes 升级为 `{bytes, mediaType}`。语义等价,wire 上仍是 openai-compat 的 `image_url` data URL(测试断言 `data:image/png;base64`)。

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| `@ai-sdk/google` 直连(原生 responseSchema) | 弃用,AI Gateway compat | 丢 Gateway 计费/观测面(成本验收明文靠 Gateway 日志);锁死 Google;多一个 provider 依赖;compat 翻译完整性风险由单函数装配缝 + live smoke POC 面兜住 |
| tool-registry 登记 parse_chart_image | 本刀不动 | REGISTERED_TOOLS 是 data-tool 的 MCP/api 治理面(7 个跨包消费者),登记牵动 MCP 暴露语义,属主循环集成刀 |
| 预缩放进 tool(@cf-wasm/photon) | 切任务 5 | 缩放正确位置在写 R2 前(一次缩放多次消费);wasm 依赖与上传校验同刀评估;fetchImage 注入点即未来预处理组合缝 |
| repair 成功记 degraded / error_code=repaired | ready + error_code=null | 结果完整过契约即非降级;repair 观测走 outcome.repair_applied(smoke 可见),不进表语义 |
| executor 对 generateObject 成功对象二次 safeParse | 保留 | 同 schema 下实际不可达,但防未来 output 模式/schema 装配漂移,一行成本 |

## Open Questions

- **Gateway compat 层对 google-ai-studio 的 vision + json_schema 翻译完整性 [UNVERIFIED]**:本会话无凭证跑 live;POC 面 = 部署后打 live-smoke 路由(inline base64)。若翻译有缺陷,fallback = `@ai-sdk/google` + Gateway provider 路由 baseURL,只改 `createChartVisionModel` 一处。
- **真模型 fixture 录制(下一刀)**:executor 是运行时无关的(deps 注入),Node 侧脚本可直接驱动它对 golden set 逐样本解析,按 `chart-parse-eval-fixture.v1` 形状落盘喂 runner 即得真实三项指标;归档 notes 的 `--record-fixture` 思路可落在该脚本。
- 生产 DB 写入 wire(Hyperdrive PgSink)与 `chart_parse_results` 真库 apply 属任务 5 之后运维动作(与上一轮 handoff 残留一致)。

## Evidence Links

- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`
- 包内 vitest:parse-chart-image 15/15(RED 先行:4/4 文件先失败再转绿);agent-runtime 全包 86/86
- worker vitest:339 passed / 1 skipped(新增 6 个路由测试:403 header / 424 missing env / 403 bearer / 200 inline happy(wire 断言 json_schema+model+data URL+脱敏)/ 502 坏 JSON 重调 / 200 R2 字节路径)
- 全 workspace:`npx vitest run` 883 passed / 1 skipped;`npm run typecheck`、`npm run lint`、`npm run test:golden` 全绿;`npm run check:database` 69 migrations ok
- 验收 grep:`grep -rn "supportsStructuredOutputs: true" packages/agent-runtime/src` → provider.ts:34 唯一命中

## Promotion Candidates

- Promote to `tasks/lessons.md` only after a repeated correction or failure pattern.
- Promote to `docs/researches/` only when it is durable repo knowledge with evidence.
- Promote to harness asset files only after verification across more than one task or fixture.
