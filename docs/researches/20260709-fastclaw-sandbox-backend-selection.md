# FastClaw Sandbox Backend Selection: Cloudflare / Sandbank Cloud / boxlite

> **Created**: 2026-07-09
> **Updated**: 2026-07-12（VPS hosting correction、官方價格、GA/隔離/配額、專屬 Agent 成本模型與 live staging capacity）
> **Question**: FastClaw 為每位付費用戶 provision 專屬 Agent 時，sandbox 應選 Cloudflare Sandbox SDK 還是 Sandbank Cloud；是否值得接 sandbank 聚合層；成本對比為第一級交付物。
> **Method**: deep-research pass（repo 約束對讀 + 三方源碼/文檔/定價核實）
> **Consumes**: `packages/agent-runtime/src/index.ts`（AgentRunner 契約）、`plans/sprints/20260703-dual-agent-v2.sprint.md`（redirect 決策）、`plans/prds/20260703-1742-dual-agent.prd.md`
> **Feeds**: FastClaw runner sprint 規劃（於 agent-control-plane-convergence 收斂後）

RECOMMENDATION: MVP 直接用 Cloudflare Sandbox SDK（建於 CF Containers），由獨立內部 Worker 暴露受限 Bridge API，FastClaw 透過既有 `sandbox.Executor` / `ExecutorPool` seam 接入；不再在 AiphaBee 發明一個 FastClaw 工具路徑繞不過去的平行 `SandboxBackend`，也不引入 sandbank 聚合層。每位付費用戶的專屬 FastClaw Agent 是 durable identity/profile，sandbox 按 run/session 臨時建立並銷毀。Sandbank Cloud 僅保留 data-free 原型/成本比較，boxlite 留作自架隔離升級 — confidence: HIGH（方向與公開單價）／MEDIUM（工作負載估算，待 live meter）

> **2026-07-11 hosting correction**: FastClaw control plane 常驻既有 VPS，
> 使用 PS 共用 staging PostgreSQL；它不部署在 Cloudflare Container。
> Cloudflare 只承载 Worker/R2 与按 run 建立的 Sandbox/Scanner。因此下文
> Cloudflare 单价是 sandbox plane 成本；FastClaw VPS/PG 必须另按
> host/database invoice 分配。既有 VPS 的当前增量现金成本为 `$0`，但在
> 没有 invoice allocation 前不能声称 allocated hosting cost 为零。

> **命名澄清**: 討論中的「Cloudbank」按 **Sandbank Cloud**
> (`sandbank.dev/cloud`) 理解。`cloudbank.org` 是面向研究機構的商業雲資源
> 經紀平台，不是 Agent sandbox provider，不進本次選型。

## Decision

2026-07-09 用戶拍板：**採用 CF（Cloudflare Sandbox SDK / CF Containers）作為 FastClaw MVP sandbox 後端**。2026-07-10 實作前 trace 進一步確認 SDK 只能在 Workers runtime 使用，而 FastClaw 是外部 Go runtime；因此最小正確形狀是 AiphaBee-owned Bridge Worker + FastClaw 現有 `Executor/ExecutorPool` provider seam，不是 AiphaBee-side 平行 port。2026-07-10 官方重查也確認 Containers 與 Sandboxes 已於 2026-04-13 GA；每個 sandbox 在獨立 VM 中隔離。boxlite 只在合規 owner 要求自架隔離或量級/SRE 產能到位時重啟；Sandbank Cloud 不進合規生產路徑。

產品決策同時鎖定：**一位 entitled 付費用戶對應一個專屬 FastClaw
Agent identity/profile**。AiphaBee 保存 user → agent mapping、entitlement、
billing、audit、disable/delete 狀態；provision 失敗 fail-closed/retryable，
不回退共享 Agent。專屬 Agent 不等於 24x7 常駐 sandbox；sandbox 只做
ephemeral execution，durable memory/artifact 回到 AiphaBee-owned storage。

## 鎖定結論的三個倉內約束

- `AgentRunner.run(request): AsyncIterable<AgentExecutionEvent>`（`packages/agent-runtime/src/index.ts:443-448`）是 authority。`AgentExecutionEvent` 是**語義事件流**（`event_index`/`event_type`/`visible_to_user`/`payload`），不是 raw stdout。sandbox 的 streaming stdout/stderr 在**更底一層**，由 FastClaw runner 翻譯成語義事件。所以「streaming exec 對接 AsyncIterable 的難度」對 CF/boxlite/Cloud **三者相同**，工作量全在 runner 的事件翻譯邏輯，不在 sandbox adapter，這一維不區分後端。
- redirect 檔（`plans/sprints/20260703-dual-agent-v2.sprint.md:16-23`）已定：FastClaw 是 authority 之後的一個 `AgentRunner` 實現，runner 可換、用戶關係不能換。這個「可換」invariant 沿用到 sandbox 層。
- 合規哲學（ephemeral-ohlcv sprint `:91-106`）：fail-closed、kill switch、tenant 隔離、no background/batch、第三方 provider 留存不可控只能標註。這條直接決定選項 C 出局（見合規節）。

## (a) sandbank 本體評估：現在不值得引入這層抽象

**sandbank 是什麼**（已核實）：chekusu Inc（創辦人 Guo Yu，ex-ByteDance senior principal，Tokyo）的 unified sandbox SDK，MIT，TypeScript 99%，~150 stars／~168 commits／v0.7.1（2026-07-06），聚合 Sandbank Cloud、boxlite、E2B、Daytona、Fly.io、Cloudflare、db9。核心 adapter 就 6 個方法：`create/destroy/list/exec/writeFile/readFile`，擴展能力 `exec.stream / snapshot / volumes / terminal`。Capability matrix 確認 `exec.stream` 僅 Sandbank Cloud、Cloudflare、BoxLite 支援。

**判斷：MVP 不引入，理由三條**

1. **AiphaBee 已經有可換性 seam。** `AgentRunner` interface 已經給了 runner 層的可換性。sandbank 提供的是**再低一層**的 sandbox-backend 可換性。目前沒有「同一 runner 要同時跑多個 sandbox 後端」的具體近期需求 —— 這是典型 premature abstraction。
2. **走 CF-native 時 sandbank 是多一層。** CF 官方的 `@cloudflare/sandbox`（GA 的 Containers 之上，CF 自己維護）直接給 `exec/writeFile/readFile/runCode` 與 streaming output callback，用 Worker binding 直連、零跨雲。sandbank 的 CF adapter 底層仍要包 CF SDK。在全 CF 棧上再套 sandbank，是為一個還不需要的 portability 付依賴稅。
3. **成熟度與多租戶是硬傷。** 150 stars／單一 maintainer org／workspace sync 自標 experimental，且 README 沒有明確的 multi-tenant isolation model。tenant 隔離本來就得靠 AiphaBee 自己保證（一 run 一 box + job-scoped token），sandbank 不會白送隔離。把一條合規關鍵路徑壓在 v0.7 的抽象上，風險不對稱。

**替代做法（smallest coherent change）**：保留 AiphaBee 的 `AgentRunner.run(request): AsyncIterable<AgentExecutionEvent>` 作 public authority；Cloudflare provider 可換性落在 FastClaw 已存在的 `sandbox.Executor` / `ExecutorPool`。新增的 Bridge Worker只做 HMAC run auth、quota/terminal guard、Cloudflare SDK lifecycle 與受限 exec/file API。這樣工具實際執行路徑必然經過 provider seam，也不把 Cloudflare method name 或 raw stdout 升格成 AiphaBee public contract。

## (b) 三選項對比表（成本為第一級）

| 維度 | A. Cloudflare Sandbox SDK | B. sandbank + boxlite 自架 | C. Sandbank Cloud |
|---|---|---|---|
| 隔離模型 | 官方 security model：**每 sandbox 一個獨立 VM**，filesystem/process/network/resource 隔離 | boxlite/KVM microVM；host 加固自己負責 | 官方稱 bare-metal KVM managed sandbox；在第三方基礎設施 |
| 多租戶安全 | 一 run/session 一 sandbox + job-scoped token；CF 是 AiphaBee 既有平台邊界 | 同左；自有 host blast radius 由團隊承擔 | sandbox 隔離，但投研 payload 跨出既有 Cloudflare 法律/運維邊界 |
| 產品狀態 | Containers + Sandboxes **GA（2026-04-13）** | OSS/self-host，成熟度與 host 能力自負 | Early managed service；API token 或 x402/USDC |
| 公開資源/配額 | `standard-1` = 0.5 vCPU/4 GiB/8 GB；account 上限 1,500 concurrent vCPU、6 TiB RAM、30 TB disk | 受 host fleet 容量限制 | 每 box 2 vCPU/1 GiB/5 GB；10 分鐘 session；帳戶並發未公開 |
| 執行/生命週期 | `sleepAfter` 預設 10 分鐘；`keepAlive` 可長跑但必須顯式 `destroy()`；disk 在 sleep/destroy 後清空 | 自定 | 建立含 10 分鐘；每延長 10 分鐘另付一次 |
| `exec` stream → Agent event | 支援；語義事件翻譯仍由 FastClaw runner 負責 | 支援 | 支援 |
| 運維負擔 | 低，scale-to-zero | 高：KVM host、patch、image、capacity、on-call | 低，但增加供應商、付款與 data residency 面 |
| CF-native 親和 | **最高**：Worker/Durable Object binding，同 vendor 同帳單 | Worker → 外部 host | Worker → `sandbank.dev` |

### 官方計費模型（2026-07-10 查詢）

- **Cloudflare**：Workers Paid 基線 `$5/月`，包含 375 vCPU-min、25
  GiB-hour memory、200 GB-hour disk。超量價為 CPU
  `$0.000020/vCPU-s`（只計 active CPU）、memory
  `$0.0000025/GiB-s`、disk `$0.00000007/GB-s`。Container egress：
  NA/EU `$0.025/GB`（含 1 TB），Oceania/Korea/Taiwan `$0.05/GB`
  （含 500 GB），其他 `$0.04/GB`（含 500 GB）。另有 Worker、Durable
  Object、logs/observability 用量，不應藏進 sandbox 單價。
- **Sandbank Cloud**：官方公開價 `$0.02/sandbox`，包含 10 分鐘；每延長
  10 分鐘另 `$0.02`；exec/files/proxy 不另收。公開資源為 2 vCPU、
  1 GiB RAM、5 GB disk，使用 USDC/Base x402，或 API token。
- **boxlite 自架**：沒有 provider per-sandbox 價；總成本是 host fleet、
  跨雲流量與 SRE/on-call。沒有真實 host 型號、region、利用率和人力成本前，
  不再提供貌似精確的月費。

### 可重算公式

整體專屬 Agent 服務成本不是 sandbox 單價：

```text
Total = FastClaw control-plane compute/database
      + sandbox execution
      + LLM tokens
      + market-data/tool APIs
      + durable storage/egress
      + Worker/DO/logs/observability
```

本報告只對公開可核的 sandbox execution 做數值預算；沒有指定模型、token
量、FastClaw host 形態、market-data 合約與 retention 前，不捏造總成本。

Cloudflare 單次 raw sandbox cost（尚未扣月度 included usage）：

```text
CF_run = active_vCPU_seconds × 0.000020
       + provisioned_GiB_seconds × 0.0000025
       + provisioned_GB_disk_seconds × 0.00000007
       + egress + Worker/DO/logs
```

Sandbank Cloud：

```text
Sandbank_run = ceil(session_minutes / 10) × 0.02
```

### 2026-07-10 live staging meter

真实链路为 AiphaBee orchestrator → disposable FastClaw dedicated Agent →
Bridge Worker → Cloudflare `standard-1` Sandbox。最终 serial smoke 1/1
通过，wall clock 7.385 秒，raw list-price bound 为
`$0.0000780384-$0.0001519384`。最终并发 10 smoke 10/10 通过，十个 run
均使用不同 Agent/sandbox identity，wall clock 为 6.052-17.804 秒；十个
run 合计 `$0.0010399488-$0.0020247488`，平均每 run
`$0.00010399488-$0.00020247488`。所有 run 都完成 direct artifact hash、
exec receipt、destroy 和 terminal readback。

这组输出仍明确标记 `actual_bill=false`：memory/disk 按 orchestrator wall
clock 计，CPU 只给 0-0.5 vCPU 上下界，未扣 monthly included usage，也不含
Worker、DO、logs、egress、FastClaw、LLM 或 tool provider。因此它把短 run
的 sandbox 量级从假设收紧到 live upper/lower bound，但不能当 invoice。

首次并发 10 只有 8/10：两个 cold exec 被 Cloudflare runtime connection
closing 中断。Bridge `create` 原先只签发 sandbox id，并未启动 runtime；改为
在 create 内先执行安全、幂等的 `true` readiness probe 后，最终并发 10
达到 10/10。另一个 live defect 是 file URL 的 `workspace/...` 被解析成
`/workspace/workspace/...`；现已与官方 Bridge 一样按绝对 workspace URL
路径解析。两项都保持 fail-closed，没有重试未知副作用的业务命令。

### 專屬 Agent 月成本情境

假設：100/1,000/10,000 名**付費活躍用戶**；每人每月 10 次 research
run；每 run 一個新 sandbox，120 秒；Cloudflare `standard-1`
（0.5 vCPU/4 GiB/8 GB）、平均 CPU 使用率 25%；無 egress；Sandbank 每 run
均在首個 10 分鐘內完成；Cloudflare run 結束後在 `finally` 立即
`destroy()`，不支付預設 10 分鐘 idle window。LLM token、market-data/tool API、FastClaw control
plane、Postgres/R2、Worker/DO/logs均另計。

| 付費活躍用戶 | Runs/月 | Cloudflare sandbox 帳單/月* | Sandbank Cloud/月 | Sandbank / CF |
|---:|---:|---:|---:|---:|
| 100 | 1,000 | **$5.99** | **$20** | 3.3× |
| 1,000 | 10,000 | **$19.95** | **$200** | 10.0× |
| 10,000 | 100,000 | **$160.99** | **$2,000** | 12.4× |

\* Cloudflare 欄包含 `$5` Workers Paid 基線並逐維度扣 included usage；如果
AiphaBee 已在付這 `$5`，100-user 情境的 sandbox incremental overage 約
`$0.99`。未扣 included usage 的 `standard-1` raw cost 是：120 秒
`$0.0015672/run`、300 秒 `$0.003918/run`、600 秒 `$0.007836/run`。

### 為什麼「專屬 Agent」不能實作成 24x7 專屬 sandbox

`standard-1` 即使 CPU 完全 idle，4 GiB memory + 8 GB disk 常駐 730
小時也約 `$27.75/user-month`；平均 25% CPU 時約 `$34.32`，滿 CPU
約 `$54.03`。Sandbank 按 10 分鐘續期連續跑 730 小時約
`$87.60/user-month`。1,000 名付費用戶會把 sandbox alone 推到約
`$34k` 或 `$87.6k/月`，而 agent identity/profile 本身根本不需要這樣的
常駐算力。

因此正確模型是：**專屬 FastClaw Agent identity/profile 長期存在；sandbox
只在 run/session 活躍時存在，durable memory/artifact 在外部持久層。**

## 選項 C 的合規影響（對照三存儲層）—— C 出局的主因

三存儲層哲學：平台持久層（不寫）／transcript（policy 控）／第三方 provider（留存不可控，只能標註，不能聲稱「完全不存」）。

- **A（CF Containers）落在「平台基礎設施（層 1）」，不是「第三方（層 3）」。** AiphaBee Worker 本來就跑在 CF 上；新增獨立 Sandbox Bridge Worker/Containers 不新增法律 processor，同 vendor、同 DPA/subprocessor 關係、同 data-residency。sandbox 在既有信任/法律邊界之內，第一個 smoke 直接 `enableInternet=false`。合規最乾淨。
- **C（Sandbank Cloud）把投研代碼 + box context 內任何數據，送進一家 150-star 早期 startup（chekusu Inc）的託管基礎設施 —— 正是「層 3 外部 provider」。** 要把 sandbank 加進 subprocessor 清單、簽 DPA、披露 data residency，且不能再聲稱「不存投研數據」。對 fail-closed、不 over-claim 非留存的哲學，C 是最差匹配。x402 crypto 結算讓合規/財務更難批。C 只留給 data-free 拋棄式原型，不進合規路徑。
- **B（自架 boxlite）法律上是自有基礎設施**（IaaS 供應商是既有那層 processor），數據不出邊界 + microVM 最強隔離 —— enterprise/敏感 tenant（真券商數據）的正確歸屬，代價是 host 加固責任自己扛。

隔離強度補充：AiphaBee 設計本就把 authority 留在 Worker/Tool Gateway，sandbox 只拿 job-scoped 短 TTL token、無 DB、無 raw 券商數據（dual-agent PRD §7.4/§14.2）。2026-07-10 的 Cloudflare 官方 security model 已明確每個 sandbox 運行在獨立 VM，filesystem/process/network/resource 互相隔離；blast radius 仍須由 scoped token、egress policy、run budget 和 destroy-on-exit 共同限制，不能只依賴 VM 邊界。

## (c) 主要風險與未知項（★ = 需用戶/合規 owner 決策）

1. **★ Sandbank Cloud 的帳戶並發、SLA、DPA、data residency 與 API-token 商務條款未公開。** `$0.02/10min` 已可編 sandbox 預算，但不能據此批准合規生產；x402/USDC 仍是財務/採購阻力。
2. **CF Containers/Sandboxes 已 GA，但 SDK 正在快速演進。** 2026-07-09 後 HTTP/WebSocket transport 與 stream-specific helpers 被移除；實作必須 pin SDK/container image、使用 RPC transport、關閉 default session 或顯式建 session，並用 contract test 防版本漂移。
3. **沒有平台 hard-timeout 不能代替 AiphaBee run budget。** Cloudflare `keepAlive` 可以讓 container 不自動 timeout；本 smoke 把 active run hard cap 收緊為 540s，token TTL 最多 600s，明確保留 60s 給 receipt/artifact readback 與 `destroy()`，不能讓執行期吃完整個 credential window，也不能假定 provider 會替我們 kill。
4. **★ 雖然 CF 官方稱每 sandbox 獨立 VM，enterprise/真券商 tier 是否仍要求自架 boxlite/KVM 是合規 owner 決策。** 這決定 boxlite 何時（是否）上位。
5. **★ boxlite 運維產能。** 沒有 SRE owner 承擔 KVM host fleet 的 patch/capacity/on-call，B 即使 compute 單價更低也不可用。
6. **跨雲 first-progress 延遲。** B/C 的 Worker→外部 sandbox hop 對 PRD first-progress 10s 是額外壓力；A 在 CF 內少一段網路與供應商故障面。
7. **成本表不是 live bill。** 2026-07-10 live meter 已取得 wall-clock memory/disk 与 CPU 低/高界，但真實 CPU duty cycle、included usage、artifact egress、DO/Worker/logs、LLM token 和 tool data cost 仍未进入 actual bill readback。

## (d) 對 FastClaw sprint 的切法建議

sandbox 選型掛在 FastClaw runner sprint 之下（contract 由 agent-control-plane-convergence sprint owns，FastClaw 等其收斂）。契約先行：

- **Slice 1（已實作於本 contract branch）**：新增 `apps/sandbox-bridge`，pin `@cloudflare/sandbox@0.12.3` 與同版 container image，RPC transport、`enableDefaultSession:false`、`enableInternet=false`、`standard-1`/max 10；run-scoped HMAC + RunGuard Durable Object 鎖 identity/scope/max-calls/terminal destroy，並保存不含原文的 exec receipt hash。
- **Slice 2（已實作於 linked FastClaw branch）**：在 FastClaw 既有 `sandbox.Executor/ExecutorPool` 新增 `cloudflare` backend；`X-AiphaBee-Sandbox-Authorization` 只由 HTTP header 移入 request context，不進 `params`/LLM/persistence/log；不同 scope 的 create 不持全域鎖；turn 結束後 FastClaw 只 forget/scrub 本地 executor/token，由 AiphaBee 單獨負責 Bridge receipt/artifact readback、destroy 和 terminal readback。
- **Slice 3（首轮已完成）**：`standard-1` serial 1/1 与并发 10/10 live smoke 已验证 cold-start readiness、artifact/receipt/destroy/terminal invariant，并产出 wall-clock raw list-price bound。尚未完成的是 Cloudflare actual CPU duty、included usage、egress、DO/Worker/log账单归因；在这些数据前不降到 `basic`，也不把 bound 当 invoice。
- **延後（獨立 Enterprise-isolation sprint）**：boxlite 已是 FastClaw `ExecutorPool` 的另一 provider；是否讓某 tenant tier 使用它，gated on 合規 owner 與 KVM fleet owner。Sandbank Cloud 只在 data-free 原型出現，不進合規路徑。

**會改變判斷的證據**：Sandbank Cloud 提供可接受的 enterprise API-token 報價、並發/SLA、DPA/data-residency，且在同負載 live meter 上總成本顯著低於 CF；合規 owner 要求自架 KVM；或 Cloudflare live spike 無法滿足 FastClaw image/runtime/egress/540s active + 60s cleanup invariant。

## 來源

- [chekusu/sandbank](https://github.com/chekusu/sandbank)
- [boxlite-ai/boxlite](https://github.com/boxlite-ai/boxlite)
- [Cloudflare Sandbox SDK](https://github.com/cloudflare/sandbox-sdk)
- [Cloudflare Containers and Sandboxes GA](https://developers.cloudflare.com/changelog/post/2026-04-13-containers-sandbox-ga/)
- [CF Containers pricing](https://developers.cloudflare.com/containers/pricing/)
- [CF Containers limits and instance types](https://developers.cloudflare.com/containers/platform-details/limits/)
- [Cloudflare Sandbox lifecycle](https://developers.cloudflare.com/sandbox/api/lifecycle/)
- [Cloudflare Sandbox security model](https://developers.cloudflare.com/sandbox/concepts/security/)
- [Cloudflare Sandbox 2026 deprecation migration](https://developers.cloudflare.com/sandbox/guides/2026-deprecation/)
- [Sandbank Cloud pricing](https://sandbank.dev/cloud)
- [CloudBank research-cloud broker](https://www.cloudbank.org/)
- [Northflank AI sandbox pricing 2026](https://northflank.com/blog/ai-sandbox-pricing)
- [AWS EC2 nested virtualization (2026-02)](https://aws.amazon.com/about-aws/whats-new/2026/02/amazon-ec2-nested-virtualization-on-virtual/)
