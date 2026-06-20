# P0 Requirement Traceability Ledger

> **Status**: Verified baseline
> **Last Updated**: 2026-06-20 14:32 +08
> **Source PRD**: `docs/researches/AiphaBee_PRD_v1.0.md`
> **Source Tracker**: `docs/AiphaBee_Sprint_Tracker_v1.0.md` §M
> **Plan**: `plans/plan-p0-traceability-ledger.md`
> **Task Contract**: `tasks/contracts/p0-traceability-ledger.contract.md`

This ledger satisfies the PRD §23.12 traceability baseline for P0
requirements: each P0 requirement has a stable repo-local issue reference,
accountable owner role, test gate, and release gate.

It does not mark the requirements themselves as implemented. Requirement
completion still lives in the tracker §M status column and the relevant sprint
DoD.

## Ledger Policy

- `issue_ref` is repo-local until an external issue tracker is selected.
- Owner is an accountable role, not a named person, because human assignment is
  not available in this repo yet.
- Test gates name the first verification surface that must exist before the
  requirement can be marked complete.
- Release gates name the sprint/phase gate that blocks shipment.
- Any future GitHub/Jira/Linear issue ID should be appended, not replace the
  stable repo-local `issue_ref`.

## Summary

| Area | P0 Count | Primary Owner |
|---|---:|---|
| ACC | 5 | Product Engineering / Billing |
| SEC | 4 | Data Engineering |
| AGT | 9 | Agent Runtime Engineering |
| STK | 6 | Product Engineering / Data |
| ANA | 5 | Analytics Engineering |
| DOC | 3 | Document Engineering / Security |
| RES | 1 | Product Engineering |
| MCP | 11 | Platform Engineering / Security |
| DAT | 9 | Data Engineering / Compliance |
| **Total** | **53** | Program Owner |

## Account And Security

| requirement | issue_ref | owner | sprint | test_gate | release_gate | implementation_state |
|---|---|---|---|---|---|---|
| ACC-01 登录/会话/设备 | AIP-P0-ACC-01 | Product Engineering / Identity | 1.4 | Auth session integration tests + device revoke test | Sprint 1.4 exit: internal accounts usable without permission bleed | Not started |
| ACC-02 账户/Workspace/订阅/权益分离 | AIP-P0-ACC-02 | Product Engineering / Billing | 1.1 | Workspace entitlement model tests | Sprint 1.1 exit: Gateway and usage ledger do not cross workspace boundaries | Not started |
| ACC-03 套餐升降级/宽限期 | AIP-P0-ACC-03 | Billing Engineering | 2.4 | Subscription lifecycle and grace-period tests | Sprint 2.4 exit: billing actions are auditable | Not started |
| ACC-04 Web/MCP 配额用量展示 | AIP-P0-ACC-04 | Billing Engineering / Platform | 1.1 / 1.4 / 2.4 | Usage ledger reconciliation tests | Sprint 2.4 exit: Web and MCP usage reconcile to billing | Not started |
| ACC-06 MCP OAuth/Key 撤销 | AIP-P0-ACC-06 | Platform Engineering / Security | 2.3 / 2.4 | OAuth revoke + API key invalidation tests | Sprint 2.4 exit: revoked credentials fail new calls | Not started |

## Security Master

| requirement | issue_ref | owner | sprint | test_gate | release_gate | implementation_state |
|---|---|---|---|---|---|---|
| SEC-01 多形式证券解析 | AIP-P0-SEC-01 | Data Engineering | 1.2 | `resolve_security` golden cases for code/name/history aliases | Sprint 1.2 exit: ambiguous securities return candidates | Not started |
| SEC-02 代码与实体分离 | AIP-P0-SEC-02 | Data Engineering | 0.2 / 1.1 | Security master schema and migration tests | Sprint 1.1 exit: company/instrument/listing history is persisted | Design baseline complete; runtime pending |
| SEC-03 歧义返回候选 | AIP-P0-SEC-03 | Data Engineering / Product | 1.2 | Ambiguous lookup contract tests | Sprint 1.2 exit: no silent guessing in tool responses | Not started |
| SEC-04 上市状态/币种/覆盖 | AIP-P0-SEC-04 | Data Engineering | 1.2 | Profile fixture tests for listed/suspended/delisted coverage | Sprint 1.2 exit: profile tool exposes status/currency/coverage | Not started |

## Agent Runtime

| requirement | issue_ref | owner | sprint | test_gate | release_gate | implementation_state |
|---|---|---|---|---|---|---|
| AGT-01 流式 + 工具进度 | AIP-P0-AGT-01 | Agent Runtime Engineering | 1.3 | Streaming response and progress event tests | Sprint 1.3 exit: user-visible progress without chain-of-thought | Not started |
| AGT-02 调用前口径解析 | AIP-P0-AGT-02 | Agent Runtime Engineering / Product | 1.3 | Pre-tool disambiguation tests | Sprint 1.3 exit: securities/time/currency/methodology resolved before tools | Not started |
| AGT-03 单 run 预算上限 | AIP-P0-AGT-03 | Agent Runtime Engineering / Billing | 1.3 | Run budget exhaustion tests | Sprint 1.3 exit: budget limit stops gracefully with partial evidence | Not started |
| AGT-04 仅注册工具 | AIP-P0-AGT-04 | Platform Engineering / Security | 1.2 / 1.3 | Tool registry allowlist denial tests | Sprint 1.3 exit: unregistered tool and arbitrary SQL are rejected | Not started |
| AGT-05 数字来自工具/计算 | AIP-P0-AGT-05 | Agent Runtime Engineering / Quality | 1.3 | Evidence-binding eval tests | Sprint 1.3 exit: sourced financial numbers only | Not started |
| AGT-06 事实/计算/推断/未知 | AIP-P0-AGT-06 | Agent Runtime Engineering / Product | 1.3 | Answer classification snapshot tests | Sprint 1.3 exit: response layers are visible and consistent | Not started |
| AGT-07 来源引用证据卡片 | AIP-P0-AGT-07 | Product Engineering / Data | 1.3 | Evidence card click-through tests | Sprint 1.3 exit: every cited number opens source/as-of/version | Not started |
| AGT-08 失败恢复/局部重试 | AIP-P0-AGT-08 | Agent Runtime Engineering | 1.3 | Partial failure retry and billing tests | Sprint 1.3 exit: single tool failure does not lose the run | Not started |
| AGT-09 长任务转 Workflow | AIP-P0-AGT-09 | Agent Runtime Engineering / Platform | 2.4 | Workflow handoff/resume tests | Sprint 2.4 exit: long tasks return resumable `task_id` | Not started |

## Stock Workbench

| requirement | issue_ref | owner | sprint | test_gate | release_gate | implementation_state |
|---|---|---|---|---|---|---|
| STK-01 公司/证券档案 | AIP-P0-STK-01 | Product Engineering / Data | 1.2 / 1.4 | Profile tool and UI contract tests | Sprint 1.4 exit: company/security profile visible internally | Not started |
| STK-02 价格/回报/回撤/基准 | AIP-P0-STK-02 | Data Engineering / Analytics | 1.4 | Price history and return calculation golden tests | Sprint 1.4 exit: price views match golden methodology | Not started |
| STK-03 财务三表事实趋势 | AIP-P0-STK-03 | Data Engineering | 1.4 | Financial facts point-in-time tests | Sprint 1.4 exit: facts show period/currency/unit/published/restated version | Not started |
| STK-04 估值/盈利派生指标 | AIP-P0-STK-04 | Analytics Engineering | 1.4 | Metric library formula tests | Sprint 1.4 exit: derived metrics expose definitions and anomaly handling | Not started |
| STK-05 公司行动时间线 | AIP-P0-STK-05 | Data Engineering | 1.4 | Corporate action chronology fixture tests | Sprint 1.4 exit: actions are traceable and affect adjusted series correctly | Not started |
| STK-06 公告与文件检索 | AIP-P0-STK-06 | Product Engineering / Document | 1.4 / 2.2 | Announcement search contract tests | Sprint 2.2 exit: announcements link to original evidence | Not started |

## Analytics

| requirement | issue_ref | owner | sprint | test_gate | release_gate | implementation_state |
|---|---|---|---|---|---|---|
| ANA-01 2-5 证券比较 | AIP-P0-ANA-01 | Analytics Engineering | 2.1 | Comparison fixture tests across 2-5 securities | Sprint 2.1 exit: comparison handles currency/unit incompatibility | Not started |
| ANA-02 同业/指数/历史分位 | AIP-P0-ANA-02 | Analytics Engineering / Data | 2.1 | Peer/index/percentile point-in-time tests | Sprint 2.1 exit: benchmark and constituents are as-of correct | Not started |
| ANA-03 自然语言筛选 | AIP-P0-ANA-03 | Analytics Engineering / Agent Runtime | 2.1 | Natural-language to structured filter tests | Sprint 2.1 exit: conditions are editable before execution | Not started |
| ANA-04 命中原因可解释 | AIP-P0-ANA-04 | Analytics Engineering / Product | 2.1 | Ranking explanation snapshot tests | Sprint 2.1 exit: each hit exposes why it matched | Not started |
| ANA-07 收益/波动/回撤/Beta | AIP-P0-ANA-07 | Analytics Engineering | 2.1 | Deterministic calculation golden tests | Sprint 2.1 exit: return/risk metrics are inside defined tolerance | Not started |

## Documents And Research

| requirement | issue_ref | owner | sprint | test_gate | release_gate | implementation_state |
|---|---|---|---|---|---|---|
| DOC-01 公告检索 | AIP-P0-DOC-01 | Document Engineering | 2.2 | Announcement index search tests | Sprint 2.2 exit: search by company/date/category/keyword works | Not started |
| DOC-02 原文定位摘录 | AIP-P0-DOC-02 | Document Engineering / Product | 2.2 | Citation locator tests | Sprint 2.2 exit: excerpts locate to page/paragraph/source record | Not started |
| DOC-03 文档作不可信数据 | AIP-P0-DOC-03 | Security Engineering / Document | 2.2 / Always-on A3 | Prompt-injection fixture tests | Sprint 2.2 exit: document text cannot change system/tool policy | Not started |
| RES-01 保存完整 run | AIP-P0-RES-01 | Product Engineering / Platform | 2.2 | Run persistence and replay contract tests | Sprint 2.2 exit: saved run includes question/tools/evidence/model/prompt versions | Not started |

## MCP Platform

| requirement | issue_ref | owner | sprint | test_gate | release_gate | implementation_state |
|---|---|---|---|---|---|---|
| MCP-01 Streamable HTTP endpoint | AIP-P0-MCP-01 | Platform Engineering | 2.3 | MCP initialize/tools/list/tools/call protocol tests | Sprint 2.3 exit: `/mcp` passes target client smoke tests | Not started |
| MCP-02 OAuth + PKCE | AIP-P0-MCP-02 | Platform Engineering / Security | 2.3 | OAuth PKCE authorization tests | Sprint 2.3 exit: scopes are visible and revocable | Not started |
| MCP-03 服务端 API Key | AIP-P0-MCP-03 | Platform Engineering / Security | 2.3 | API key hash/rotation/IP limit tests | Sprint 2.3 exit: server-to-server keys are controlled and auditable | Not started |
| MCP-04 输入/输出 Schema | AIP-P0-MCP-04 | Platform Engineering | 1.2 / 2.3 | JSON Schema validation tests | Sprint 2.3 exit: tools expose strict input/output schemas | Contract scaffold started; tool schemas pending |
| MCP-05 版本与弃用 | AIP-P0-MCP-05 | Platform Engineering | 2.3 | Tool version compatibility tests | Sprint 2.3 exit: breaking changes use new major version | Not started |
| MCP-06 分页/行数/范围限制 | AIP-P0-MCP-06 | Platform Engineering / Data | 2.3 | Pagination and entitlement bypass tests | Sprint 2.3 exit: limits cannot bypass plans or rights | Not started |
| MCP-07 usage/剩余/request_id | AIP-P0-MCP-07 | Platform Engineering / Billing | 2.3 | Usage envelope reconciliation tests | Sprint 2.3 exit: calls expose usage and request IDs | Contract scaffold started; runtime ledger pending |
| MCP-08 标准错误码 | AIP-P0-MCP-08 | Platform Engineering | 1.2 / 2.3 | Error envelope contract tests | Sprint 2.3 exit: clients distinguish auth/right/limit/data/system errors | Contract scaffold started; tool integration pending |
| MCP-09 Developer Console | AIP-P0-MCP-09 | Product Engineering / Platform | 2.3 | Console first-call smoke tests | Sprint 2.3 exit: target client first call median below 10 minutes | Not started |
| MCP-11 工具级速率/并发/预算 | AIP-P0-MCP-11 | Platform Engineering / Billing | 2.3 | Rate/concurrency/budget limiter tests | Sprint 2.3 exit: high-cost tools cannot starve normal queries | Not started |
| MCP-12 兼容性测试/状态页 | AIP-P0-MCP-12 | Platform Engineering / Developer Relations | 2.3 / 3.2 | MCP Inspector and status page smoke tests | Sprint 3.2 exit: protocol compatibility and status are public | Not started |

## Data Governance

| requirement | issue_ref | owner | sprint | test_gate | release_gate | implementation_state |
|---|---|---|---|---|---|---|
| DAT-01 不可变原始快照 | AIP-P0-DAT-01 | Data Engineering | 1.1 | Raw snapshot immutability tests | Sprint 1.1 exit: derived values trace to original batches | Design baseline complete; storage pending |
| DAT-02 统一证券主表 | AIP-P0-DAT-02 | Data Engineering | 0.2 / 1.1 | Security master schema tests | Sprint 1.1 exit: company/security/listing/code history persisted | Design baseline complete; storage pending |
| DAT-03 财务事实与重述 | AIP-P0-DAT-03 | Data Engineering | 0.2 / 1.1 | Restatement versioning tests | Sprint 1.1 exit: multiple disclosures are preserved | Schema scaffold complete; partner data and Serving pending |
| DAT-04 公司行动与复权引擎 | AIP-P0-DAT-04 | Data Engineering / Analytics | 1.1 | Corporate action adjustment golden tests | Sprint 1.1 exit: adjusted series matches golden samples | Not started |
| DAT-05 字段级数据授权 | AIP-P0-DAT-05 | Compliance / Data Engineering | 0.1 / 1.1 | Rights matrix enforcement tests | Gate 0 and Sprint 1.1 exit: default deny at runtime | External approvals pending; runtime pending |
| DAT-06 数据质量与隔离 | AIP-P0-DAT-06 | Data Engineering / Quality | 0.3 / 1.1 | Quality hold and serving isolation tests | Sprint 1.1 exit: severe anomalies do not enter Serving Store | Design baseline complete; runtime pending |
| DAT-07 指标定义与方法论库 | AIP-P0-DAT-07 | Analytics Engineering / Data | 0.2 | Metric method version tests | Sprint 0.2 exit: metric definitions have versioned methodology | Design baseline complete |
| DAT-09 来源/血缘/证据快照 | AIP-P0-DAT-09 | Data Engineering / Platform | 1.2 | Provenance envelope and lineage tests | Sprint 1.2 exit: every tool response carries provenance | Contract scaffold started; lineage service pending |
| DAT-10 合作方 SLA 与对账 | AIP-P0-DAT-10 | Data Operations / Business | 0.1 / 3.2 | SLA lag/missing/error report tests | Sprint 3.2 exit: partner reports support status and settlement | External approvals pending |

## Open Follow-up

- Replace repo-local `issue_ref` with external tracker links if/when the
  project selects GitHub Issues, Linear, Jira, or another tracker.
- Replace role owners with named accountable owners before release sign-off.
- Connect each `test_gate` to concrete test files as implementation lands.
