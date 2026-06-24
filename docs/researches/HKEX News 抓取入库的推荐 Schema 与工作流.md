# HKEX News 抓取入库的推荐 Schema 与工作流

## 调研结论

你的总体方向是对的：把 **HKEX News 视为 public inflow**，把 **Postgres 视为 runtime source of truth**，并坚持 **raw → document/content → extracted_fact → deterministic transform → release** 的分层，是最稳健的设计。这样做的原因，不只是工程整洁，更是因为 HKEXnews 本身是一个面向公众浏览与检索的披露平台，而不是默认授权你做再分发或“抓完直接 serving”的数据合同。HKEX 明确说明该站点资料是为向香港公众提供资讯而发布，不构成投资建议；资料由发行人、新上市申请人及相关方电子提交，HKEX 不负责筛选、编辑或核实；且有关资料的版权可能属于 HKEX、作者或其他方，未经相关方同意，不得复制、分发、使用或链接。与此同时，HKEX 也另外提供 **News Alerts**、**Market Data Services** 与 **Issuer Information feed Service (IIS)** 这类正式分发与授权路径。换句话说，**“公开可见”不等于“默认可重分发”**，所以你现在提出的 `default_deny`、`field_authorization_required=true`、`export_allowed=false`、`mcp_redistribution_allowed=false`，从源站规则看是合理而且稳妥的默认值。 citeturn1view2turn19view0turn19view1turn4view1

从数据面看，HKEXnews 不是单一入口，而是多个 surface 的组合。首页提供 **Title Search** 和 **Content Search**；**New Listing Information** 专门覆盖新上市公告、招股章程、配发结果以及新上市报告；**AP/PHIP** 页面又是一个独立入口；而 HKEX FAQ 还说明，**新上市申请进度报告**会按月发布在 HKEXnews 上。对 IPO 数据仓来说，这意味着你不能只靠一个 today 列表页，必须把 source surface 拆成至少：`latest_list`、`title_search`、`new_listing_information`、`ap_phip`、`progress_report` 五类，并在 schema 里显式记录来源面。 citeturn8view0turn14search5turn15view0turn17view0

如果你的业务重点是 IPO，**Title Search** 和 **New Listing Information** 才是核心，而不是只轮询最新公告页。HKEX 在新上市页面里明确写到，历史配发结果应通过 **Title Search** 检索；Title Search 还支持按股票代码/名称等维度查找；而搜索结果页提示存在 **1,000 条显示上限**。另外，Content Search 明确提醒，命中的文件可能后来被发行人 **cancelled、reissued 或 clarified**。这三点合起来，直接决定了你的抓取策略必须是：**增量轮询 + 滑动回补 + supersession 跟踪**，而不能只抓“今天最新”。 citeturn1view1turn14search11turn20view1

还有一个你草案里尚未显式建模、但实际上非常重要的点：**headline taxonomy 不是单值，也不是永久不变**。HKEX 的 headline guide 明确要求发行人在电子披露时选择 **所有适用 headline**，因为 headline 是公众在线检索的重要分类基础；如果一个文件涉及多个主题，就要选多个 headline。与此同时，IIS 的技术文件又显示 headline 传输规范会更新，例如 2026 年 7 月 1 日起移除三个 Tier 2 headline category。也就是说，`category` / `subcategory` 这两个单值字段不够，需要单独的 headline 子表，并保留 taxonomy/version 的概念。 citeturn11view2turn19view1

## 为什么现有草案还要改

你现在那版草案最值得保留的，是“**不直接写 serving 表**”和“**release_state 先 held，校验完成再 released**”这两条主线。我建议改的，不是方向，而是几个关键建模细节。

第一，`core.hkex_news_document` 不应该按 `data_version` 去唯一化。**文档本身是一个稳定实体**，而 `data_version` 代表某次抓取/发布批次下对这个实体的一个观察、快照或解释结果。如果你把同一份 PDF 因为出现在不同 crawl batch 就重复插成多行 document，你后面会在去重、supersession、内容重抽取、权限审计上付出很大代价。更稳的做法是：`document` 做 **canonical identity**，`observation` / `raw_snapshot` 做 **per-batch available state**。这个改动没有改变你“版本化”的原则，只是把版本化放到正确层级。这个设计也更适合后续用 Postgres 的 `ON CONFLICT DO UPDATE` 做幂等 upsert。 citeturn22view2turn13search12

第二，你现在的 `category` / `subcategory` 会丢信息。因为 HKEX 明确要求可以同时选多个 headline，并且 headline 本来就是搜索分类的一部分，所以应该拆成 `core.hkex_news_document_headline` 子表，至少存 `tier_1`、`tier_2`、`source_order`、`official_taxonomy_version`。如果你未来接入 IIS 或者用其 Transmission Specification 做 category code 对照，这个表还能平滑扩展成 code+label 双存。 citeturn11view2turn19view1

第三，你还需要显式建模 **document lifecycle / supersession**。因为 HKEX 自己就在 Content Search 里提醒，文档可能后来被取消、重发或澄清；而 AP/PHIP 页面则说明被标成 **Inactive** 的旧文件不可访问，只能查看最新提交的 Application Proof 与后续 PHIP/声明材料。也就是说，你的系统不能把“抓到一份文件”简化为“这就是最终版本”。你需要最少一个 `document_state` 字段，最好再加一个 `document_relation` 表，表示 `supersedes` / `clarifies` / `reissues` 等关系。 citeturn20view1turn20view2

第四，`AP/PHIP` 不能和普通公开公告完全等价。AP/PHIP 页面本身带有 warning statement，要求访问者确认符合相关法律与地区条件，而且 Inactive 内容不可访问。因此，即便你决定抓这部分，也应该在 schema 里把它单独标记为不同 `access_policy` 或 `source_surface`，不要和一般的 listed company announcement 混成一种“无条件公开”材料。 citeturn15view0turn20view2

## 推荐 schema

下面这版是**在你现有 foundation 上做增量**，不是推倒重来。保留你已有的：

- `core.raw_source_batch`
- `core.raw_snapshot`
- `core.data_version_batch`
- `core.ipo_*` serving tables
- `governance.ipo_contract`

我建议新增或调整为下面这些表。重点改动有四件事：**document 去 data_version 化**、**增加 observation 层**、**headline 独立建表**、**extract/transform run 明确化**。

```sql
-- Existing foundation remains authoritative:
-- core.raw_source_batch
-- core.raw_snapshot
-- core.data_version_batch
-- core.ipo_* serving tables
-- governance.ipo_contract

create table core.hkex_news_crawl_run (
  crawl_run_id text primary key,
  source_name text not null default 'hkex_news',
  source_surface text not null
    check (source_surface in (
      'latest_list',
      'title_search',
      'content_search',
      'new_listing_information',
      'ap_phip',
      'progress_report'
    )),
  target_url text not null,
  crawl_scope text not null, -- ipo, listing_document, allotment, announcement, pipeline
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null
    check (status in ('running','completed','failed','cancelled')),
  request_fingerprint text not null,
  discovered_count integer not null default 0,
  fetched_count integer not null default 0,
  changed_count integer not null default 0,
  error_count integer not null default 0,
  error_summary text,
  data_version text not null references core.data_version_batch(data_version),
  created_at timestamptz not null default now()
);

-- Stable canonical document identity
create table core.hkex_news_document (
  document_id text primary key,
  source_name text not null default 'hkex_news',
  source_record_id text not null,
  canonical_url text not null,
  document_url text,
  title_en text,
  title_zh_hant text,
  issuer_name_en text,
  issuer_name_zh_hant text,
  hkex_code text,
  market text not null default 'UNKNOWN'
    check (market in ('MAIN','GEM','UNKNOWN')),
  published_at timestamptz,
  language text not null default 'unknown'
    check (language in ('en','zh_hant','zh_hans','mixed','unknown')),
  content_type text, -- html/pdf/xlsx/etc
  latest_content_hash_sha256 text,
  document_state text not null default 'unknown'
    check (document_state in (
      'active','cancelled','reissued','clarified','inactive','unknown'
    )),
  access_policy text not null default 'public_general'
    check (access_policy in (
      'public_general',
      'public_new_listing',
      'public_ap_phip_warning_gate',
      'unknown'
    )),
  rights_policy_version text not null,
  quality_state text not null default 'HOLD'
    check (quality_state in ('PASS','WARN','HOLD','REJECT_RAW')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (source_name, source_record_id),
  unique (canonical_url)
);

-- Per-run observation of a document
create table core.hkex_news_document_observation (
  document_observation_id text primary key,
  document_id text not null references core.hkex_news_document(document_id),
  crawl_run_id text not null references core.hkex_news_crawl_run(crawl_run_id),
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  source_surface text not null
    check (source_surface in (
      'latest_list',
      'title_search',
      'content_search',
      'new_listing_information',
      'ap_phip',
      'progress_report'
    )),
  source_page_url text not null,
  result_rank integer,
  discovered_at timestamptz not null default now(),
  fetched_at timestamptz,
  http_status integer,
  etag text,
  last_modified text,
  observed_content_hash_sha256 text,
  is_changed boolean not null default false,
  unique (document_id, crawl_run_id, source_page_url)
);

-- Multiple official headlines per document
create table core.hkex_news_document_headline (
  document_headline_id text primary key,
  document_id text not null references core.hkex_news_document(document_id),
  market text not null
    check (market in ('MAIN','GEM','UNKNOWN')),
  tier_1 text not null,
  tier_2 text not null,
  headline_label_en text,
  headline_label_zh_hant text,
  source_order integer not null default 1,
  official_taxonomy_version text not null,
  unique (document_id, tier_1, tier_2, official_taxonomy_version)
);

-- Relationship between documents, e.g. reissue / clarification
create table core.hkex_news_document_relation (
  document_relation_id text primary key,
  from_document_id text not null references core.hkex_news_document(document_id),
  to_document_id text not null references core.hkex_news_document(document_id),
  relation_type text not null
    check (relation_type in (
      'supersedes',
      'clarifies',
      'reissues',
      'same_ipo_case',
      'same_applicant'
    )),
  confidence numeric check (confidence >= 0 and confidence <= 1),
  matched_by text not null, -- title_parser, url_pattern, issuer_code, manual, llm
  data_version text not null references core.data_version_batch(data_version),
  created_at timestamptz not null default now(),
  unique (from_document_id, to_document_id, relation_type, data_version)
);

-- Sanitised content; binary in object storage
create table core.hkex_news_document_content (
  document_content_id text primary key,
  document_id text not null references core.hkex_news_document(document_id),
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  storage_uri text,
  binary_hash_sha256 text not null,
  raw_text text,
  sanitized_text text,
  sanitized_html text,
  sanitizer_version text not null,
  extraction_ready boolean not null default false,
  prompt_injection_isolated boolean not null default true,
  created_at timestamptz not null default now(),
  unique (document_id, sanitizer_version, binary_hash_sha256)
);

create table core.ipo_source_document_link (
  ipo_source_document_link_id text primary key,
  offering_id text references core.ipo_offering(offering_id),
  app_code text references core.ipo_pipeline_application(app_code),
  document_id text not null references core.hkex_news_document(document_id),
  link_type text not null, -- prospectus, phip, allotment_result, listing_approval, announcement
  confidence numeric check (confidence >= 0 and confidence <= 1),
  matched_by text not null, -- hkex_code, issuer_name, title_parser, progress_report, manual
  data_version text not null references core.data_version_batch(data_version),
  created_at timestamptz not null default now(),
  unique (document_id, link_type, data_version)
);

create table core.hkex_news_extraction_run (
  extraction_run_id text primary key,
  document_id text not null references core.hkex_news_document(document_id),
  document_content_id text not null references core.hkex_news_document_content(document_content_id),
  extractor_name text not null,
  extractor_version text not null,
  run_kind text not null
    check (run_kind in ('deterministic','llm','hybrid')),
  model_name text,
  prompt_version text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null
    check (status in ('running','completed','failed','cancelled')),
  error_summary text,
  data_version text not null references core.data_version_batch(data_version),
  created_at timestamptz not null default now()
);

create table core.hkex_news_extracted_fact (
  extracted_fact_id text primary key,
  extraction_run_id text not null references core.hkex_news_extraction_run(extraction_run_id),
  document_id text not null references core.hkex_news_document(document_id),
  offering_id text references core.ipo_offering(offering_id),
  app_code text references core.ipo_pipeline_application(app_code),
  fact_namespace text not null default 'ipo',
  fact_key text not null, -- listing_date, final_offer_price, one_lot_success_rate, etc
  value_type text not null
    check (value_type in ('text','numeric','date','timestamp','boolean','json')),
  value_text text,
  value_numeric numeric,
  value_date date,
  value_timestamptz timestamptz,
  value_boolean boolean,
  value_json jsonb not null default '{}'::jsonb,
  unit text,
  currency text,
  lang text
    check (lang in ('en','zh_hant','zh_hans','unknown')),
  locator jsonb not null default '{}'::jsonb, -- page/section/table/row/cell/span
  locator_hash text not null,
  confidence numeric check (confidence >= 0 and confidence <= 1),
  review_state text not null default 'pending'
    check (review_state in ('pending','accepted','rejected','superseded')),
  raw_snapshot_id text references core.raw_snapshot(raw_snapshot_id),
  data_version text not null references core.data_version_batch(data_version),
  quality_state text not null default 'HOLD'
    check (quality_state in ('PASS','WARN','HOLD','REJECT_RAW')),
  created_at timestamptz not null default now(),
  unique (document_id, fact_key, locator_hash, data_version)
);

create table core.hkex_news_transform_run (
  transform_run_id text primary key,
  source_name text not null default 'hkex_news',
  data_version text not null references core.data_version_batch(data_version),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null
    check (status in ('running','completed','failed','cancelled')),
  accepted_fact_count integer not null default 0,
  upserted_offering_count integer not null default 0,
  upserted_timetable_event_count integer not null default 0,
  upserted_allotment_summary_count integer not null default 0,
  validation_report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index hkex_news_document_code_date_idx
  on core.hkex_news_document(hkex_code, published_at desc);

create index hkex_news_document_state_idx
  on core.hkex_news_document(document_state, published_at desc);

create index hkex_news_document_obs_version_idx
  on core.hkex_news_document_observation(data_version, discovered_at desc);

create index hkex_news_document_headline_idx
  on core.hkex_news_document_headline(tier_1, tier_2);

create index hkex_news_extracted_fact_offering_idx
  on core.hkex_news_extracted_fact(offering_id, fact_key, data_version);

create index hkex_news_extracted_fact_locator_gin
  on core.hkex_news_extracted_fact
  using gin(locator);

create index hkex_news_extracted_fact_value_json_gin
  on core.hkex_news_extracted_fact
  using gin(value_json);
```

这版 schema 的核心思想是：**document 是实体，observation 是版本观察，content 是可重算对象，fact 是候选事实，serving 永远只吃 accepted facts**。之所以把 headline 做成子表、把 relation 做成单独表，是因为 HKEX headline 支持多选且 taxonomy 会变化，而 Content Search 又明确存在 cancelled/reissued/clarified 的情况。之所以保留 `locator` 和 `value_json` 为 `jsonb`，是因为 PostgreSQL 对 `jsonb` 提供原生操作与 GIN 索引，适合半结构化定位信息和提取结果；而 serving 层写入则适合使用 `INSERT ... ON CONFLICT DO UPDATE` 做原子 upsert。 citeturn11view2turn19view1turn23view0turn22view2

如果数据量明显上来，我建议只对 **`hkex_news_document_observation`** 和 **`hkex_news_extracted_fact`** 做按月分区，不要一开始就把所有表都分区。PostgreSQL 的 declarative partitioning 很适合“按月新建、按月归档/清理”的场景，但要注意：**partitioned table 的唯一约束/主键必须包含分区键**，否则无法跨分区保证唯一性。所以如果你未来要分区，这会反过来影响主键、unique key 与索引设计。 citeturn21view0

## 推荐自动化 workflow

在抓取策略上，我建议不要把整个系统视作“一个爬虫”，而是视作 **三个 source-specific ingestion jobs + 一个统一 release pipeline**。

第一条 job 是 **near-real-time discovery**。它轮询 `latest_list` 与 `new_listing_information`，目标是尽快发现新 IPO 相关文件。之所以要保留 `new_listing_information` 这条专用链路，是因为 HKEX 把新上市公告、招股章程、配发结果、新上市报告放在专门页面里，而且历史配发结果还要求回到 Title Search 继续查。这条 job 只负责发现链接、抓 metadata、计算 fingerprint 并创建 `crawl_run` 与 `document_observation`；如果发现新的 `source_record_id` 或新的内容 hash，再进入 fetch。 citeturn14search5turn1view1

第二条 job 是 **historical backfill / reconciliation**。它使用 `title_search` 做滑动时间窗补抓，例如按 “过去 3 天、过去 14 天、过去 90 天” 三个层次循环跑；如果某个查询窗口的结果接近或达到页面显示上限，就继续拆小时间窗。这样做是因为 Title Search 存在结果显示上限，而 latest pages 只适合近实时，不适合作为完整历史来源。你可以把 IPO 相关 headline 作为主过滤器，例如 `Allotment Results`、`Prospectus`、`Supplemental Information regarding IPO`、`Application Proof/PHIP` 等。 citeturn14search11turn10search1turn10search3

第三条 job 是 **pipeline auxiliary discovery**。它抓 `progress_report` 与 `ap_phip`。这里的目标不是直接喂 serving 表，而是尽量提前建立 `app_code`、申请人名称、市场板块、申请状态与文档链路。HKEX FAQ 说明新上市申请的 monthly progress report 会发布在 HKEXnews 上，PHIP 则是在上市委员会原则性批准后发布的近最终版上市文件；AP/PHIP 页面同时又有 warning statement 与 Inactive 访问限制。因此，这条 job 的产出更适合作为 **pipeline application entity enrichment**，而不是默认直接放入开放导出的 serving 视图。 citeturn17view0turn15view0turn20view2

在处理链路上，建议每次自动化都严格做下面这件事：**先建 `core.raw_source_batch` + `core.data_version_batch(release_state='held')`**，然后所有后续对象都挂在这个 held 版本下面。只有当 crawl/fetch/sanitize/extract/transform/validation/gov 全部通过，才允许把 `data_version_batch.release_state` 切到 `released`。这一步虽然是你自己的设计决定，但它和 HKEX 的 source characteristics 是相匹配的：因为站点资料本身不由 HKEX 核实，而且 content search 还可能命中后来被取消、重发或澄清的文件，所以中间层必须允许“先入 raw，再决定是否进入 serving”。 citeturn1view2turn20view1

在 extraction 层，我建议使用 **deterministic-first, LLM-second**。像 `stock code`、`publish time`、`headline`、`market`、`title`、表格中的 allotment 指标、日期与金额，优先用 deterministic parser 做；只有当 table parser、regex 和规则映射无法稳定抽出时，才让 LLM 从 `sanitized_text` 或 `sanitized_html` 提取，并强制输出 `locator`、`confidence` 与 `extractor_version`。这样一来，LLM 只是补洞，不是主来源。由于 HKEX headlines 是公开分类、IIS 也有正式 transmission spec，所以这部分最适合先做规则映射，再让 LLM 解释上下文。 citeturn11view2turn19view1

在 transform 层，最好把 serving upsert 当成一个**纯 deterministic projection**：只消费 `accepted` facts，把它们映射到 `core.ipo_offering`、`core.ipo_timetable_event`、`core.ipo_allotment_summary` 等表，并在事务里使用 `INSERT ... ON CONFLICT DO UPDATE`。PostgreSQL 文档明确说明 `ON CONFLICT DO UPDATE` 能保证原子的 insert-or-update outcome，这非常适合 release 阶段的幂等回放。 citeturn13search0turn13search12

## 治理与发布控制

你的治理判断值得保留，而且我会把它写得更硬一点。原因并不在于“HKEX News 不是公开数据”——它显然是公开可见的；真正的问题在于，**公开浏览**和**授权分发**是两回事。HKEXnews 的免责声明与版权声明已经把这件事讲得很清楚，而 HKEX 同时又单列了 IIS、Market Data Services 与 Data Licensing 这些正式授权路径。这意味着你的系统在 rights review 完成前，最安全的默认方案就是：

```sql
governance.ipo_contract.default_deny = true
governance.ipo_contract.field_authorization_required = true
governance.ipo_contract.export_allowed = false
governance.ipo_contract.mcp_redistribution_allowed = false
```

如果以后业务真的需要对外再分发、做 API 产品，或者需要更稳定低延迟、更清晰授权边界的 issuer news，那么技术路径就不应再是“继续增强网页抓取”，而应转向 **IIS / Data Licensing**。这不是架构洁癖，而是因为 HKEX 已经把“浏览入口”和“授权数据服务”分成了两条线。 citeturn1view2turn19view0turn19view1

发布前的校验，我建议至少做五层。第一层是 **ingestion completeness**：`discovered_count`、`fetched_count`、`changed_count`、`error_count` 是否与预期一致。第二层是 **content integrity**：对象存储中的 binary hash、`raw_snapshot` hash 与 `document_content.binary_hash_sha256` 是否一致。第三层是 **schema quality**：headline 是否落入官方 taxonomy，`market` 是否只在 `MAIN/GEM/UNKNOWN` 内，`published_at` 是否可解析。第四层是 **extraction quality**：关键 IPO facts 是否具有非空 `locator`、合理 `confidence`、且未被 review reject。第五层是 **governance**：字段级授权、source surface 访问策略、`access_policy` 与导出目标是否匹配。只有五层都 pass，held 批次才能 release。这个流程和 HKEX 的 source reality 是一致的，因为源资料可能未经 HKEX 核实、也可能在后续被澄清或重发。 citeturn1view2turn20view1turn20view2

## 可直接发给 GPT 或 Codex 的说明

下面这段可以直接拿去问 GPT / Codex。它会比你当前那版更适合拿来讨论工程实现。

```text
We are ingesting mostly public HKEXnews data into Postgres for internal IPO intelligence.

Design principles:
1) HKEXnews is a public inflow, but Postgres is the runtime source of truth.
2) Automation must NOT write core.ipo_* serving tables directly.
3) Every run creates core.raw_source_batch + core.data_version_batch(release_state='held').
4) The pipeline is:
   crawl/discover -> raw_snapshot/document_observation -> sanitize/document_content
   -> extracted_fact -> human/auto review -> deterministic transform
   -> serving upsert -> governance checks -> release.
5) HKEX rights posture stays conservative by default:
   governance.ipo_contract.default_deny = true
   field_authorization_required = true
   export_allowed = false
   mcp_redistribution_allowed = false
   until rights review is completed.
6) Stable entity vs versioned state:
   - hkex_news_document is canonical and should NOT be duplicated per data_version.
   - hkex_news_document_observation and raw_snapshot are versioned per crawl/data_version.
7) HKEX headline taxonomy is multi-valued and versioned:
   - store document headlines in a child table, not category/subcategory scalar fields.
8) We must model document lifecycle:
   - cancelled / reissued / clarified / inactive
   - plus relations like supersedes / clarifies / reissues.
9) LLM extraction is allowed only on sanitized content and must emit:
   fact_key, typed value, locator, confidence, extractor_version.
10) Serving tables only consume accepted facts.

Please:
- review the schema below for normalization, idempotency, and replay safety;
- produce migration-ready PostgreSQL DDL;
- propose a Codex automation workflow with retries, dedupe, and error handling;
- suggest validation SQL before switching data_version_batch from held to released;
- keep the design safe for future migration from public HKEXnews crawling to licensed IIS/market-data ingestion.

Schema objects to implement:
- core.hkex_news_crawl_run
- core.hkex_news_document
- core.hkex_news_document_observation
- core.hkex_news_document_headline
- core.hkex_news_document_relation
- core.hkex_news_document_content
- core.ipo_source_document_link
- core.hkex_news_extraction_run
- core.hkex_news_extracted_fact
- core.hkex_news_transform_run
```

之所以这段 prompt 有效，是因为它把 **source surface、rights posture、canonical-vs-versioned 边界、headline 多值、document lifecycle、release gate** 一次说清楚了；而这些点都不是拍脑袋出来的，而是正好对应 HKEXnews 的实际结构、搜索行为、AP/PHIP 访问条件、headline 分类规则以及 HKEX 的正式数据授权路径。 citeturn14search5turn20view1turn20view2turn11view2turn19view0turn19view1

## 最终建议

如果你只想做**内部使用、可回放、可审计、低法律风险**的 HKEX IPO 数据管道，那么你现有思路已经在正确路线上；我建议你真正落地时优先做三件事：**把 `document` 从 `data_version` 解耦出来、把 headline 独立建表、把 document lifecycle/supersession 明确入模**。这三件事会直接决定后面 Codex automation 能不能稳定跑、能不能重放、能不能在 serving 层做到 deterministic。 citeturn11view2turn20view1turn22view2

如果你中长期准备对外提供数据、做 API 或允许更广泛的分发，那么现在就应该把 schema 设计成**兼容未来 licensed source** 的形态：继续保留 `raw/document/content/fact/release` 分层，但把 `source_name`、`source_surface`、`rights_policy_version`、`access_policy` 做成一等字段。这样未来从 public HKEXnews 迁到 IIS 或其他授权 feed，不需要重写 serving 模型，只需要切换 ingestion adaptor。就这点来说，你现在的“held → released”治理思路，不只是合理，而且是未来可演进的关键。 citeturn19view0turn19view1turn4view1