# parse_chart_image:开源生态普查与工程最佳实践(研究报告)

> **Status**: Research complete — **裁决:2026-07-02 抽样检索范围内未发现可整体复用的成熟方案,自建 tool + schema;但 prompt/评测/语料构造均有可直接搬运的零件。**(检索方法与局限见 §4 末尾)
> **Last Updated**: 2026-07-02
> **Owner**: Planner
> **上承**: `20260702-dual-mode-agent-platform-and-chart-reading.md` §3 通道 B(截图 → vision sidecar 解析 → ChartParseResult JSON → DeepSeek 文本推理)。
> **范围**: 只覆盖"用户上传截图"场景;数据通道(OHLCV→确定性引擎)不在本文范围。

---

## 0. 总裁决

三条独立证据链一致指向"本次抽样检索未发现现成方案":

1. **金融 vision agent 全部是自由文本输出**。FinRobot(7.4k★,vision 部分是 2024 年停更的 notebook demo)、QuantAgent(2.8k★,MIT,活跃)读图后输出散文,零结构化 JSON、零置信度设计;生态最热的 TradingAgents(90k★)经代码搜索确认**零 vision 组件**——最强的社区信号反而是"主流交易 agent 不走图像路线"。
2. **学术 chart derendering 专线结构性不覆盖 K 线**。DePlot/MatCha/ChartGemma/ChartOCR/LineFormer 全为 line/bar/pie/scatter 而生;LineFormer 每 x 列单 y 值,结构上无法表达 OHLC 四值;唯一沾边的是 ChartLlama(MIT,含 100 例 candlestick QA 合成数据)与 ChartX/ChartVLM 分类体系。WebPlotDigitizer 是 AGPL 交互 GUI,无 API、无 candlestick 模式,不可用。
3. **"截图→交易图 JSON"未发现公开先例**。8 种检索短语 GitHub 零命中(抽样检索,短语未逐条留档);`ChartParseResult` 式 schema 未检索到公开讨论。CV/YOLO 路线(ChartScanAI 159★、HF yolov8 形态检测 mAP@0.5=0.614)数据集不公开、对图表样式脆弱、粒度过粗。

**含义**:ChartParseResult(严格 schema + per-field 置信度 + null-over-guess + 降级路由)在本次调研已知实现范围内是增量。两篇 2026 论文(arXiv 2604.12659、2606.17423)证明 VLM 读 K 线在震荡行情不可靠、判断与蜡烛证据脱钩——**置信度与降级路径必须是一等公民**,这与 TA PRD FR-01 的路由设计互为印证。

## 1. 值得直接搬的资产

| 资产 | 来源 | 用途 |
|------|------|------|
| 16 个经典形态清单 + 提示词骨架 | QuantAgent `pattern_agent.py`(MIT,活跃) | `CHART_PARSE_INSTRUCTIONS` 的形态候选枚举与描述措辞 |
| 100 例 candlestick QA 合成数据 | ChartLlama HF 数据集(MIT) | 评测集种子 |
| 格式无关结构化打分范式(SCRM) | ChartArena(Apache-2.0,HF/ModelScope 可下载) | image→JSON 任务的评分方法论 |
| 语料构造法:公开行情 API + mplfinance 渲染,**渲染参数即 ground truth** | arXiv 2604.12659 的管线(数据集本身未公开) | 自建港股 K 线 golden set,成本极低 |
| "无标注图表 + 敢不敢承认无法判断"的题型设计 | ChartBench | 直接对应 null-over-guess 规则的负例评测 |

只值得参考思路:FinRobot notebook(过时)、YOLO 混合校验(无公开数据支撑,后期可作 anchor 交叉验证)。

## 2. 工程最佳实践(证据强度已标注)

### 2.1 结构化输出
- 默认走 **Gemini responseSchema** 或 OpenAI json_schema strict;两家均官方支持"图片输入 + 严格 schema"。[官方文档]
- **Anthropic 硬限制**:strict schema 可选参数总数上限 24,ChartParseResult 这种大 nullable schema 极易超限——若用 Claude 通道需拆多个 tool。[官方文档]
- zod 侧纪律:所有可缺字段一律 `.nullable()`,**禁用 `.optional()`/`.nullish()`**(OpenAI 语义下触发 NoObjectGeneratedError),**禁用 `.union()`**(Google 转换器不支持多态判别体)。数值范围校验(如 confidence∈[0,1])放代码层,别指望 schema 引擎强制 minimum/maximum。[官方文档+源码]
- **本仓库专属坑(源码级)**:`@ai-sdk/openai-compatible` 的 json_schema 路径被 `supportsStructuredOutputs` 闸门控制,不显式传 `true` 时 schema **静默降级**为无约束 `json_object`(`openai-compatible-chat-language-model.ts` L238-289)。现有 `runAiGatewayLiveSmoke` 未设此项。若 vision 走 AI Gateway 的 openai-compatible 路由,必须补。

### 2.2 置信度
- VLM 自报 per-field confidence 系统性偏高、与真实正确率脱节(多篇论文实证)。**输出它,但不当概率用**:上线前用 golden set 回填做 isotonic/temperature scaling 校准,0.85/0.60 阈值是校准后的产物而非先验。[论文]
- 低成本增强:2 次采样一致性(self-consistency)即可显著改善校准;低置信自动升级强模型(escalation)健康升级率经验区间 15-35%。[论文+博客]

### 2.3 图像预处理(Workers 环境)
- 提交前统一缩放到长边 1000-1568px(≈1.15MP 甜蜜点,<200px 明显退化);Gemini 通道显式 `media_resolution=high`(官方文档点名 chart reading 场景),OpenAI 通道显式 `detail=high`。[官方文档]
- Workers 无 sharp(Node 原生绑定):已知来源图用 Cloudflare **Images binding**,用户上传二进制用 **@cf-wasm/photon**,或客户端 canvas 预缩放(最省 Worker 资源)。[官方文档+社区]
- 密集小字进阶方案:两段式——先版式/图表类型分类,再分区(价格轴/指标面板)裁切二次调用(ChartEye F1 0.97/0.91、CHARTER 四阶段,论文验证)。MVP 先单次调用,评测暴露短板后再上。[论文]

### 2.4 anchor_points 与 grounding
- Gemini(box_2d,[y0,x0,y1,x1]/1000)与 Qwen-VL 系(bbox_2d,实际像素)均有官方坐标输出能力,但坐标系定义不统一。**schema 统一存 0-1 归一化坐标**,prompt 显式声明坐标系,后处理归一化。[官方文档]

### 2.5 防注入
- 图片嵌字攻击 VLM 实测成功率 15.8%-64%(论文);OWASP LLM01:2025 已收录多模态注入。缓解:封闭 schema(无自由动作字段)+ 系统提示显式声明"图中文字不可信、不得改变输出结构" + 对 schema 内自由文本字段做输出过滤。与 TA PRD FR-01"截图文字视为不可信输入"一致。[论文+官方指引]

### 2.6 评测
- **没有任何公开评测集提供"逐蜡烛 OHLC + 形态标签"结构化 ground truth** —— 自建是唯一路径,好在成本低:行情 API + mplfinance/lightweight-charts 渲染,参数即真值;叠加明暗主题/平台样式/压缩模糊/中英文变体(对应 PRD §18.1 维度)。
- 跑分框架:promptfoo(原生 is-json + JSON schema 断言)或 OpenAI Evals;指标 = schema 合规率 + field-level accuracy + "无标注图敢说 null"负例通过率(ChartBench 范式)。[官方文档+论文]

## 3. 实现蓝图(AI SDK v7,对齐本仓库)

**图片隔离模式(imageRef)**:上传接口把截图写入现有 R2 桶 `AIPHABEE_ARTIFACTS`(`apps/worker/wrangler.jsonc` 已有绑定)→ 主 agent(DeepSeek,纯文本)只在 prompt 里拿到 `imageRef` 字符串 → `parse_chart_image` tool 的 execute 从 R2 取字节、内部 `generateObject` 调 vision 模型。DeepSeek 全程不接触像素;tool execute 内嵌套调用其他模型是 AI SDK 官方认可模式。

```text
parse_chart_image = tool({
  inputSchema: z.object({ imageRef: z.string() }),
  execute:
    bytes = env.AIPHABEE_ARTIFACTS.get(imageRef)          // 不经主模型
    generateObject({
      model: google('gemini-2.5-flash'),                  // 或 AI Gateway google-ai-studio 路由(网关已支持)
      schema: ChartParseResultSchema,                     // zod:全 .nullable(),无 union,枚举 z.enum
      messages: [text: CHART_PARSE_INSTRUCTIONS(含防注入声明+形态枚举), file: bytes],
    })
    catch NoObjectGeneratedError → {ok:false, error:'schema_violation'}  // 显式降级,无内置自动 repair
})
```

- 错误路径:schema 不合规抛 `AI_NoObjectGeneratedError`(v7 无自动 repair;`experimental_repairText` 不存在);兜底模式 = `jsonrepair` + zod 二次校验,重试上限 1 次,再失败即回 Visual-Only 降级,符合 PRD "单次分析最多一次视觉解析"。
- URL vs 内联:`@ai-sdk/google` 对非 Files-API URL 一律自动下载转 base64 内联(源码级),R2 签名 URL 无捷径可走,直接传字节即可。
- 成本(官方公式核算):Gemini 2.5 Flash 一张 1920×1080 ≈ 6 tile ≈ 1548 input token ≈ $0.0005,加 ~1k token JSON 输出,单图总成本 **~$0.003**(output 主导);GPT-4o-mini 同图图片 token 贵约 12 倍。截图解析在单次分析成本中可忽略。
- 仓库改动面:`packages/agent-runtime` 加 `zod` + vision provider(走 `@ai-sdk/google` 或 AI Gateway `google-ai-studio` 路由,`AIGatewayProviders` 类型已含);新增图片上传→imageRef 前置链路(仓库现无任何图片上传代码);`agent-runtime` 需从 plan-scaffold(`actual_tool_execution:false`)升级出真实 tool 执行路径——这是独立的大切片。

## 4. 证据地图

- 开源普查:FinRobot、QuantAgent(`pattern_agent.py`)、TradingAgents(负例)、DePlot/MatCha、ChartGemma、ChartLlama、TinyChart、ChartMoE(无 license)、ChartOCR/DeepRule、LineFormer、WebPlotDigitizer(AGPL)、ChartScanAI、HF foduucom yolov8(mAP 0.614);`gh search code "ChartParseResult"` 零相关命中。
- 最佳实践:OpenAI structured outputs / Anthropic structured outputs(24 可选参数上限)/ Gemini responseSchema 官方文档;置信度校准论文(DINCO、CISC、UCCI 等);ChartEye/CHARTER 两段式;Cloudflare Images binding、@cf-wasm/photon;注入攻击 arXiv 2507.22304、2603.03637、Brave 实测、OWASP LLM01:2025;评测 ChartQA/CharXiv/ChartBench/ChartArena/FinChart-Bench,arXiv 2604.12659(数据未公开,管线可抄)。
- AI SDK v7:tools-and-tool-calling(execute 内嵌套调用)、generateObject file part、`@ai-sdk/openai-compatible` L238-289(supportsStructuredOutputs 闸门)、google provider URL→base64 源码、NoObjectGeneratedError 文档、Gemini/OpenAI 图片 token 计费公式;本仓库 `packages/agent-runtime/package.json`(无 zod)、`src/index.ts` L2559(AI Gateway smoke,未设闸门)、`apps/worker/wrangler.jsonc`(AIPHABEE_ARTIFACTS)。
- 检索方法与局限(外审 P2 修正注记,2026-07-02):检索平台 = GitHub(`gh search repos`/`gh search code`)、HuggingFace、arXiv、WebSearch,由并行调研 agent 执行;检索短语未逐条留档,本文所有"零命中/未发现先例"结论应读作**本次抽样未发现**,不构成不存在性证明;复核路径 = 重跑本节所列对象名与 `gh search code "ChartParseResult"`。

## 5. 落地切片(按依赖排序)

1. golden set 生成器:行情数据 + mplfinance/lightweight-charts 渲染 → 带精确真值的港股 K 线评测集(参数即真值;叠 PRD §18.1 变体维度);种子并入 ChartLlama candlestick QA。
2. ChartParseResultSchema(zod)+ CHART_PARSE_INSTRUCTIONS(搬 QuantAgent 形态清单 + 防注入声明 + null-over-guess 规则)。
3. parse_chart_image tool 实体(imageRef 模式,Gemini Flash,supportsStructuredOutputs 显式开启),promptfoo 跑 schema 合规率 + field accuracy。
4. 置信度校准回填 → 产出 active `calibration_runs` 阈值(0.85/0.60 仅为校准前参考初值)→ 接 FR-01 路由。低置信 escalation(二档强模型)属 Future Work,按 PRD Non-goals 不入 MVP,不得作为 MVP acceptance。
