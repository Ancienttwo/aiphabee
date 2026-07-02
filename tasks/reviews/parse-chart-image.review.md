# Review: parse_chart_image PRD 与配套研究文档(Codex 跨模型外审)

> **External Acceptance**: fail (2×P1 blockers)
> **External Reviewer**: Codex (gpt-5.5, reasoning effort high, read-only sandbox)
> **External Source**: codex-review
> **External Started**: 2026-07-02T18:35:39+0800
> **External Completed**: 2026-07-02T18:40:28+0800
> **Review Rubric Version**: 1
> **Reviewed Diff Fingerprint**: sha256:0331dd59d91ef962c8cd2f9ec72fb05e45b9e7d45482ac441e646aa748bd92e9
> **Reviewed Scope**: branch+staged+unstaged+untracked

主评审对象:`plans/prds/20260702-1830-parse-chart-image.prd.md`、`docs/researches/20260702-dual-mode-agent-platform-and-chart-reading.md`、`docs/researches/20260702-parse-chart-image-oss-and-best-practices.md`。

## Findings(Codex 原文,未删改)

- [P1] 校准阈值缺少可审计启用条件 — plans/prds/20260702-1830-parse-chart-image.prd.md:193
  Impact: 实现者可能把 `0.85/0.60` 直接硬编码成自动匹配阈值,绕过"未校准前不启用自动路由"的安全边界,导致截图误识别后自动查询错误标的。
  Evidence: 本 PRD 同时要求"置信度未离线校准前不启用自动路由"(line 33/192),又在 Module 5 推荐直接接入 FR-01 阈值(line 193);`calibration_runs` 只有 `thresholds/reliability`,没有 `status`、`schema_version`、`prompt_version`、`model_version`、样本量、active 标记或 `chart_parse_results.calibration_run_id`。
  Smallest safe fix: 明确路由条件:只有同一 schema/prompt/model 的 `calibration_runs.status=ready` 且样本量达标时才允许自动匹配;否则强制用户确认。
  Regression test: 构造空校准、过期校准、模型版本不匹配三种 fixture,断言路由结果都不是 `auto_match`。

- [P1] 评测数据模型把生产解析结果和 golden set 关系建错 — plans/prds/20260702-1830-parse-chart-image.prd.md:253
  Impact: 无法从 schema 回放"golden set 批量解析 → 指标报告 → 校准回填"的链路,生产用户截图还会被误建成 `evaluated_against golden_set_samples`,实现时容易丢失 per-sample eval 证据。
  Evidence: Module 3 要求批量解析并产出校准(line 161),但 Data Model 只有 `chart_parse_results`、`golden_set_samples`、`calibration_runs` 三表;没有 `eval_runs/eval_sample_results`,也没有每个样本的 field accuracy、null-negative 结果、schema/prompt/model 版本、错误码或 calibration 绑定。
  Smallest safe fix: 拆出 `eval_runs` 和 `eval_sample_results`;生产 `chart_parse_results` 只关联 `analysis_run_id`/`calibration_run_id`,golden set 解析尝试进入 eval 表。
  Regression test: 用一个 golden sample fixture 跑出 eval result、汇总 metric、生成 calibration run;再验证生产 parse result 不需要 golden sample FK 也能记录路由依据。

- [P2] 验收指标没有覆盖父 PRD FR-01 的关键字段 — plans/prds/20260702-1830-parse-chart-image.prd.md:82
  Impact: 实现可以只做到 symbol/timeframe 准确就通过验收,却没有验证 `end_time`、指标名称、指标参数和坐标锚点;后续 OHLCV 覆盖匹配和 Evidence JSON 对齐会不可靠。
  Evidence: 父 PRD FR-01 要求分别给出 symbol、timeframe、end_time、指标名称和参数置信度;新 PRD Success Criteria 只明确 `symbol/timeframe field accuracy`,Acceptance Scripts 也只要求三项总指标报告。
  Smallest safe fix: 把 field-level accuracy 展开成字段矩阵:symbol、exchange、timeframe、end_time、visible_indicator.name、visible_indicator.params、anchor_points/bbox,并为 P0 字段设最低阈值或明确降级规则。
  Regression test: golden set 加一张清晰含 end_time、RSI(14)、MACD 参数和画线锚点的截图;任一 P0 字段缺失时 eval runner 失败。

- [P2] 截图安全验收只验证 imageRef,没有覆盖 R2 访问与保留策略 — plans/prds/20260702-1830-parse-chart-image.prd.md:213
  Impact: 仅存 `tenant_id + image_ref` 不足以防止跨租户 imageRef 猜测、截图长期残留、错误 MIME/尺寸绕过或删除请求漏删 R2 对象。
  Evidence: Data Model 的 `chart_parse_results` 没有 `user_id/analysis_run_id/content_type/byte_size/content_hash/deleted_at/retention_policy/error_code`;上传 failure path 只写"非法/超大文件拒绝",未规定 tool 取 R2 前必须校验 tenant ownership。
  Smallest safe fix: 定义 R2 key 前缀、tenant/run ownership 校验、content metadata、retention/deletion 字段和跨租户拒绝语义。
  Regression test: 用 tenant A 的 imageRef 由 tenant B 调 `parse_chart_image` 必须 403;删除 analysis run 后 R2 key 不可读。

- [P2] "社区零先例"被写成已核结论但缺可复验证据 — docs/researches/20260702-parse-chart-image-oss-and-best-practices.md:17
  Impact: PRD 会把产品差异化建立在不可复核的 novelty claim 上,后续评审无法判断是"无公开方案"还是"检索样本未命中"。
  Evidence: 文档写"8 种检索短语 GitHub 零命中""截图→交易图 JSON 零先例",PRD 又写"社区零先例(已核)";但 evidence map 只列对象名,没有查询语句、日期、链接、命中页或 license 快照。
  Smallest safe fix: 增加 research appendix:每条查询的日期、平台、query、结果链接/截图摘要;或把措辞降级为"本次抽样未发现"。
  Regression test: 文档 lint 检查 `零先例/已核/confirmed` 类断言必须引用 appendix entry。

- [P3] MVP non-goal 仍在落地切片里漏出 escalation — docs/researches/20260702-parse-chart-image-oss-and-best-practices.md:94
  Impact: 实现者可能把低置信强模型升级做进 MVP,扩大成本、路由和测试面,和 PRD 的单模型 MVP 边界冲突。
  Evidence: PRD Non-goals 明确"多模型 ensemble / 自动升级 escalation(P1+;MVP 仅单模型 + 人工确认路由)";研究报告落地切片第 4 步仍写"低置信 escalation(可选二档强模型)"。
  Smallest safe fix: 从 P0/P2 落地切片删除 escalation,移到 Future Work,并标注不得作为 MVP acceptance。
  Regression test: PRD checker 对 MVP scope 中出现 `escalation/二档强模型/ensemble` 报错,除非章节为 Future Work。

- [P3] untracked runtime job state 不应进入 reviewable scope — runtime/scrapy-jobs/cr_hkex_news_20260701/requests.queue/active.json:1
  Impact: 如果这些 Scrapy jobdir/report 工件被提交,会把一次本地 crawl 的 resume/seen 状态带进仓库,后续复现或自动化可能读到过期运行态。
  Evidence: untracked 列表包含 `runtime/scrapy-jobs/.../requests.seen`、`active.json`、`spider.state` 和空的 `runtime/reports/.../documents.jsonl`。
  Smallest safe fix: 从提交范围移除运行态工件;若 runtime 输出是预期本地状态,则加 ignore 规则,只保留显式 fixture 目录。
  Regression test: release/readiness check 增加 `git ls-files --others --exclude-standard runtime/` 必须为空,除非路径在 fixtures allowlist。

Sources used for external fact check: DeepSeek official Create Chat Completion API docs https://api-docs.deepseek.com/api/create-chat-completion and DeepSeek V4 Preview Release note https://api-docs.deepseek.com/news/news260424

## Gate

- P1 blockers: 2(校准启用条件、评测数据模型)→ **FAIL**,PRD 修订后才可置 Approved。
- P2 advisories: 3;P3: 2。
- 附注:Codex 独立复核了 DeepSeek API 文档,未对本方案的"DeepSeek 无图片输入"结论提出异议。

## Fix Log(2026-07-02,用户批准修复 P1)

- [P1] 校准阈值缺少可审计启用条件 → **fixed**:Module 5 Hard Constraints 改为机制化启用条件(schema/prompt/model 三版本匹配 + `status=ready` + 样本量达标才允许 auto_match,`chart_parse_results.calibration_run_id` 强制记录);Recommended Defaults 明确 0.85/0.60 仅为校准前参考初值、不得硬编码;Module 3 增加校准产物版本绑定与 superseded 语义;Acceptance Scripts 新增 #4(空校准/superseded/版本不匹配三 fixture 断言非 auto_match)。
- [P1] 评测数据模型建错 → **fixed**:Data Model 升 v2——拆出 `eval_runs` + `eval_sample_results`;`chart_parse_results` 增 `analysis_run_id`/`calibration_run_id`/`schema_version`/`error_code`,删除 `evaluated_against golden_set_samples` 关系;`calibration_runs` 增 status/三版本/sample_count/source_eval_run_id/activated_at;`golden_set_samples` 增 `set_version`。
- P2×3(FR-01 字段矩阵、R2 访问与保留策略、"零先例"证据附录)与 P3×2(研究文档 escalation 措辞、runtime/ 运行态工件)→ **open**,未在本次批准范围内。
- 注:本次修复改变了工作区 diff,原指纹 `0331dd59…` 对应修复前状态;如需刷新 gate,重跑 codex-review。

## Fix Log 2(2026-07-02,用户批准修复 P2×3)

- [P2] 验收指标未覆盖父 PRD FR-01 关键字段 → **fixed**:Success Criteria 的 field accuracy 展开为三层字段矩阵(P0 symbol/exchange/timeframe ≥95%、P1 end_time/指标名称 ≥90%、P2 指标参数/anchor 坐标 ≥80%,anchor 命中 = 归一化误差 ≤0.05 初值待校准),AI Quick-Read Card 与 Developer Handoff 同步;Acceptance Scripts 新增 #5(含 end_time/RSI(14)/MACD(12,26,9)/画线锚点的回归样本,P0 字段缺失即失败)。
- [P2] R2 访问与保留策略缺失 → **fixed**:Module 5 增加 R2 key 前缀规范(`charts/{tenant_id}/{image_id}`)、tool 取图前 tenant ownership 校验(跨租户按资源不存在拒绝)、content metadata 与保留/级联删除要求(对齐上承 PRD §9/US-07)+ Failure path 3;Data Model 新增 `chart_images` 实体(content_type/byte_size/content_hash_sha256/retention_policy/deleted_at)及 `chart_parse_results → chart_images` 关系;Acceptance Scripts 新增 #6(跨租户拒绝 + 删除后不可解析)。
- [P2] "零先例(已核)"措辞缺可复验证据 → **fixed**:采用降级措辞方案——PRD Problem 与 Feasibility 改为"抽样检索未发现,非穷尽性证明";研究文档 Status/§0/含义句同步降级,§4 证据地图新增"检索方法与局限"注记(平台、日期、短语未留档的局限、复核路径)。
- 剩余 open:P3×2(研究文档落地切片的 escalation 措辞与 PRD Non-goals 冲突;`runtime/` Scrapy 运行态工件不应入库)。
- PRD 状态仍为 Draft,置 Approved 由用户执行;修复后 diff 指纹已再次变化,刷新 gate 需重跑 codex-review。

## Fix Log 3(2026-07-02,用户批准修复 P3×2)

- [P3] 落地切片漏出 escalation → **fixed**:研究文档 §5 第 4 步删除"低置信 escalation(可选二档强模型)"作为切片内容,改注 Future Work、按 PRD Non-goals 不入 MVP、不得作为 MVP acceptance;同一行顺带对齐 P1 修复口径(0.85/0.60 为校准前参考初值,阈值取自 active calibration_runs)。
- [P3] runtime/ 运行态工件 → **fixed**:`.gitignore` 追加 `runtime/`(Scrapy jobdirs/reports/logs 本地运行态);verified: `git ls-files --others --exclude-standard | grep ^runtime/` 为空。评审建议的 release check(untracked runtime/ 必须为空)未实现,ignore 规则已消除其触发条件,如需硬门禁另行切片。
- **外审七条 findings 全部闭环**:2×P1 fixed、3×P2 fixed、2×P3 fixed。PRD 可进入用户审批。
