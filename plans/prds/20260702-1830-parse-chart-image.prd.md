# PRD: parse_chart_image 截图图表解析能力

> **Status**: Approved
> **Slug**: parse-chart-image
> **Created**: 2026-07-02
> **Updated**: 2026-07-02
> **Source Spec**: `docs/spec.md`
> **Tier**: compact

## AI Quick-Read Card

- Problem: 主脑 DeepSeek V4 纯文本、无 image 输入,用户上传的 K 线截图进不了推理链;缺一个把不可信视觉输入转成可审计结构化证据、且永远知道自己读得多准的边界层。
- Users: 港股技术分析 agent 终端用户;平台工程 owner;上承技术分析 agent(FR-01 路由消费者)。
- Platform: Cloudflare Workers + Vercel AI SDK v7 + Hono;vision sidecar 默认 Gemini 2.5 Flash;工程面 Node CLI。
- P0 surface: ChartParseResult schema 契约、golden set 生成器 CLI、评测+校准 CLI、parse_chart_image tool、上传→R2→imageRef 链路。
- Core metric: schema 合规率 ≥99%;清晰图字段矩阵分层达标(P0 字段 symbol/exchange/timeframe ≥95%,P1 字段 end_time/指标名称 ≥90%,P2 字段 参数/anchor ≥80%);无标注图 null-over-guess 负例通过率 ≥90%。
- Hard constraint: DeepSeek 全程不接触像素(imageRef 隔离);vision 不读数值;置信度未离线校准前不启用自动路由。
- Key risk: VLM 在震荡行情读 K 线判断与蜡烛证据脱钩;自报 per-field 置信度系统性偏高。
- Unknowns: vision 通道最终选型;校准后 Gemini Flash 清晰图准确率是否 ≥85%(Falsifier)。
- Acceptance scenarios: 清晰截图→高置信结构化解析;无标注/模糊截图→low-confidence + null,不臆造。
- Suggested next step: 先落 ChartParseResult schema + prompt 契约,再落 golden set 生成器;评测先行于 tool。

## Problem

截图解析是把"不可信视觉输入"转成"可审计结构化证据"的边界层。产品价值不在读得多准,而在永远知道自己读得多准。2026-07-02 的开源生态抽样检索未发现可整体复用方案(方法与局限见研究报告证据地图),ChartParseResult 严格 schema + per-field 置信度 + 校准路由在已知实现范围内即差异化资产,也是未来公告截图/财报图片等 vision 能力复用的第一块样板。

### Product Direction

- Hard Constraints:
  - DeepSeek V4 官方 API 纯文本、user content string-only、无 image 输入(已核);像素解析必须外置到 vision sidecar。
  - imageRef 隔离:截图字节只存 R2 `AIPHABEE_ARTIFACTS`,主 agent 只见 imageRef 字符串。
  - vision 不做数值读数;精确 OHLC/指标值永远来自确定性引擎(对齐上承 PRD 核心决策)。
  - 置信度未离线校准前一律走用户确认,不启用自动数据匹配路由。
  - 封闭 schema(无自由动作字段);图中文字视为不可信输入。
  - vision 模型可替换是硬约束:换档/换 provider 只改配置,不改契约。
- Recommended Defaults:
  - 默认 Gemini 2.5 Flash;结构化输出走 responseSchema / json_schema strict。
  - 提交前长边缩放到 1000-1568px(~1.15MP);Gemini `media_resolution=high`,OpenAI `detail=high`。
  - 坐标统一 0-1 归一化存储,prompt 显式声明坐标系。
  - schema 非法重试上限 1 次(jsonrepair + zod 二次校验),再失败降级 Visual-Only。
- Freedoms:
  - vision 通道接入方式(`@ai-sdk/google` 直连 vs AI Gateway `google-ai-studio` 路由)。
  - prompt 版本迭代、形态枚举扩充、置信度增强手段(2 次采样一致性等)。

### Feasibility Boundary

- Confirmed:
  - Gemini responseSchema 与 OpenAI json_schema strict 官方支持图片输入 + 严格 schema(已核)。
  - `@ai-sdk/openai-compatible` 的 json_schema 路径由 `supportsStructuredOutputs` 闸门控制,不显式传 `true` 会静默降级为无约束 json_object(源码级确认)。
  - R2 桶 `AIPHABEE_ARTIFACTS` 已绑定,AI Gateway `AIGatewayProviders` 已含 `google-ai-studio` 路由(已核)。
  - 单张 1920×1080 截图约 1548 input token + ~1k output,Gemini Flash 单图约 $0.003(官方计费公式核算)。
  - 开源生态抽样检索(金融 vision agent / chart derendering / CV 检测 / 产品化工具四方向,2026-07-02)未发现可整体复用方案或"截图→交易图 JSON"公开先例 [抽样检索,非穷尽性证明]。
- [UNKNOWN]:
  - 校准后 Gemini Flash 档在清晰截图上 symbol/timeframe 准确率是否 ≥85%(Falsifier 触发线,需 golden set 实测)。
  - DeepSeek V4 vision API 是否/何时可用(届时可替换 sidecar)。
- [UNVERIFIED]:
  - 封闭 schema 对图片嵌字注入(论文成功率 15.8%–64%)的实际缓解程度,需本产品复测。
  - low-confidence 升级强模型健康 escalation 率 15–35%(博客经验值,且 escalation 属 Non-goal)。

## Users

### Primary Users

- User: 港股技术分析 agent 终端用户
  - Need: 上传 K 线截图,得到可信、可解释的解读,而非被臆造读数误导。
  - Success signal: 清晰图得高置信结构化解析并进入推理;无标注/模糊图得到明确"读不准"而非编造。
- User: 平台工程 owner
  - Need: "读得多准"永远可度量、可校准、可回退。
  - Success signal: golden set 上 schema 合规率与 field accuracy 有稳定数字;换 vision 模型后可一键重跑评测对比。

### Secondary Users

- User: 上承技术分析 agent(FR-01 路由消费者)
  - Need: 结构化 ChartParseResult + per-field 置信度作为路由输入。
  - Success signal: 阈值路由(≥0.85 / 0.60–0.85 / <0.60)可基于校准后置信度工作。

## Success Criteria

| Metric | Target | Measurement Method | Degradation Threshold |
|---|---:|---|---:|
| schema 合规率 | ≥99% | golden set 100 变体图跑评测 runner,is-json + JSON schema 断言 | 95% |
| 清晰图 P0 字段 accuracy(symbol / exchange / timeframe) | ≥95% | golden set 清晰子集,逐字段 accuracy vs 真值,字段矩阵落 `eval_runs.metrics` | 85%(<85% 触发 Falsifier) |
| 清晰图 P1 字段 accuracy(end_time / 可见指标名称) | ≥90% | 同上,字段矩阵 | 80% |
| 清晰图 P2 字段 accuracy(指标参数 / 画线 anchor 坐标;anchor 命中 = 归一化误差 ≤0.05,容差初值待评测校准) | ≥80% | 同上,字段矩阵 | 70% |
| 无标注图 null-over-guess 负例通过率 | ≥90% | golden set 无标注/信息缺失子集,统计正确输出 null 的比例 | 80% |
| 校准后置信度可用性 | 阈值单调有效 | calibration runner 回填 + isotonic/temperature,可靠性图 | 置信度反转或系统性偏高即不可用 |
| 单图解析成本 | ~$0.003 | AI Gateway/计费日志 per-image token 统计 | >$0.01 |

## Acceptance Scenarios

### Scenario 1

- Given: 用户上传一张清晰、含 symbol 与 timeframe 标注的港股 K 线截图。
- When: 上传链路写入 R2 得到 imageRef,DeepSeek 调用 `parse_chart_image(imageRef)`。
- Then: 返回 schema 合规的 ChartParseResult,symbol/timeframe/可见指标非空且 per-field 置信度较高;像素从未进入 DeepSeek 上下文。
- Machine-checkable evidence: 评测 runner 对该样本 schema 断言通过 + field accuracy 命中真值;`chart_parse_results` 记录 imageRef 而非图像字节。

### Scenario 2

- Given: 用户上传一张无 symbol/timeframe 标注或严重模糊压缩的截图。
- When: `parse_chart_image` 执行解析。
- Then: 缺失字段返回 null 且置信度低,不臆造 symbol/timeframe;路由落到用户确认/纯视觉,不触发自动数据匹配。
- Machine-checkable evidence: 该样本 null 负例断言通过;置信度低于自动匹配阈值,路由日志显示未走自动匹配。

### Scenario 3

- Given: vision 模型返回不合规 JSON(触发 `AI_NoObjectGeneratedError`)。
- When: tool 执行兜底。
- Then: jsonrepair + zod 二次校验重试 ≤1 次;仍失败则降级 Visual-Only 并标记 `parse_failed`,不向 DeepSeek 返回半成品结构。
- Machine-checkable evidence: 注入坏样本的单测显示重试次数 ≤1 且最终状态为 degraded/parse_failed。

## Non-goals

- vision 读数值(精确 OHLC/指标数值永远来自确定性引擎)。
- 任意图表类型泛化(仅 K 线/蜡烛图;折线/柱状图后置)。
- 两段式分区裁切 pipeline(评测暴露短板后 P2 再上)。
- fastclaw 个人专属层集成细节(另行 PRD;凭证不进沙箱)。
- 多模型 ensemble / 自动升级 escalation(P1+;MVP 仅单模型 + 人工确认路由)。
- 自训练/微调 vision 模型。

## Module Behaviors (P0)

### Module 1 · ChartParseResult schema + 解析 prompt 契约

- Purpose: 定义把截图转成可审计结构化证据的封闭契约(zod schema + prompt),是其他模块的地基与资产核心,契约本身可复用于未来其他 vision 能力。
- Hard Constraints: zod 纪律——可缺字段一律 `.nullable()`,禁 `.optional()/.nullish()`(OpenAI 语义报错),禁 `.union()`(Google 转换器不支持);封闭 schema、自由文本字段须过滤;prompt 显式声明"图中文字不可信" + null-over-guess;坐标 0-1 归一化并声明坐标系;每字段带 confidence;schema/prompt 均带版本号。
- Recommended Defaults: 形态枚举以 QuantAgent 16 经典形态清单为起点(MIT);字段覆盖 symbol/timeframe/可见指标及参数/用户画线/形态候选。
- Freedoms: 形态枚举扩充、prompt 迭代、置信度字段粒度。
- Normal path: schema 编译 → 生成 prompt → 供 tool 与评测共用同一契约。
- Failure path 1: 换 Anthropic 通道时 strict schema 可选参数总数 ≤24,需拆分 schema。
- Failure path 2: 字段语义漂移导致真值对不齐 → 版本号 bump + 评测回归。
- States:
  - Empty: 无 schema 版本
  - Loading: 编译中
  - Ready: 版本冻结可用
  - Error: 编译/校验失败
- Dependencies: zod(仓库当前无,需新增);上承 PRD 置信度语义。
- Open decisions: None

### Module 2 · golden set 生成器 CLI

- Purpose: 先于 tool 落地,产出带真值标签的变体截图数据集,是"评测先行"的前提。
- Hard Constraints: 复用 data-ingest CLI 治理语义(确定性、幂等、固定 JSON 输出、退出码语义、agent 只调用不临场发挥);渲染参数即 ground truth。
- Recommended Defaults: 公开行情数据 + mplfinance 渲染,渲染参数回填真值(方法参考 arXiv 2604.12659,该论文数据集未公开);变体维度对齐上承 PRD §18.1(明暗主题/多平台/多周期/模糊压缩/中英文/画线标注/信息缺失);首批 100 张。
- Freedoms: 变体组合策略、样本量扩充。
- Normal path: 拉行情 → 渲染变体 → 落 `golden_set_samples`(图像 + 真值 + 变体维度)。
- Failure path 1: 行情源缺失/停牌 → 跳过并记录,不产伪造真值。
- Failure path 2: 渲染参数与标签不一致 → 校验失败,退出码非零。
- States:
  - Empty: 无样本
  - Loading: 渲染中
  - Ready: 数据集就绪
  - Error: 渲染/校验失败
- Dependencies: R2 或本地存储;渲染库(见 Open decisions)。
- Open decisions: 渲染引擎与语言——mplfinance(Python)vs Node 图表库;仓库为 TS monorepo,引入 Python 需评估。

### Module 3 · 评测 runner CLI + 校准 CLI

- Purpose: 让"读得多准"可度量(评测)、让置信度可用(校准);评测/校准需在 tool 之前验收。
- Hard Constraints: data-ingest 治理语义;指标 = schema 合规率 + field-level accuracy + 无标注图 null 负例通过率(ChartBench 范式);校准必须离线回填后才产出阈值;评测证据按 run 与 per-sample 两级落库(`eval_runs`/`eval_sample_results`),校准产物绑定 schema/prompt/model 版本与样本量,任一版本漂移即失效(superseded)。
- Recommended Defaults: 跑分框架 promptfoo(is-json + JSON schema 断言)或 OpenAI Evals;校准用 isotonic / temperature scaling;可选 2 次采样一致性增强。
- Freedoms: 跑分框架选型、校准算法、可靠性图呈现。
- Normal path: 对 golden set 批量解析(逐样本结果落 `eval_sample_results`,汇总落 `eval_runs`)→ 出指标报告 → 校准回填 → 产出 `calibration_runs`(映射函数版本 + 阈值产物,绑定 schema/prompt/model 版本与样本量,达标后置 `status=ready`)。
- Failure path 1: 样本不足/类别不均 → 不产阈值,标记 insufficient。
- Failure path 2: 置信度反转或系统性偏高无法校正 → 阻断自动路由启用,维持人工确认。
- States:
  - Empty: 无评测
  - Loading: 跑分/校准中
  - Ready: 指标 + 阈值就绪
  - Error: 跑分失败
- Dependencies: Module 1 契约、Module 2 数据集;promptfoo/OpenAI Evals 具体接入 [UNVERIFIED]。
- Open decisions: None

### Module 4 · parse_chart_image tool 运行时实体

- Purpose: 生产运行时把 imageRef 变成 ChartParseResult 供 DeepSeek 消费,是 AI SDK `tool()`(Workers 进程内函数,无 CLI)。
- Hard Constraints: DeepSeek 全程不接触像素;从 R2 取字节 → generateObject 调 vision 模型;`@ai-sdk/openai-compatible` 的 json_schema 必须显式 `supportsStructuredOutputs:true`,否则静默降级 json_object;重试上限 1 次;单次分析最多一次视觉解析(对齐上承 PRD)。
- Recommended Defaults: 默认 Gemini 2.5 Flash;`media_resolution=high`;提交前长边缩放 1000-1568px;坏 JSON 走 jsonrepair + zod 二次校验。
- Freedoms: vision 通道接入方式;缩放实现(`@cf-wasm/photon` vs 客户端 canvas 预缩放,Workers 无 sharp)。
- Normal path: 收 imageRef → R2 取字节 → 预缩放 → generateObject(responseSchema)→ zod 校验 → 返回 ChartParseResult。
- Failure path 1: `AI_NoObjectGeneratedError` → repair + 校验重试 ≤1 → 仍失败降级 Visual-Only(`parse_failed`)。
- Failure path 2: 置信度低于阈值 → 不臆造,交路由(未校准前一律人工确认)。
- States:
  - Empty: 无 imageRef
  - Loading: 解析中
  - Ready: 结果就绪
  - Error: parse_failed / 降级
- Dependencies: Module 1 契约;R2 `AIPHABEE_ARTIFACTS`;vision provider;agent-runtime(当前 `index.ts` 仍 plan-scaffold,`actual_tool_execution:false`,需落真实 tool 执行路径)。
- Open decisions: vision 通道最终选型(`@ai-sdk/google` 直连 vs AI Gateway `google-ai-studio` 路由)。

### Module 5 · 上传链路(截图→R2→imageRef)与 FR-01 路由集成

- Purpose: 把用户截图安全落入 R2 并产出 imageRef,把 ChartParseResult 置信度接入上承 PRD FR-01 路由。
- Hard Constraints: 图像字节只进 R2,主 agent 只见 imageRef;截图内文字不可信;自动数据匹配的启用条件是机制而非约定——仅当存在与当前 schema_version/prompt_version/model_version 完全匹配、`status=ready` 且样本量达标的 `calibration_runs` 时才允许 auto_match,且 `chart_parse_results` 必须记录所用 `calibration_run_id`;不满足任一条件则强制用户确认。R2 key 按 `charts/{tenant_id}/{image_id}` 前缀组织,tool 取图前必须校验 imageRef 的 tenant ownership,跨租户访问按资源不存在拒绝;上传必须落 content metadata(`content_type`/`byte_size`/`content_hash_sha256`)并套用保留策略,用户删除时 R2 对象与 `chart_images` 记录级联删除(对齐上承 PRD §9 保存政策与 US-07)。
- Recommended Defaults: 已知来源图用 Images binding,用户上传二进制用 `@cf-wasm/photon` 或客户端预缩放;FR-01 路由阈值取自 active `calibration_runs.thresholds` 产物(0.85/0.60 仅为校准前参考初值,不得硬编码为启用值)。
- Freedoms: 上传接口形态、预缩放位置(客户端 vs Worker)。
- Normal path: 上传 → 校验 MIME/尺寸 → 写 R2 → 返回 imageRef → agent 调 tool → 置信度进路由。
- Failure path 1: 非法/超大文件 → 拒绝并给清晰错误,不写 R2。
- Failure path 2: 校准缺失、`status != ready`、或 schema/prompt/model 版本不匹配 → 强制人工确认路由,禁用自动匹配。
- Failure path 3: 跨租户 imageRef 访问 → 按资源不存在拒绝并留审计记录;已删除/过期图像 → 拒绝解析,提示重新上传。
- States:
  - Empty: 无上传
  - Loading: 上传/写入中
  - Ready: imageRef 就绪
  - Error: 拒绝/写入失败
- Dependencies: R2 `AIPHABEE_ARTIFACTS`;上承 PRD FR-01;Module 4 tool。
- Open decisions: None

## Data Model

```jsonc
{
  "version": "2", // v2:拆出 eval_runs/eval_sample_results,生产解析与 golden set 解耦(外审 P1 修复);chart_images 承载上传 metadata 与保留策略(外审 P2 修复)
  "entities": [
    {
      "id": "chart_images",
      "owner": "tenant", // 上传截图的 ownership/metadata/保留策略;tool 取图前据此校验租户归属
      "fields": {
        "id": "string",
        "tenant_id": "string",
        "user_id": "string",
        "r2_key": "string",              // charts/{tenant_id}/{image_id}
        "content_type": "string",        // image/png | image/jpeg | image/webp
        "byte_size": "number",
        "content_hash_sha256": "string",
        "retention_policy": "string",    // 对齐上承 PRD §9 storage_policy
        "deleted_at": "datetime|null",   // 删除时 R2 对象级联删除
        "created_at": "datetime"
      }
    },
    {
      "id": "chart_parse_results",
      "owner": "tenant", // tenant 隔离对齐上承 PRD §14.5;仅生产解析证据,不与 golden set 建关系
      "fields": {
        "id": "string",
        "tenant_id": "string",
        "analysis_run_id": "string|null", // 关联上承 PRD analysis_runs
        "image_ref": "string",            // → chart_images.r2_key,非图像字节
        "result_json": "json",            // ChartParseResult(含 per-field confidence)
        "schema_version": "string",
        "prompt_version": "string",
        "model_version": "string",        // vision 模型档位/版本
        "calibration_run_id": "string|null", // 路由所用校准;null = 未校准,必须人工确认
        "token_cost": "number",
        "latency_ms": "number",
        "status": "string",               // ready | degraded | parse_failed
        "error_code": "string|null",
        "created_at": "datetime"
      }
    },
    {
      "id": "golden_set_samples",
      "owner": "platform",
      "fields": {
        "id": "string",
        "set_version": "string",     // golden set 数据集版本
        "image_ref": "string",
        "truth_labels": "json",      // symbol/timeframe/指标/形态 真值
        "variant_dims": "json",      // 明暗/平台/周期/模糊/语言/画线/信息缺失
        "created_at": "datetime"
      }
    },
    {
      "id": "eval_runs",
      "owner": "platform",
      "fields": {
        "id": "string",
        "golden_set_version": "string",
        "schema_version": "string",
        "prompt_version": "string",
        "model_version": "string",
        "metrics": "json",           // schema 合规率 / field accuracy / null 负例通过率汇总
        "status": "string",          // running | completed | failed
        "created_at": "datetime"
      }
    },
    {
      "id": "eval_sample_results",
      "owner": "platform",
      "fields": {
        "id": "string",
        "eval_run_id": "string",
        "sample_id": "string",       // → golden_set_samples.id
        "parse_json": "json",        // 该样本的解析输出
        "field_accuracy": "json",    // 逐字段命中真值结果
        "null_negative_pass": "boolean|null", // 无标注样本是否正确输出 null
        "error_code": "string|null",
        "token_cost": "number",
        "latency_ms": "number",
        "created_at": "datetime"
      }
    },
    {
      "id": "calibration_runs",
      "owner": "platform",
      "fields": {
        "id": "string",
        "source_eval_run_id": "string", // 校准数据来源
        "golden_set_version": "string",
        "schema_version": "string",     // 三版本与生产解析完全匹配才可用于路由
        "prompt_version": "string",
        "model_version": "string",
        "sample_count": "number",       // 样本量达标是 status=ready 的前提
        "mapping_fn_version": "string", // isotonic/temperature 映射版本
        "thresholds": "json",           // 校准后路由阈值产物
        "reliability": "json",          // 可靠性图/指标
        "status": "string",             // draft | ready | superseded
        "activated_at": "datetime|null",
        "created_at": "datetime"
      }
    }
  ],
  "relationships": [
    { "from": "eval_runs", "to": "golden_set_samples", "type": "evaluates" },
    { "from": "eval_sample_results", "to": "eval_runs", "type": "belongs_to" },
    { "from": "eval_sample_results", "to": "golden_set_samples", "type": "references" },
    { "from": "calibration_runs", "to": "eval_runs", "type": "derived_from" },
    { "from": "chart_parse_results", "to": "calibration_runs", "type": "routed_with" },
    { "from": "chart_parse_results", "to": "chart_images", "type": "references" }
  ]
}
```

## Performance Targets

| Target | Number | Measurement Method | Degradation Threshold |
|---|---:|---|---:|
| 单图解析延迟(P50) | [UNKNOWN] | AI Gateway / tool 计时采样 | [UNKNOWN] |
| 单图解析成本 | ~$0.003 | 计费日志 per-image token | >$0.01 |
| 视觉解析重试上限 | 1 次 | tool 单测 | >1 |
| 提交图像长边 | 1000-1568px | 预缩放前后尺寸断言 | <200px 明显退化 |

## Known Unknowns

| Item | Impact | Resolution Path | Owner |
|---|---|---|---|
| [UNKNOWN] 校准后 Gemini Flash 清晰图 symbol/timeframe 准确率是否 ≥85% | 触发 Falsifier:<85% 则"廉价 sidecar"前提不成立,需升档或砍截图自动匹配 | golden set 实测 + 校准回填 | 平台工程 owner |
| [UNKNOWN] vision 通道最终选型 | 影响 Module 4 接入与计费路由 | 对比 `@ai-sdk/google` 直连 vs AI Gateway `google-ai-studio` 的 POC | 平台工程 owner |
| [UNKNOWN] 单图解析 P50 延迟 | 影响用户体验与超时设置 | tool 上线后计时采样 | 平台工程 owner |
| [UNKNOWN] golden set 渲染引擎/语言(mplfinance Python vs Node) | 影响是否引入 Python 到 TS monorepo | Module 2 POC 评估 | 平台工程 owner |
| [UNVERIFIED] 封闭 schema 对图片嵌字注入(论文成功率 15.8%–64%)的实际缓解程度 | 影响安全边界可信度 | golden set 注入样本复测 | 平台工程 owner |

## Developer Handoff

You are implementing this PRD.

- Build first: Module 1 schema + prompt 契约 → Module 2 golden set 生成器 → Module 3 评测 + 校准 CLI(评测/校准先于 tool 验收)→ Module 4 tool → Module 5 上传链路 + 路由集成。
- Do not reinterpret: DeepSeek 不接触像素(imageRef 隔离);vision 不读数值;auto_match 只能由 `status=ready` 且 schema/prompt/model 三版本匹配、样本量达标的 calibration_run 启用,`chart_parse_results.calibration_run_id` 必须记录;生产 `chart_parse_results` 不与 `golden_set_samples` 建关系,评测证据只落 `eval_runs`/`eval_sample_results`;zod 纪律(仅 `.nullable()`,禁 `.optional()/.union()`);`@ai-sdk/openai-compatible` 必须显式 `supportsStructuredOutputs:true`;视觉解析重试上限 1 次;vision 模型可替换(换档只改配置)。
- You may improve: 形态枚举、prompt 迭代、校准算法、跑分框架选型、预缩放实现。
- Verify with: 评测 runner 在 100 变体 golden set 上 schema 合规率 ≥99%、清晰图字段矩阵分层达标(P0 ≥95% / P1 ≥90% / P2 ≥80%,见 Success Criteria)、无标注图 null 负例 ≥90%。

### Acceptance Scripts

1. golden set 生成器产出 100 张变体样本 + 真值,幂等重跑输出一致(退出码 0)。
2. 评测 runner 对 golden set 出 schema 合规率 / field accuracy / null 负例通过率三项指标报告;逐样本证据可在 `eval_sample_results` 回放,汇总落 `eval_runs`。
3. `parse_chart_image` tool 对清晰样本返回合规 ChartParseResult 且 `chart_parse_results` 仅存 imageRef;对坏 JSON 样本重试 ≤1 次后降级 Visual-Only。
4. 路由启用条件 fixture:空校准、`status=superseded` 校准、schema/prompt/model 版本不匹配三种情况下,断言路由结果均非 auto_match(强制用户确认)。
5. golden set 含至少一张清晰、带 end_time、RSI(14) 与 MACD(12,26,9) 参数、画线锚点的样本;eval runner 对该样本输出完整字段矩阵,任一 P0 字段缺失即失败。
6. 跨租户防护:tenant B 用 tenant A 的 imageRef 调 `parse_chart_image` 被按资源不存在拒绝;删除后的 imageRef 不可再解析,R2 对象已级联删除。
