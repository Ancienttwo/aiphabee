# FastClaw Sandbox Backend Selection: sandbank / CF Containers / boxlite / Sandbank Cloud

> **Created**: 2026-07-09
> **Question**: FastClaw runner 接 sandbank（github.com/chekusu/sandbank）沙箱聚合是否值得；後端在 Cloudflare、boxlite、Sandbank Cloud（託管）之間選型，成本對比為第一級交付物。
> **Method**: deep-research pass（repo 約束對讀 + 三方源碼/文檔/定價核實）
> **Consumes**: `packages/agent-runtime/src/index.ts`（AgentRunner 契約）、`plans/sprints/20260703-dual-agent-v2.sprint.md`（redirect 決策）、`plans/prds/20260703-1742-dual-agent.prd.md`
> **Feeds**: FastClaw runner sprint 規劃（於 agent-control-plane-convergence 收斂後）

RECOMMENDATION: MVP 直接用 Cloudflare Sandbox SDK（= CF Containers）並封在自定義的薄 `SandboxBackend` port 後面，暫不引入 sandbank 這層抽象；boxlite 留作 enterprise microVM 隔離升級，Sandbank Cloud 僅限 data-free 原型 — confidence: HIGH（方向）／MEDIUM（成本數字）／LOW（Sandbank Cloud 絕對定價，官方未公開）

## Decision

2026-07-09 用戶拍板：**採用 CF（Cloudflare Sandbox SDK / CF Containers）作為 FastClaw MVP sandbox 後端**，按本報告建議封在薄 `SandboxBackend` port 後面，不引入 sandbank 抽象層。boxlite 依 (c)#4/#5 條件延後（合規 owner 裁定某 tenant tier 強制 microVM、或量級與 SRE 產能到位時重啟評估）；Sandbank Cloud 不進合規路徑。上線前待核事項見 (c)#2/#3：CF Sandbox SDK Beta 狀態複查、CF Containers hard-timeout 滿足 600s invariant。

## 鎖定結論的三個倉內約束

- `AgentRunner.run(request): AsyncIterable<AgentExecutionEvent>`（`packages/agent-runtime/src/index.ts:443-448`）是 authority。`AgentExecutionEvent` 是**語義事件流**（`event_index`/`event_type`/`visible_to_user`/`payload`），不是 raw stdout。sandbox 的 `exec.stream`（raw stdout/stderr）在**更底一層**，由 FastClaw runner 翻譯成語義事件。所以「streaming exec 對接 AsyncIterable 的難度」對 CF/boxlite/Cloud **三者相同**，工作量全在 runner 的事件翻譯邏輯，不在 sandbox adapter，這一維不區分後端。
- redirect 檔（`plans/sprints/20260703-dual-agent-v2.sprint.md:16-23`）已定：FastClaw 是 authority 之後的一個 `AgentRunner` 實現，runner 可換、用戶關係不能換。這個「可換」invariant 沿用到 sandbox 層。
- 合規哲學（ephemeral-ohlcv sprint `:91-106`）：fail-closed、kill switch、tenant 隔離、no background/batch、第三方 provider 留存不可控只能標註。這條直接決定選項 C 出局（見合規節）。

## (a) sandbank 本體評估：現在不值得引入這層抽象

**sandbank 是什麼**（已核實）：chekusu Inc（創辦人 Guo Yu，ex-ByteDance senior principal，Tokyo）的 unified sandbox SDK，MIT，TypeScript 99%，~150 stars／~168 commits／v0.7.1（2026-07-06），聚合 Sandbank Cloud、boxlite、E2B、Daytona、Fly.io、Cloudflare、db9。核心 adapter 就 6 個方法：`create/destroy/list/exec/writeFile/readFile`，擴展能力 `exec.stream / snapshot / volumes / terminal`。Capability matrix 確認 `exec.stream` 僅 Sandbank Cloud、Cloudflare、BoxLite 支援。

**判斷：MVP 不引入，理由三條**

1. **AiphaBee 已經有可換性 seam。** `AgentRunner` interface 已經給了 runner 層的可換性。sandbank 提供的是**再低一層**的 sandbox-backend 可換性。目前沒有「同一 runner 要同時跑多個 sandbox 後端」的具體近期需求 —— 這是典型 premature abstraction。
2. **走 CF-native 時 sandbank 是多一層。** CF 官方的 `@cloudflare/sandbox-sdk`（GA 的 Containers 之上，CF 自己維護）直接給 `exec/exec.stream/writeFile/readFile/runCode`，用 Worker binding 直連、零跨雲。sandbank 的 CF adapter 底層就是包這個 CF SDK。在全 CF 棧上再套 sandbank，是為一個還不需要的 portability 付依賴稅。
3. **成熟度與多租戶是硬傷。** 150 stars／單一 maintainer org／workspace sync 自標 experimental，且 README 沒有明確的 multi-tenant isolation model。tenant 隔離本來就得靠 AiphaBee 自己保證（一 run 一 box + job-scoped token），sandbank 不會白送隔離。把一條合規關鍵路徑壓在 v0.7 的抽象上，風險不對稱。

**替代做法（smallest coherent change）**：在 `packages/agent-runtime`（或新 `packages/sandbox-runtime`）定義薄 `SandboxBackend` port，方法面照抄 sandbank 那 6 個核心 + `lifecycle/kill`，把 fail-closed egress、hard-timeout、kill-switch 定成 port 級 invariant。先只實現 CF 一個 backend。這樣拿到可換 seam、但不吃 immature 依賴；日後真要 boxlite，在 seam 後寫 boxlite adapter，或那時再評估 sandbank —— FastClaw runner 只認 seam，不受影響。

## (b) 三選項對比表（成本為第一級）

| 維度 | A. CF Containers（直連 SDK） | B. sandbank + boxlite 自架 | C. Sandbank Cloud（託管 boxlite） |
|---|---|---|---|
| 隔離模型 | Container（full Linux，各自 Durable Object），非 microVM | **microVM（own kernel，KVM/Firecracker 級）** 最強 | microVM（同 boxlite），但在**第三方**基礎設施 |
| 多租戶安全 | 靠 AiphaBee「一 run 一 box + scoped token」；CF 是既有平台邊界 | 同左 + microVM 硬隔離；host 加固自己負責 | microVM 隔離，但跨出 AiphaBee 法律邊界 |
| 冷啟動 | Container 秒級（首次 build 2–3 min） | **sub-50ms boot**（已核實），最快 | sub-50ms + 跨雲網路 hop |
| 並發擴展 | GA：100× standard / 400× basic / 1000× dev | 受自架 host 容量限制，要自己 autoscale | 受供應商配額，未公開 |
| exec.stream → AgentExecutionEvent | 支援；翻譯在 runner（三者同難度） | 支援 | 支援 |
| 執行時長/資源上限 | 依 Containers instance type；hard-timeout 需查證 | 自定，最靈活 | 供應商定，未公開 |
| 網路控制（fail-closed egress） | CF 可鎖 egress 到 Tool Gateway；第一方最好控 | boxlite `allow_net` allow-list（已核實）；全控 | 供應商 `allow_net`，但出口在第三方 |
| 運維負擔 | **零**（scale-to-zero，CF 全托） | **重**：KVM host 加固/patch/kernel/image/on-call，~0.2–0.4 FTE | 零（託管） |
| CF-native 部署親和 | **最高**：Worker binding 直連，同 vendor 同帳單 | 低：Worker→AWS/Hetzner 跨雲 HTTPS hop | 低：Worker→sandbank.dev 跨雲 |
| 抽象層鎖定/成熟度風險 | 直連 CF SDK 最低 | boxlite Apache-2.0/2.1k stars/v0.9.7 較成熟；sandbank 層仍 v0.7 | 綁單一早期供應商 + x402 |

**計費模型**（rate 已核實）：

- **CF Containers**：CPU `$0.000020/vCPU-s`（= $0.072/vCPU-hr，只算 active CPU）、Mem `$0.0000025/GiB-s`（= $0.009/GiB-hr）、Disk `$0.00000007/GB-s`、egress NA/EU `$0.025/GB`（含 1TB）。$5/mo Workers Paid 含 375 vCPU-min + 25 GiB-hr + 200 GB-hr disk。Scale-to-zero，無 idle 成本。
- **boxlite 自架**：無 per-run 計費，成本 = 常駐 host + 運維。2026-02 起 AWS 支援非-metal nested virt（C8i/M8i/R8i/C7i/M7i/I7i，Intel-only），boxlite 不再被迫用昂貴 `.metal`。
- **Sandbank Cloud**：README 明說是「託管 BoxLite 雲服務」「支援 API token 或 x402 付費」，官方零公開定價。x402 = Coinbase 的 HTTP-402 stablecoin 微支付軌 —— crypto 結算，對 regulated fintech 的財務/採購是額外阻力。

**月成本情境估算**（假設：1 run 1 box，均值 120s wall-clock，~1 vCPU/~2 GiB，並發 10；100/1,000/10,000 runs/day ≈ 3k/30k/300k runs/mo）：

| 情境 | A. CF Containers（含 free tier） | B. boxlite 自架（compute floor，未含運維 FTE） | C. Sandbank Cloud（按 E2B/Daytona 類比，非官方） |
|---|---|---|---|
| 100/day (3k/mo) | **~$5/mo 邊際**（大量落 free tier） | ~$110–300/mo（單台常駐 host idle 主導） | ~$8–10/mo（無 free tier） |
| 1,000/day (30k/mo) | **~$55–70/mo** | ~$150–400/mo（1 host + 運維） | ~$85–100/mo |
| 10,000/day (300k/mo) | **~$550–650/mo** | ~$500–1,000/mo compute（2–3 host）+ 運維 FTE | ~$850–1,000/mo |

單 run compute：CF ≈ $0.0005（30s）–$0.005（5min）；Cloud ≈ CF 的 ~1.5×（託管按 provisioned 計、非 active）。boxlite 的 per-run 優勢在這三檔量級都沒兌現：idle host + 運維是與 run 數無關的固定 floor —— 要到遠高於 10k/day、已具 SRE 產能、且走 Hetzner 級 dedicated（native KVM，~$50–150/mo）才可能翻盤。

隱性成本：boxlite = KVM host 加固/patch/on-call（~0.2–0.4 FTE loaded，通常是真正的大頭）+ 跨雲 egress（AWS→CF 回程 ~$0.09/GB）；CF = Container 秒級冷啟 + Sandbox SDK 仍 Beta + instance-type 選型；Cloud = 供應商溢價 + x402 結算開銷 + 第三方數據駐留。

## 選項 C 的合規影響（對照三存儲層）—— C 出局的主因

三存儲層哲學：平台持久層（不寫）／transcript（policy 控）／第三方 provider（留存不可控，只能標註，不能聲稱「完全不存」）。

- **A（CF Containers）落在「平台基礎設施（層 1）」，不是「第三方（層 3）」。** apps/worker 本來就跑在 CF 上；加 CF Containers 不新增法律 processor，同 vendor、同 DPA/subprocessor 關係、同 data-residency。sandbox 在既有信任/法律邊界之內，egress 可 fail-closed 鎖到只能打 Tool Gateway。合規最乾淨。
- **C（Sandbank Cloud）把投研代碼 + box context 內任何數據，送進一家 150-star 早期 startup（chekusu Inc）的託管基礎設施 —— 正是「層 3 外部 provider」。** 要把 sandbank 加進 subprocessor 清單、簽 DPA、披露 data residency，且不能再聲稱「不存投研數據」。對 fail-closed、不 over-claim 非留存的哲學，C 是最差匹配。x402 crypto 結算讓合規/財務更難批。C 只留給 data-free 拋棄式原型，不進合規路徑。
- **B（自架 boxlite）法律上是自有基礎設施**（IaaS 供應商是既有那層 processor），數據不出邊界 + microVM 最強隔離 —— enterprise/敏感 tenant（真券商數據）的正確歸屬，代價是 host 加固責任自己扛。

隔離強度補充：AiphaBee 設計本就把 authority 留在 Worker/Tool Gateway，sandbox 只拿 job-scoped 短 TTL token、無 DB、無 raw 券商數據（dual-agent PRD §7.4/§14.2）。container escape 的 blast radius 被限死在一個 scoped token —— CF 的 container 級隔離對 MVP 足夠，boxlite 的 microVM 是 defense-in-depth 升級，不是 MVP blocker。

## (c) 主要風險與未知項（★ = 需用戶/合規 owner 決策）

1. **★ Sandbank Cloud 定價完全未公開**（僅 x402/token）。不拿到 sandbank.dev/cloud 直接報價無法為 C 編預算；x402 = 加密穩定幣軌，regulated fintech 財務可能直接否決。→ 決策：C 是否連原型都不碰。
2. **CF Sandbox SDK 仍標 Beta**（底層 CF Containers 已 GA）。合規關鍵路徑依賴前，需確認 SLA/穩定性（上線前復查）。
3. **CF Containers hard-timeout / max-run-duration / idle-sleep 具體值未核到。** dual-agent PRD §15.2 要求 soft 180s / hard 600s。→ 上線前對 `developers.cloudflare.com/containers/platform-details/limits/` 核實 600s hard-timeout invariant。
4. **★ CF container 隔離 vs microVM 是否被合規 owner 接受於 research tier？** 配合 scoped-token 設計後判斷足夠，但 enterprise/真券商 tier 是否強制 microVM 是合規 owner 的裁決，它決定 boxlite 何時（是否）必須上。
5. **★ boxlite 運維產能。** 沒有 SRE 願意/能 own 一個 KVM host fleet 的話，B 無論單位經濟多好都出局。
6. **跨雲 first-progress 延遲。** B/C 的 Worker→外部 sandbox 網路 hop，對 PRD「first progress timeout 10s」是額外壓力；A 在 CF 內無此 hop。
7. sandbank CF adapter 到底包 Sandbox SDK 還是直連 Containers binding、是否透傳 fail-closed egress —— 若要用 sandbank-on-CF 需讀 adapter 源碼核實；走直連 CF SDK 則此項 moot。

## (d) 對 FastClaw sprint 的切法建議

sandbox 選型掛在 FastClaw runner sprint 之下（contract 由 agent-control-plane-convergence sprint owns，FastClaw 等其收斂）。契約先行：

- **Slice 1（seam，contract 模式）**：在 `packages/agent-runtime` 定義 `SandboxBackend` port（`create / exec.stream / writeFile / readFile / destroy / kill`），與 `AgentRunner` 解耦。fail-closed egress、hard-timeout、kill-switch 定成 port 級 invariant。不綁任何後端。驗收：型別 + 單測鎖住 invariant，Generic 層無法取得 sandbox。
- **Slice 2（CF backend spike）**：用 `@cloudflare/sandbox-sdk` 在 apps/worker 實現 `SandboxBackend`。證明四件事：`exec.stream`→FastClaw runner→`AgentExecutionEvent` AsyncIterable 映射跑通；一 run 一 box 隔離；egress 鎖死只能打 Tool Gateway；hard-timeout + kill-switch fail closed。順帶量測冷啟 + first-progress 對照 PRD 10s。
- **Slice 3（成本/上限驗證）**：並發 10 壓測，量真實 per-run 成本 + 冷啟，核實 CF Containers 並發（100 standard）與 hard-timeout 滿足 600s invariant，定 instance type（起步 standard-1：1/2 vCPU/4 GiB）。
- **延後（獨立 Enterprise-isolation sprint）**：boxlite adapter 掛在 Slice 1 的 seam 後，gated on 合規 owner 裁定某 tenant tier 需要 microVM、或量級高到值得 own KVM fleet。Sandbank Cloud 只在 data-free 原型出現，不進合規路徑。

**會改變判斷的證據**：Sandbank Cloud 報出遠低於 CF 的價 + 願簽強 DPA/data-residency（改寫 C 的合規劣勢）；合規 owner 從一開始就要求 research tier 強制 microVM（boxlite 從「Enterprise 升級」提前成「MVP 必需」，B 上位）；CF Containers hard-timeout 撐不到 600s（迫使長 run 走外部 backend）。

## 來源

- [chekusu/sandbank](https://github.com/chekusu/sandbank)
- [boxlite-ai/boxlite](https://github.com/boxlite-ai/boxlite)
- [Cloudflare Sandbox SDK](https://github.com/cloudflare/sandbox-sdk)
- [CF Containers pricing](https://developers.cloudflare.com/containers/pricing/)
- [Northflank AI sandbox pricing 2026](https://northflank.com/blog/ai-sandbox-pricing)
- [AWS EC2 nested virtualization (2026-02)](https://aws.amazon.com/about-aws/whats-new/2026/02/amazon-ec2-nested-virtualization-on-virtual/)
