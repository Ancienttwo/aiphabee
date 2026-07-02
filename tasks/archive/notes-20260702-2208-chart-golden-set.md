> **Archived**: 2026-07-02 22:08
> **Related Plan**: plans/archive/plan-20260702-2047-chart-golden-set.md
> **Outcome**: Completed
> **Lifecycle**: notes
> **Parent Run ID**: run-20260702-2208

# Implementation Notes: chart-golden-set

> **Status**: Active
> **Plan**: plans/plan-20260702-2047-chart-golden-set.md
> **Contract**: tasks/contracts/20260702-2047-chart-golden-set.contract.md
> **Review**: tasks/reviews/20260702-2047-chart-golden-set.review.md
> **Last Updated**: 2026-07-02 21:45
> **Lifecycle**: notes

## Design Decisions

- 交付:新包 `packages/chart-golden-set`,确定性生成 100 张 K 线截图变体 + 逐样本真值 manifest(`tests/golden/chart-parse/manifest.json` 提交,PNG 写 gitignored `runtime/chart-golden-set/`)。
- `src/prng.ts`:mulberry32 + FNV-1a 子种子派生;全链路禁 Math.random/Date.now。
- `src/synthetic-ohlcv.ts`:seeded log random walk + 3 种形态注入模板(ascending_triangle / double_top / falling_wedge);日线时间轴跳周末,intraday 线性倒推。
- `src/variant-matrix.ts`:七维矩阵每维配额均匀 + 维度独立 shuffle;index 0 固定为验收回归样本(RSI(14)+MACD(12,26,9)+trendline+end_time)。
- `src/render.ts`:ECharts 6.1.0 SSR(SVG)→ resvg PNG(仅加载 assets/fonts,`loadSystemFonts:false`);`convertToPixel` 算画线锚点 → [0,1] 归一化(origin top-left,与 chart-parse 坐标声明一致);degradation 走 @napi-rs/canvas(downscale 0.6x / JPEG q45 往返)。真值可见性约束:truth 非 null 字段必须图上可读(exchange 进标题、`showMaxLabel` 强制末轴标签)。
- `src/manifest.ts`:truth = ChartParseResult 去 confidence 投影;`truthAsChartParseResult` 补 dummy confidence 后过 chart-parse zod 契约(防漂移);`collectInvariantViolations` 即 CLI exit 60 判定面;`RENDER_ENGINE` pin 引擎版本,render.test 断言 `echarts.version` 一致。
- `src/cli.ts` + `bin/chart-golden-set.mjs`:generate/validate,单文档 JSON stdout,exit codes 0/40/50/60 镜像 data-ingest。
- 字体:NotoSans-Regular.ttf(621KB)+ NotoSansSC-Subset.ttf(78KB,21 汉字 + ASCII,`scripts/make-font-subset.mjs` 制作;改 `src/locale-text.ts` 中文文案必须重跑 subset)。
- 验收:`npm run check:chart-golden-set` = 两次 generate 哈希对比 + jq 三类断言 + validate 回读。

## Deviations From Plan Or Spec

1. **tsx devDep(plan 未预见)**:Node 22 type stripping 不做无扩展名解析,CLI import 链穿过 `@aiphabee/agent-runtime/chart-parse`(任务 1 既有代码,无扩展名相对导入,scope 禁改)→ bin 壳用 `tsx/esm/api` `register()` 进程内注册 loader;stdout 单文档契约保持。
2. **`.gitignore` 增 `/runtime/`**:plan 写"runtime/ 已在 .gitignore"与 worktree 基点(a83d0df)不符(那是主仓库未提交的 .gitignore 修改)。已按 scope gate 先扩 contract allowed_paths 再补规则;合回 main 时若与主仓库工作区 .gitignore 冲突需人工合一。
3. **字体获取路径**:GitHub raw / jsdelivr 大文件间歇断连(curl exit 56,直连同样),改从 npm `@expo-google-fonts/noto-sans-sc` 提取全量 TTF(10.5MB)再 subset;产物已提交,重制脚本保留。

## Tradeoffs Considered

| Option | Decision | Reason |
|--------|----------|--------|
| CLI 运行时:纯 mjs 自包含(data-ingest 式) | 弃 | truth 枚举必须 import chart-parse TS 源,禁复制枚举 |
| CLI 运行时:node 原生 strip-types | 弃 | agent-runtime 无扩展名导入无法解析,改 agent-runtime 超出 scope |
| CLI 运行时:tsx loader 进程内注册 | 用 | 零 spawn、stdout 干净、包源码零改动、仅 devDep |
| SC 字体全量入 git(10.5MB) | 弃 | subset 78KB 等效覆盖,重制脚本可复现 |
| 形态注入实现全部 18 种枚举 | 弃 | 3 种模板已满足矩阵覆盖与验收;其余是任务 3 校准后的扩展面 |

## Open Questions

- 形态注入视觉逼真度中等(intraday 短窗口尤甚):truth 自洽性成立,但任务 3 校准可能发现 patterns 维度命中率低——届时调模板振幅/触碰次数并 bump `set_version` 全量重生成。

## Evidence Links

- RED:vitest 4 files failed(模块未实现)→ GREEN:`npx vitest run packages/chart-golden-set` 43/43 → 自审+外审修复后 49/49(新增 CLI 契约测试与引擎 pin 篡改测试)
- 全局:`npx vitest run` 815 passed | 1 skipped;`npm run typecheck` 全 workspace pass(exit 0)
- `npm run check:chart-golden-set` PASS(11.3s):两次 manifest sha256 = `748614ff97eba5b7e4ef03eeeb925a077b2b051ecb712afeff5d7a0fb7a2f20d`;sample_count=100;七维全覆盖;回归样本在;validate pass
- 视觉抽查:cgs-000(zh/tradingview/trendline/MA+VOL+RSI+MACD 四窗格)、cgs-001(downscale/no_symbol/横线)人工看图确认,中文 subset 无豆腐块
- Checks: `.ai/harness/checks/latest.json`
- Run snapshots: `.ai/harness/runs/`

## Promotion Candidates

- Node 22 type stripping 不解析无扩展名导入(tsx register 是 monorepo TS 源 CLI 的最小解)——若任务 3/4 再遇同型问题,promote 到 `tasks/lessons.md`。
- ECharts SSR:同进程重复渲染 PNG 字节一致、SVG 字符串因 zrender 全局 id 计数器漂移但像素不变——已在 render.test 固化断言,暂不 promote。
