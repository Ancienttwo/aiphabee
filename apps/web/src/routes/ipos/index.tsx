import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { Badge, Card, Icon, MascotState } from "../../ds";
import { getIpos } from "../../lib/mock-api";
import {
  SECTOR_LABEL,
  SENTIMENT_TONE,
  STATUS_CONFIG,
  type IpoRecord,
} from "../../data/ipos";
import { demandColor, formatHKD, formatListingDate, formatMultiple } from "../../lib/format";
import { MASCOT_BP, SHELL } from "../../lib/ui";

export const Route = createFileRoute("/ipos/")({
  component: BrowseIpos,
});

type Filter = "All" | "Upcoming" | "Priced" | "Listed" | "HKEX";
const CHIPS: Filter[] = ["All", "Upcoming", "Priced", "Listed", "HKEX"];

function Metric({
  label,
  value,
  mono,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  mono?: boolean;
  tone?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)", marginBottom: 3 }}>{label}</div>
      <div
        style={{
          fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: tone || "var(--text-primary)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function IpoListCard({ ipo, onOpen }: { ipo: IpoRecord; onOpen: () => void }) {
  const st = STATUS_CONFIG[ipo.status];
  return (
    <Card
      as="button"
      type="button"
      interactive
      onClick={onOpen}
      aria-label={`Open IPO analysis for ${ipo.name}`}
      style={{ cursor: "pointer", width: "100%", textAlign: "left" }}
    >
      <div style={{ padding: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h3
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-lg)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {ipo.name}
              </h3>
              <Badge tone={st.tone} size="sm">
                {st.label}
              </Badge>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{ipo.ticker}</span>
              <span>·</span>
              <span>{ipo.exchange}</span>
              <span>·</span>
              <span>{SECTOR_LABEL[ipo.sector]}</span>
            </div>
          </div>
          <Icon name="arrow-up-right" size={20} color="var(--text-subtle)" />
        </div>
        <p
          style={{
            margin: "12px 0 16px",
            fontSize: "var(--text-sm)",
            lineHeight: 1.6,
            color: "var(--text-body)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {ipo.desc}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            paddingTop: 14,
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <Metric label="Listing" value={formatListingDate(ipo.listing)} />
          <Metric label="Offer" value={formatHKD(ipo.offer)} mono />
          <Metric label="超额认购" value={formatMultiple(ipo.sub)} mono tone={demandColor(ipo.sub)} />
          <Metric
            label="Sentiment"
            value={
              <Badge tone={SENTIMENT_TONE[ipo.sentiment]} size="sm" dot>
                {ipo.sentiment}
              </Badge>
            }
          />
        </div>
      </div>
    </Card>
  );
}

function BrowseIpos() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("All");
  const ipos = getIpos().data;
  const shown = ipos.filter((i) =>
    filter === "All" || filter === "HKEX"
      ? true
      : filter === "Upcoming"
        ? i.status === "pending"
        : filter === "Priced"
          ? i.status === "priced"
          : filter === "Listed"
            ? i.status === "listed"
            : true,
  );

  return (
    <main style={{ ...SHELL, padding: "40px 24px 80px" }}>
      <h1
        style={{
          margin: "0 0 6px",
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-4xl)",
          fontWeight: 700,
          color: "var(--ink-800)",
        }}
      >
        IPO Listings
      </h1>
      <p style={{ margin: "0 0 24px", fontSize: "var(--text-lg)", color: "var(--text-muted)" }}>
        港股 IPO 全维度 AI 估值与风险分析（示例数据）
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              border: "1px solid " + (filter === c ? "var(--honey-500)" : "var(--border-default)"),
              background: filter === c ? "var(--honey-500)" : "var(--surface-card)",
              color: filter === c ? "var(--ink-800)" : "var(--text-body)",
            }}
          >
            {c}
          </button>
        ))}
      </div>
      {shown.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {shown.map((ipo) => (
            <IpoListCard
              key={ipo.id}
              ipo={ipo}
              onOpen={() => navigate({ to: "/ipos/$ipoId", params: { ipoId: ipo.id } })}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <MascotState
            basePath={MASCOT_BP}
            pose="empty"
            title="这个筛选下还没有标的"
            description="换个筛选条件，工蜂继续为你采集港股的新机会。"
          />
        </div>
      )}
    </main>
  );
}
