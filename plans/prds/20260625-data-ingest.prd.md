可以。你的场景最适合：

```text
常开 Mac mini
    ↓
Codex Project Automation
    ↓
$hkex-news-daily Skill
    ↓
data-ingest CLI
    ↓
Scrapy 爬虫引擎
    ↓
Postgres + 本地原始文件存储
```

**不是在 CLI 和成熟开源爬虫之间二选一。**
`data-ingest` 是稳定的执行入口，Scrapy 是 CLI 内部使用的抓取引擎，Codex Automation 负责定时触发、读取结果和异常汇报。

Codex 的项目级 Automation 正好支持这种模式，但 Mac mini 必须保持开机、Codex App 保持运行、项目目录继续存在；Automation 也可以显式调用 Skill，并将每次独立运行的结果放入 Triage。([OpenAI Developers][1])

## 各层职责

| 组件                | 负责什么                        | 不负责什么             |
| ----------------- | --------------------------- | ----------------- |
| Codex Automation  | 定时触发、调用 Skill、汇报异常          | 不自己临场写爬虫          |
| Skill             | 规定命令、边界、失败处理                | 不实现业务逻辑           |
| `data-ingest` CLI | run 生命周期、锁、幂等、版本、状态、JSON 输出 | 不负责智能调度           |
| Scrapy            | 请求队列、并发、重试、限速、页面解析、下载       | 不决定数据发布           |
| Postgres          | source of truth、版本、事实、质量状态  | 不保存大 PDF binary   |
| 文件存储              | HTML/PDF 原始证据               | 不直接作为 serving 数据源 |

## 为什么用了 Scrapy，仍然需要 CLI

直接让 Codex 执行：

```bash
scrapy crawl hkex_news
```

可以跑，但缺少你的数据治理语义：

* 不知道本次对应哪个 `crawl_run_id`
* 不知道哪个 `data_version`
* 不知道应保持 `held`
* 不知道怎样取得 PostgreSQL advisory lock
* 不知道跨日、跨版本如何幂等
* 不知道失败后从哪个业务阶段恢复
* 不知道怎样输出 Codex 可判断的统一 JSON
* 容易绕过 `raw → document → extraction → serving`

所以应当变成：

```bash
data-ingest hkex daily \
  --business-date today \
  --timezone Asia/Hong_Kong \
  --until held \
  --output json
```

CLI 内部再启动 Scrapy。

Scrapy 很适合承担网络抓取部分：它原生支持持久化请求队列、已访问请求去重和 spider state，并可通过 `JOBDIR` 恢复被正常中断的 crawl；其 Item Pipeline 也适合执行清洗、字段校验、重复过滤和落库前处理。([docs.scrapy.org][2])

不过，Scrapy 的请求去重不能替代数据库级的：

```text
canonical_url
source_record_id
content_hash_sha256
document_id
data_version
```

这些仍由 `data-ingest` 和 Postgres 负责。

## 推荐的 CLI 内部流程

```text
data-ingest hkex daily
│
├── 1. acquire advisory lock
├── 2. resolve Asia/Hong_Kong business date
├── 3. create/reuse raw_source_batch
├── 4. create/reuse crawl_run
├── 5. create held data_version
│
├── 6. invoke Scrapy
│   ├── discover
│   ├── request dedupe
│   ├── fetch
│   ├── retry/backoff
│   ├── calculate hash
│   ├── persist raw HTML/PDF
│   └── write document metadata
│
├── 7. sanitize changed documents
├── 8. extract facts
├── 9. link IPO entity
├── 10. deterministic validation
├── 11. finalize run as completed/failed
└── 12. emit one JSON result
```

日常命令只能运行到：

```text
release_state = held
```

发布仍然使用另一个命令：

```bash
data-ingest release \
  --data-version dv_20260624_xxx \
  --approval-id approval_xxx
```

并且每日 Automation 永远不能调用它。

## CLI 最小命令集

第一版只需要这些：

```bash
# 每日抓取、抽取、校验，停在 held
data-ingest hkex daily \
  --business-date today \
  --timezone Asia/Hong_Kong \
  --until held \
  --output json

# 查看运行状态
data-ingest run status \
  --run-id cr_20260624_xxx \
  --output json

# 恢复可重试的失败任务
data-ingest run resume \
  --run-id cr_20260624_xxx \
  --output json

# 重新校验
data-ingest validate \
  --data-version dv_20260624_xxx \
  --output json

# 独立发布
data-ingest release \
  --data-version dv_20260624_xxx \
  --approval-id approval_xxx \
  --output json
```

进一步建议让 `daily` 自动处理恢复逻辑：

```text
当前业务日期有 running/retryable run
    → resume

已经 completed 且没有新内容
    → no_change

已有另一个进程持有锁
    → skipped_locked

不存在可恢复任务
    → 创建新 run
```

这样 Codex 不需要自行判断数据库状态。

## Mac mini 上的推荐布局

```text
~/Projects/hkex-data-ingest/
├── AGENTS.md
├── pyproject.toml
├── scrapy.cfg
├── .agents/
│   └── skills/
│       └── hkex-news-daily/
│           └── SKILL.md
├── src/
│   └── data_ingest/
│       ├── cli.py
│       ├── run_service.py
│       ├── db/
│       ├── storage/
│       ├── hkex/
│       │   ├── spiders/
│       │   │   └── hkex_news.py
│       │   ├── items.py
│       │   ├── pipelines.py
│       │   └── settings.py
│       ├── extraction/
│       ├── validation/
│       └── release/
├── migrations/
├── schemas/
│   └── daily-run-result.schema.json
└── runtime/
    ├── scrapy-jobs/
    ├── reports/
    └── logs/
```

原始文件可以放到独立数据盘：

```text
/Volumes/HKEXData/raw/sha256/ab/cd/<sha256>.pdf
```

数据库记录：

```text
file:///Volumes/HKEXData/raw/sha256/ab/cd/<sha256>.pdf
```

继续使用 `storage_uri`，以后迁移到 S3 或 MinIO 时无需改表结构。

## Skill 应非常薄

Skill 是可复用工作流说明，可包含指令、资源和可选脚本；Codex Automation 可以通过 `$skill-name` 显式调用。([OpenAI Developers][3])

```md
---
name: hkex-news-daily
description: Execute the audited HKEX News daily ingestion CLI and report its JSON result. Never release data.
---

# HKEX News daily ingestion

Execute exactly:

data-ingest hkex daily \
  --business-date today \
  --timezone Asia/Hong_Kong \
  --until held \
  --output json

Rules:

- Do not edit source code.
- Do not generate or execute SQL manually.
- Do not invoke data-ingest release.
- Do not retry by creating another data version.
- Let the CLI perform locking, idempotency and resume handling.
- Return the CLI JSON result.
- If the command exits non-zero, report exit_code, error_code,
  failed_stage, retryable and data_version.
```

这里不建议在 Skill 里放复杂 shell。让它直接调用已安装的 CLI。

## Codex Automation Prompt

建议使用独立的 project automation，而不是持续复用聊天上下文的 thread automation，因为每天的数据抓取应当是独立 run。Codex 官方也把独立运行的周期任务归为 standalone/project automation，并支持自定义 cron。([OpenAI Developers][1])

```text
Run $hkex-news-daily.

This is an unattended production data-ingestion run.

Requirements:
- Execute only the command defined by the skill.
- Do not edit repository files.
- Do not run psql manually.
- Do not generate SQL.
- Do not invoke data-ingest release.
- Do not change a held data version to released.
- Do not create a second run to compensate for an existing failed run.
- Trust the CLI to handle locking, resumption and idempotency.
- Return the structured JSON result.
- Surface failed, warning, held_quality_failure and retryable runs in Triage.
- Treat completed, no_change and skipped_locked as normal outcomes.
```

## 权限不要直接开 Full Access

Codex Automation 使用默认 sandbox。只读模式无法进行网络访问或写文件；完全访问则会增加无人值守任务的风险。官方建议采用 `workspace-write`，并通过 rules 精确放行所需命令。([OpenAI Developers][1])

建议把 CLI 安装到固定路径：

```text
/Users/aimpact/.local/bin/data-ingest
```

然后只允许每日命令：

```python
# ~/.codex/rules/hkex-ingest.rules

prefix_rule(
    pattern = [
        "/Users/aimpact/.local/bin/data-ingest",
        "hkex",
        "daily",
    ],
    decision = "allow",
    justification = "Allow the audited HKEX daily ingestion command.",
    match = [
        "/Users/aimpact/.local/bin/data-ingest hkex daily --business-date today --timezone Asia/Hong_Kong --until held --output json",
    ],
)
```

Codex Rules 支持按命令参数前缀进行 `allow`、`prompt` 或 `forbidden` 控制。([OpenAI Developers][4])

不要把 Automation 写成：

```bash
bash -lc "./scripts/run.sh"
```

也不要使用：

```bash
data-ingest hkex daily --date "$(date +%F)"
```

复杂 shell 包装会让权限规则更难审计。让 CLI 自己实现：

```bash
--business-date today
--timezone Asia/Hong_Kong
```

## Scrapy 应负责的范围

Scrapy 部分建议只输出 `DocumentItem`：

```python
class DocumentItem:
    source_record_id: str
    canonical_url: str
    document_url: str | None
    title_en: str | None
    title_zh_hant: str | None
    published_at: datetime | None
    category: str | None
    content_type: str
    response_body: bytes
    response_headers: dict[str, str]
```

Scrapy pipeline：

```text
NormalizeUrlPipeline
    ↓
SourceRecordIdentityPipeline
    ↓
ContentHashPipeline
    ↓
RawFileStoragePipeline
    ↓
DocumentMetadataPipeline
    ↓
StatsPipeline
```

不要在 Scrapy pipeline 中：

```text
写 core.ipo_offering
调用 release
覆盖 accepted fact
删除旧版本
让 LLM 直接执行 SQL
```

## 运行结果格式

Codex 最终只需读取：

```json
{
  "run_id": "cr_20260624_001",
  "data_version": "dv_20260624_001",
  "business_date": "2026-06-24",
  "timezone": "Asia/Hong_Kong",
  "status": "completed",
  "release_state": "held",
  "last_completed_stage": "validate",
  "counts": {
    "discovered": 46,
    "fetched": 12,
    "unchanged": 34,
    "changed": 5,
    "documents_persisted": 5,
    "facts_extracted": 93,
    "warnings": 1,
    "errors": 0
  },
  "retryable": false,
  "error_code": null,
  "error_summary": null
}
```

推荐退出码：

```text
0   completed / no_change
10  skipped_locked
20  retryable network failure
30  held_quality_failure
40  configuration failure
50  database/storage failure
60  invariant violation
```

## 最适合你的最终方案

```text
Mac mini 常开
├── Codex App 常驻
├── Codex Project Automation 每日触发
├── Repo Skill 约束运行方式
├── 固定安装的 data-ingest CLI
├── Scrapy 实现成熟抓取能力
├── 本地 PostgreSQL
├── 本地原始文档目录
└── 独立备份
```

现阶段不需要 Airflow、Prefect 或服务器部署。先把一个 `data-ingest hkex daily` 命令做成完全确定、可重跑、可恢复、输出固定 JSON 的执行单元，Codex Automation 只负责每天调用它和处理 Triage。

[1]: https://developers.openai.com/codex/app/automations "Automations – Codex app | OpenAI Developers"
[2]: https://docs.scrapy.org/en/latest/topics/jobs.html "Jobs: pausing and resuming crawls — Scrapy 2.16.0 documentation"
[3]: https://developers.openai.com/codex/skills "Agent Skills – Codex | OpenAI Developers"
[4]: https://developers.openai.com/codex/rules "Rules – Codex | OpenAI Developers"
