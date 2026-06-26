import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Icon } from "../../ds";
import { screenIposMock } from "../../lib/api/ipo-mock";
import {
  Eyebrow,
  FilterBar,
  IpoRow,
  Mono,
  StageRail,
  type SectorFilter,
  type StageFilter,
} from "../../components/ipo";
import { STAGE_BY } from "../../data/ipos.fixtures";
import { useIpoCompare } from "../../lib/context/IpoCompareContext";
import { SHELL } from "../../lib/ui";

export const Route = createFileRoute("/ipos/")({
  component: PipelineView,
});

/**
 * IPO pipeline — the lifecycle kanban list. Ported from the design prototype's
 * `PipelineView`, backed by the `screenIposMock` envelope (swaps to Codex's
 * `/analytics/screen-ipos` later). Row click → detail workbench; the compare
 * toggle builds a local selection (the compare page lands in FP4).
 */
function PipelineView() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<StageFilter>("all");
  const [sector, setSector] = useState<SectorFilter>("all");
  const [sort, setSort] = useState("sub");
  const [q, setQ] = useState("");
  const { ids: compareIds, toggle: toggleCompare, has } = useIpoCompare();

  const res = screenIposMock({
    stage: stage === "all" ? undefined : stage,
    sector: sector === "all" ? undefined : sector,
    q: q || undefined,
    sort,
  });
  const rows = res.ok ? res.data.rows : [];

  return (
    <main style={{ ...SHELL, padding: "32px var(--content-gutter) 80px" }}>
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
          marginBottom: 22,
        }}
      >
        <div>
          <Eyebrow style={{ marginBottom: 8 }}>港股 IPO · HKEX Research Pipeline</Eyebrow>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-4xl)",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            IPO 研究工作台
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: "var(--text-base)",
              color: "var(--text-muted)",
              maxWidth: 560,
              lineHeight: 1.6,
            }}
          >
            按 IPO 生命周期追踪招股、暗盘、分配与禁售；所有数字均带{" "}
            <Mono size="var(--text-xs)" color="var(--text-body)">
              as_of
            </Mono>{" "}
            与数据版本。
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Button
            variant="outline"
            icon={<Icon name="calendar" size={16} />}
            onClick={() => navigate({ to: "/ipos/calendar" })}
          >
            日历 Calendar
          </Button>
          <Button
            variant="ai"
            icon={<Icon name="git-compare" size={16} />}
            onClick={() => navigate({ to: "/ipos/compare" })}
          >
            横向比较 {compareIds.length}/5
          </Button>
        </div>
      </div>

      <StageRail active={stage} setActive={setStage} />
      <FilterBar
        sector={sector}
        setSector={setSector}
        sort={sort}
        setSort={setSort}
        q={q}
        setQ={setQ}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          共{" "}
          <Mono size="var(--text-sm)">{rows.length}</Mono> 个标的
          {stage !== "all" ? ` · ${STAGE_BY[stage].label}` : ""}
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-subtle)" }}>
          点击行查看研究工作台 ·{" "}
          <Icon name="git-compare" size={12} /> 加入对比
        </span>
      </div>

      <div
        style={{
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {rows.length ? (
          rows.map((ipo) => (
            <IpoRow
              key={ipo.id}
              ipo={ipo}
              onOpen={() => navigate({ to: "/ipos/$ipoId", params: { ipoId: ipo.id } })}
              inCompare={compareIds.includes(ipo.id)}
              toggleCompare={toggleCompare}
            />
          ))
        ) : (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "var(--text-muted)",
              background: "var(--surface-card)",
            }}
          >
            <Icon name="search-x" size={28} color="var(--text-subtle)" />
            <p style={{ margin: "10px 0 0", fontSize: "var(--text-sm)" }}>
              该筛选下暂无标的，换个条件试试。
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
