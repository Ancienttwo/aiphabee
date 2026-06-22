import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  MascotState,
} from "../../ds";
import { Metric } from "../../components/Metric";
import { EvidenceCard } from "../../components/evidence";
import { Disclaimer } from "../../components/Disclaimer";
import {
  getStockSnapshot,
  presentError,
  type MarketStatus,
  type WorkbenchSection,
} from "../../lib/api";
import { MASCOT_BP, SHELL } from "../../lib/ui";

export const Route = createFileRoute("/stock/$instrumentId")({
  component: StockWorkbench,
});

const SECTIONS = [
  { key: "security_profile", label: "公司档案" },
  { key: "quote_snapshot", label: "行情快照" },
  { key: "price_history", label: "价格历史" },
  { key: "financial_facts", label: "财务事实" },
  { key: "derived_metrics", label: "派生指标" },
  { key: "announcement_search", label: "公告检索" },
  { key: "corporate_actions", label: "公司行动" },
] as const;

const MARKET_LABEL: Record<MarketStatus, string> = {
  open: "开市",
  closed: "收盘",
  pre_open: "开盘前",
  post_close: "收盘后",
  halted: "暂停交易",
  unknown: "未知",
  not_applicable: "—",
};

function StockWorkbench() {
  const navigate = useNavigate();
  const { instrumentId } = Route.useParams();
  const { data: env, isLoading } = useQuery({
    queryKey: ["stock-snapshot", instrumentId],
    queryFn: () => getStockSnapshot({ instrumentId }),
  });

  return (
    <main style={{ ...SHELL, paddingTop: 24, paddingBottom: 72 }}>
      <button
        type="button"
        onClick={() => navigate({ to: "/stock" })}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          fontSize: "var(--text-sm)",
          fontFamily: "var(--font-sans)",
          marginBottom: 14,
        }}
      >
        <Icon name="arrow-left" size={16} /> 返回搜索
      </button>

      <h1
        style={{
          margin: 0,
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-3xl)",
          fontWeight: 700,
          color: "var(--ink-800)",
        }}
      >
        {instrumentId}
      </h1>

      {isLoading ? (
        <p style={{ marginTop: 16, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          正在加载工作台快照…
        </p>
      ) : null}

      {env && !env.ok ? (
        <Card padded style={{ marginTop: 16 }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--red-600)" }}>
            {presentError(env).detail}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
            若后端未启动，请在仓库根运行 <code>npm run dev:worker</code>（端口 8787）。
          </p>
        </Card>
      ) : null}

      {env && env.ok ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", margin: "12px 0 20px" }}>
            <Badge tone="info" variant="soft" dot>
              市场状态：{MARKET_LABEL[env.market_status]}
            </Badge>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
              快照版本 {env.data.version}
            </span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <EvidenceCard
              asOf={env.as_of}
              dataVersion={env.data_version}
              methodologyVersion={env.methodology_version}
              provenance={env.provenance}
              usage={env.usage}
              label="查看本次快照的证据来源"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {SECTIONS.map((s) => {
              const section = env.data[s.key] as WorkbenchSection | undefined;
              if (!section?.usage) return null;
              return (
                <Metric
                  key={s.key}
                  label={s.label}
                  value={`${section.usage.rows} 行`}
                  sub={`${section.usage.credits} credits${section.usage.cached ? " · 缓存" : ""}`}
                />
              );
            })}
          </div>

          <Card style={{ marginTop: 24 }}>
            <CardHeader>
              <CardTitle>更深的工作台视图</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                Phase 2 将把每个区块展开为完整面板：行情走势、财务趋势、估值口径、公告时间线与公司行动，
                每个数字都挂接对应的证据卡片。当前为合成数据，已打通真实 API 信封（provenance / usage /
                market_status）。
              </p>
            </CardContent>
          </Card>

          <Disclaimer style={{ marginTop: 24 }} />
        </>
      ) : null}

      {!isLoading && !env ? (
        <MascotState
          basePath={MASCOT_BP}
          pose="empty"
          title="暂无数据"
          description="未能加载该证券的工作台快照。"
        />
      ) : null}
    </main>
  );
}
