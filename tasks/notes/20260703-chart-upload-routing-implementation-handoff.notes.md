# Session Handoff: sprint 任务 5 实现——上传链路 + FR-01 路由集成(2026-07-03)

> **Scope**: 任务 4 已验收并提交 PR #21;本文件是任务 5(上传链路 + FR-01 路由集成)实现会话的开工包,sprint 最后一刀。
> **上一份 handoff**: `tasks/notes/20260703-chart-parse-tool-implementation-handoff.notes.md`(任务 4 开工包,执行台账已回写闭环)
> **注意**: 与前四刀相同——**plan 尚未展开**(sprint 行 5 Plan 列 = pending),开工第一步是 `$think` 出 plan。三个本质差异:①这是 backlog 5/5 最后一行,验收后 sprint 整体闭环(Execution Log 收尾属本会话职责);②首个"真实用户面"语义任务(上传/删除/跨租户是终端用户安全边界),但仓库现状无生产级用户鉴权体系(worker 全部是 ≥16 字符 token 门 smoke 路由)——鉴权面切法本身是决策点,勿默认引入完整 auth;③要回头消费任务 4 刚落的注入缝(fetchImage/context.tenant_id/calibration_run_id),不是纯新增。

## Task Overview

Sprint `plans/sprints/20260702-1905-parse-chart-image.sprint.md` backlog 行 5:上传链路 + FR-01 路由集成(PRD Module 5,Script #4/#6)。

验收(sprint 行 5 原文):路由 fixture:空校准、`status=superseded`、schema/prompt/model 版本不匹配三种情况断言路由均非 auto_match;跨租户 fixture:tenant B 用 tenant A 的 imageRef 调 tool 被按资源不存在拒绝;删除后 imageRef 断言不可解析且 R2 对象已删除。

真值源:PRD `plans/prds/20260702-1830-parse-chart-image.prd.md` **Module 5 章节**($think 前先读,Hard Constraints 最密的一节:R2 key `charts/{tenant_id}/{image_id}`、content metadata 三件、保留策略、级联删除、auto_match 启用条件是机制而非约定)+ **上承 PRD** `plans/prds/20260624-stock-technical-analysis-agent-prd.md` §10 FR-01(接收 PNG/JPEG/WEBP、per-field 置信度)与 §9 保存政策(retention/US-07)。阈值 0.85/0.60 是校准前参考初值,**不得硬编码为启用值**,必须从 `calibration_runs.thresholds` 读(PRD Recommended Defaults 明文)。

## 当前状态(2026-07-03 01:10 核实)

- [x] 任务 1(chart-parse 契约):PR #18 已 merge(`a83d0df`)。
- [x] 任务 2(chart-golden-set):PR #19 已 merge(`402e547`)。
- [x] 任务 3(chart-parse-eval):PR #20 已 merge(`1412927`)。
- [x] 任务 4(parse_chart_image tool 运行时):实现+双审+机器验收全绿,**PR #21 已提交** https://github.com/Ancienttwo/aiphabee/pull/21(单提交 `045e980`,base main;CI verify SUCCESS,mergeStateStatus CLEAN,待 merge)。sprint 行 4 已回填。
- [ ] 任务 5 plan:**pending,尚未 $think 展开**。
- [ ] 任务 5 实现:未开工,前置门未过(见 Next Steps 步骤 0)。

## 任务 5 可直接消费的资产面(任务 1-4 交付)

- **任务 4 预留的注入缝(本刀主战场)**:`@aiphabee/agent-runtime/parse-chart-image` 导出面——`ParseChartImageDeps.fetchImage: (imageRef) => Promise<FetchedChartImage | null>` 返回 null 时 executor 已走 `image_not_found` → parse_failed 落审计行,**"按资源不存在拒绝"的 executor 侧语义现成**,tenant ownership 校验只需落在 fetchImage 装配层(查 `chart_images` 归属后再取 R2);`createParseChartImageTool(deps, context)` 的 `context.tenant_id` 来自服务端(prompt injection 改不了);`ChartParseResultRecord.calibration_run_id` 字段已建恒 null,本刀回填其语义(路由所用校准)。
- **worker 先例**:`POST /agent/tools/parse-chart-image/live-smoke` 是三段门(header 403 → env 424 → Bearer 403)+ body 解析 400 + 响应脱敏的完整可抄样本;`RuntimeR2BucketObject`(可选 `arrayBuffer`/`httpMetadata`)已扩展;`createParseChartImageSmokeFetchImage` 是 R2 取图装配先例;`withHyperdrivePostgresClient`(apps/worker/src/index.ts:12453)/`withPlatformRlsReadTransaction`(:12522)是 worker 内 Postgres 读先例。**worker 无任何 multipart/formData 先例**(grep 已核)——上传接口形态是真空区。
- **任务 3 交付**:`aiphabee_core.calibration_runs` 表(status draft/ready/superseded + 三版本 + sample_count 列;`calibration_runs_version_status_idx` 索引正是"三版本+status"匹配查询设计的);`@aiphabee/chart-parse-eval` 导出 calibration 类型与 PgEvalSink 参数化 SQL 先例(注入 queryable 离线断言 SQL 形状的测试套路直接抄)。
- **DB 面**:`chart_parse_results` 已迁移(任务 4,`20260703003000`);`chart_images` 未建,本刀主迁移;全部账本 status=local_contract 未 apply。迁移登记套路已有三轮先例。
- **数据事实**:golden set 清晰子集仅 11 张、null 负例 75 张;真实校准数据尚不存在(`calibration_runs` 空表)——路由 fixture 的三种非 auto_match 情况(空校准/superseded/版本不匹配)恰好不需要真校准数据,fixture 注入即可。

## $think 要收敛的决策点(勿在 handoff 里预设结论)

- **上传接口形态与鉴权切法**:multipart/form-data vs base64 JSON vs 原始二进制 body(worker 零先例);更根本的是鉴权面——仓库无生产用户鉴权体系,上传/删除路由切 token 门 fixture 面先行(生产 auth 后置)还是引入真实 auth?验收三条全是 fixture 断言,注意最小切刀;上传校验(MIME 白名单 PNG/JPEG/WEBP + byte_size 上限)是 Module 5 normal path 必做项。
- **tenant ownership 校验落点与审计**:fetchImage 装配层查 `chart_images` 归属(r2_key 前缀 `charts/{tenant_id}/` 校验 vs 查表校验,或双重)→ 不属 → 返回 null 即按资源不存在拒绝;PRD failure path 3 还要求"留审计记录"——`chart_parse_results` 行 error_code 已是一层,是否另需审计事件由 $think 定。
- **FR-01 路由判定函数形态与落点**:输入(ChartParseResult per-field confidence + 生产三版本)→ 查 calibration(status=ready + 三版本精确匹配 + sample_count 达标)→ 输出三态(auto_match / user_confirm / visual_only);放 agent-runtime 新模块(与 tool 同包,零跨包)还是 chart-parse-eval(校准语义同源)?fixture 注入面 = CalibrationLookup 接口 + 内存实现(三种非 auto_match 情况逐一断言);`calibration_run_id` 回填进 chart_parse_results 行的接线位置。
- **chart_images 表与删除链路语义**:字段照 PRD Data Model v2(tenant_id/user_id/r2_key/content_type/byte_size/content_hash_sha256/retention_policy/deleted_at);`deleted_at` 字段存在暗示 soft delete(行留审计)+ R2 对象 hard delete,但级联顺序与失败中间态(R2 删了行没标/反之)的一致性语义要定;fixture 断言面 = fake bucket 的 delete 调用记录 + 删除后 fetchImage 返回 null。注意迁移禁词:**SQL 注释里写不了裸 delete**,措辞用 removal/cascade 绕(deleted_at 列名本身安全)。
- **预缩放实现(任务 4 顺延切过来的)**:客户端 canvas 约定(worker 只校验不缩放)vs `@cf-wasm/photon`(wasm 进 worker bundle,体积与 Workers 兼容性要评估)vs 本刀只做尺寸/字节校验、缩放实现再后置;PRD Freedoms 明示预缩放位置自由,Performance Target 长边 1000-1568px 的断言面本刀落不落由 $think 定。
- **content_hash_sha256 用途边界**:仅存证(metadata 三件之一)还是兼做上传幂等/去重键?Workers `crypto.subtle.digest` 可用;image_sha256 跨平台一致性是前轮遗留观察,勿过度设计。

## Next Steps(依赖序,逐步执行)

0. **前置门**:PR #21 merge 进 main → 主仓库 `git pull`(工作区脏文件 = sprint + 四份 handoff,与 PR #21 文件清单零重叠,预期无冲突)→ 校验 `git merge-base --is-ancestor 045e980 main` 为真。未过门不得开工。顺手可清三个已 merge 的 worktree(`git worktree remove ../AiphaBee-wt-chart-golden-set ../AiphaBee-wt-chart-parse-eval ../AiphaBee-wt-chart-parse-tool`,最后一个须在 PR #21 merge 后;用户决策面,不强制)。
1. 读 PRD Module 5 + 上承 PRD FR-01/§9 → `$think` 展开 sprint 行 5 为 plan(收敛上面五个决策点)→ `repo-harness run capture-plan --slug <slug> --title <title> --status Approved --artifact-level work-package --promotion-reason worktree_boundary --source waza-think --source-ref "sprint:plans/sprints/20260702-1905-parse-chart-image.sprint.md#上传链路 + FR-01 路由集成(PRD Module 5,Script #4/#6)" --body-file <plan正文> --execute`。
2. 填 contract:allowed_paths ≈ `packages/agent-runtime/`(路由判定/装配缝)+ `apps/worker/`(上传/删除路由)+ `deploy/database/migrations/` + `deploy/database/migrations.contract.json` + 根 `package.json`/lockfile(若加依赖)+ `plans/` + tasks 三件套(视 $think 结论增删,如 packages/chart-parse-eval);exit_criteria 用真实命令(vitest 路径过滤 + fixture 断言命令),**勿用 `tests_pass:`**。
3. TDD:先 RED 再 GREEN;完成后 `/check` 自审 + `codex-review` 外审 → review 按机器格式(见 Gotchas)→ **verify-contract 到 Fulfilled 终态后再取 fingerprint**(见 Gotchas 时序)→ `repo-harness run contract-worktree finish --no-merge --message "feat(...): ..."` → push → PR → 回填 sprint 行 5 + Execution Log + 本 handoff 台账;**backlog 5/5 全 [x] 后做 sprint 闭环收尾**(Execution Log 终行 + sprint 状态处置 + `tasks/current.md` 快照对齐,收尾形态由该会话按 repo-harness 惯例定)。

## Important Context / Gotchas(四轮会话实证累积,新会话直接吃)

- **capture-plan --execute 一步到位**:capture + 开 worktree + plan 随迁 + 契约三件套脚手架全自动;plan 正文先写 /tmp 再 `--body-file`。worktree 是 fresh checkout,**先改 package.json 再一次 `npm install`**(后台跑,省第二次 install)。
- **fingerprint 时序**(两轮实证):`verify-contract` 会翻 contract 的 `Status` 头(预演跑一次会变 Partial,属预期,contract 在 fingerprint 范围内)。正确顺序 = 代码与台账全部冻结 → 写 review(review 文件在 excluded_paths)→ 回填外审段 + Recommendation: pass → `verify-contract --strict` 到 Fulfilled(13/13 量级)→ `repo-harness-hook review-fingerprint --base main --format json` 取终态指纹 → 回写 review **两处**指纹行(header + External Acceptance Advice)→ 复跑 verify 确认幂等。
- **External acceptance gate 机器精确匹配**:review 逐字 `> **External Acceptance**: pass`、`> **External Reviewer**: Codex`、`> **External Source**: codex-review`、`- P1 blockers: none`、header `> **Recommendation**: pass`;另需 `> **Review Rubric Version**: 1`、`> **Reviewed Diff Fingerprint**: sha256:<当轮值>`、`> **Reviewed Scope**: branch+staged+unstaged+untracked`。
- **qa_scores gate**:Scorecard 表 `| Functionality | 9/10 | … |`(第 3 列首个数字 ≥7)。
- **contract-worktree finish 用法**:`finish --no-merge --message "…"`;自动 commit 单提交 + 归档 plan/contract/review/notes/todo 到 `plans/archive/`+`tasks/archive/`。主仓库 dirty 时必须 `--no-merge` 走 PR。
- **codex-review 跑法**:`codex exec -s read-only "$(cat /tmp/prompt.txt)" -c 'model_reasoning_effort="high"' </dev/null` 后台跑(任务 4 实测 ~7 分钟 133k tokens);最终 message 取**最后一个** `^codex$` 行之后(`awk '/^codex$/{n=NR}{l[NR]=$0}END{for(i=n+1;i<=NR;i++)print l[i]}'`);read-only sandbox 里 vitest EPERM、codegraph 索引打不开均属预期,Codex 会静态复验。
- **ai@7.0.0-beta.182 API 面**(任务 4 实证):`{type:"image"}` content part 已弃用,用 `{type:"file", data, mediaType}`(wire 仍是 openai-compat `image_url` data URL);`ai/test` 的 `MockLanguageModelV4` 自带 `doGenerateCalls` 计数 + 序列响应数组;V4 spec usage 是嵌套形状(`inputTokens.total`)、`finishReason` 是对象 `{unified, raw}`;tool() 的 `execute` 第二参数需要 `context`(测试里 `context: undefined as never`)。
- **executor 内 `generateObject` 必须显式 `maxRetries: 0`**:重试预算由状态机独占,否则 provider 级重试把真实视觉调用放大超出 PRD 重调上限。
- **worker smoke 路由模式**:三段门(smoke header 403 → missing env 424 hashed → Bearer≥16 403)+ body 解析 400 + 响应脱敏(hash 敏感 id、不回字节)+ `hashRuntimeSmokeString`/`sanitizeRuntimeSmokeDetail` 工具;新路由照抄 `PARSE_CHART_IMAGE_LIVE_SMOKE` 或 `AGENT_LIVE_TOOL_LOOP` 先例;测试用 `app.request(path, init, env)` + `vi.stubGlobal("fetch", mock)`(`createChartVisionMockFetch`/`createOpenAiCompatibleMockFetch` 两个 mock 工厂可抄)。
- **迁移登记套路**(三轮实证):14 位时间戳命名;`migrations.contract.json` 逐条登记 file/purpose/schemas/tables/indexes/market_data:false/字面 default_deny;SQL 必须 `create schema if not exists` + 每表 `create table if not exists <fq>`;禁词裸 `token`/`secret`/`password`/`drop`/`delete`(下划线连接如 `token_cost`/`deleted_at` 安全,**注释措辞注意绕开裸词**——任务 5 的删除链路注释高危);`npm run check:database` 即时验证。
- **vitest include = `apps/**` + `packages/**`**(任务 4 实测修正早前"仅 packages"的记录);worker 测试在 vitest 面内,`npx vitest run apps/worker` 可过滤跑。
- **strict check 必须 `LC_ALL=C`**;"Deploy SQL order check failed" 预期失败连续两轮未出现(新增迁移不触发),真出现时对照 `tasks/todos.md` 行 65 治理决策。
- **`repo-harness run sprint-backlog status/next` 不可用**(上游 bug,todos 行 66);sprint 行状态以 sprint 文件为真值源,手动编辑回填。
- **CI verify** = npm ci → lint → typecheck → test → test:golden(不跑图像生成/DB);新增 check script 默认不进 CI。
- **Node 22 type stripping**:import 链穿 `@aiphabee/agent-runtime` 的 Node CLI/脚本,bin 壳用 `tsx/esm/api` 的 `register()`(chart-golden-set/chart-parse-eval 两个先例)——任务 5 若做录制脚本会用到。
- **网络**:npm registry 稳定;GitHub raw/jsdelivr 大文件间歇断连——资产类下载优先 npm 包提取(若引入 @cf-wasm/photon 注意这点)。
- **并发会话检查**:开工前 `ps aux | grep claude` + 确认 `plans/`/`tasks/` 无异常新工件;历史事故见 `tasks/archive/notes-20260702-2026-chart-parse-contract.md` Incident Log。
- **主仓库工作区脏文件现状**:sprint 回填 + 四份 handoff(任务 2/3/4 台账 + 本文件),属用户决策面;实现会话照旧"不动无关文件",回填只碰 sprint 与 handoff。
- **Edit 大文件(worker index.ts ~19k 行)**:用唯一锚点字符串精确 Edit;Read 工具 256KB 上限,分区段 offset/limit 读;grep 先定位行号再读小区段。

## 残留(不阻塞任务 5)

- **Gateway compat 对 google-ai-studio 的 vision + json_schema 翻译完整性 [UNVERIFIED]**:任务 4 只有 mock/wire 静态证据;部署后打 `POST /agent/tools/parse-chart-image/live-smoke`(inline `image_base64`)做 live POC;若有缺陷,fallback 只改 `createChartVisionModel` 单函数(`@ai-sdk/google` + Gateway provider 路由 baseURL)。
- **真模型 fixture 录制**(任务 5 后或并行的独立刀):executor 运行时无关,Node 脚本(tsx register 壳)驱动它对 golden set 逐样本解析,按 `chart-parse-eval-fixture.v1` 落盘直接喂 `chart-parse-eval run` 即得真实三项指标;录制后才有真校准数据可产 `status=ready` 行。
- live DB apply/readback 未做:`eval_runs`/`eval_sample_results`/`calibration_runs`/`chart_parse_results`(+ 未来 `chart_images`)全部账本 status=local_contract;首次真库写入属 sprint 之后的运维动作。
- 清晰子集 11 张 → field_matrix 分层断言统计噪声偏大;golden set 扩容(`--count` 提升 + bump SET_VERSION)是演进路径。
- `image_sha256` 跨平台一致性、形态注入视觉逼真度、父 PRD §12.1 修订、repo-harness 上游 bug ×2(todos 行 65/66)——均为前轮遗留。

## 台账闭环

上一份 handoff(任务 4 开工包)的执行状态与 Files Modified 已回写、sprint 行 4 已回填 + Execution Log 已记、本文件是任务 5 开工包——三处互相咬合,新会话从任何一处进入都能还原全貌。任务 5 验收后除常规回填外,还需做 sprint 5/5 闭环收尾(见 Next Steps 步骤 3 尾段)。
