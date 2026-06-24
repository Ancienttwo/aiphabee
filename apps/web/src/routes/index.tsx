import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Button,
  Card,
  Hexvatar,
  Icon,
  type HexvatarTone,
  type IconName,
} from "../ds";
import { MASCOT_BP, SHELL } from "../lib/ui";

export const Route = createFileRoute("/")({
  component: Home,
});

const QUICK_ACTIONS = [
  { to: "/ask", label: "研究对话", desc: "用自然语言提问，带证据作答", icon: "message-circle", tone: "honey" },
  { to: "/stock", label: "个股工作台", desc: "行情 / 财务 / 估值 / 公告", icon: "trending-up", tone: "green" },
  { to: "/screen", label: "筛选器", desc: "自然语言转结构化条件", icon: "sliders", tone: "violet" },
  { to: "/compare", label: "比较器", desc: "2–5 只证券统一口径对比", icon: "layers", tone: "honey" },
  { to: "/documents", label: "公告与文档", desc: "检索原文，定位到段落", icon: "file-text", tone: "green" },
  { to: "/watchlist", label: "观察列表", desc: "提醒与每日 / 每周简报", icon: "eye", tone: "violet" },
  { to: "/library", label: "研究库", desc: "保存完整 run 与证据快照", icon: "bookmark", tone: "honey" },
  { to: "/mcp", label: "数据接入 MCP", desc: "在外部 AI 中调港股工具", icon: "database", tone: "green" },
] as const;

const EXAMPLES = [
  "腾讯这三天为什么跌？",
  "对比腾讯、阿里、美团近三年的毛利率",
  "筛选市值高于 500 亿、股息率高于 4% 的港股",
  "汇丰控股最近有哪些重要公告？",
] as const;

const VALUE_PROPS: { icon: IconName; tone: HexvatarTone; title: string; body: ReactNode }[] = [
  {
    icon: "layers",
    tone: "honey",
    title: "证据可追溯",
    body: "每个金融数字都能点开来源记录、数据版本与 as_of 时间，绝不凭空生成。",
  },
  {
    icon: "shield",
    tone: "green",
    title: "结论分层",
    body: "事实 / 计算 / 推断 / 未知清晰标注；只给证据强度，不编造可信度分数。",
  },
  {
    icon: "database",
    tone: "violet",
    title: "Web + MCP 双入口",
    body: "同一套港股工具，既服务 Web 研究，也通过 Remote MCP 供外部 AI 调用。",
  },
];

function Home() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const startResearch = (q: string) => {
    const text = q.trim();
    if (!text) return;
    navigate({
      to: "/ask/$runId",
      params: { runId: crypto.randomUUID() },
      search: { q: text },
    });
  };

  return (
    <main>
      {/* Hero */}
      <section style={{ ...SHELL, paddingTop: 60, paddingBottom: 40, textAlign: "center" }}>
        <img
          src={`${MASCOT_BP}/greeting.png`}
          alt="AiphaBee"
          style={{ width: 116, height: 116, objectFit: "contain", marginBottom: 8 }}
        />
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: "var(--radius-pill)",
            background: "var(--honey-50)",
            border: "1px solid var(--honey-200)",
            marginBottom: 22,
          }}
        >
          <Icon name="sparkles" size={15} color="var(--honey-700)" />
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--honey-800)" }}>
            港股研究 Agent · 证据可追溯
          </span>
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-6xl)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "var(--tracking-tight)",
            color: "var(--text-primary)",
          }}
        >
          把每个港股结论，
          <br />
          <span style={{ color: "var(--honey-500)" }}>追溯到它的证据。</span>
        </h1>
        <p
          style={{
            maxWidth: 620,
            margin: "20px auto 0",
            fontSize: "var(--text-lg)",
            lineHeight: 1.6,
            color: "var(--text-body)",
          }}
        >
          30+ 年港股标准化数据为底座的研究操作系统。用自然语言提问，得到分层、可验证、可复用的研究结论。
        </p>

        {/* Research prompt */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startResearch(prompt);
          }}
          style={{
            display: "flex",
            gap: 10,
            maxWidth: 620,
            margin: "28px auto 0",
          }}
        >
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例如：腾讯这三天为什么跌？"
            aria-label="研究问题"
            style={{
              flex: 1,
              height: 48,
              padding: "0 18px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-default)",
              background: "var(--surface-card)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-base)",
              color: "var(--text-primary)",
            }}
          />
          <Button
            type="submit"
            size="lg"
            iconRight={<Icon name="arrow-right" size={18} />}
          >
            开始研究
          </Button>
        </form>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 16 }}>
          {EXAMPLES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => startResearch(q)}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-card)",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-xs)",
                color: "var(--text-muted)",
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section style={{ ...SHELL, paddingBottom: 48 }}>
        <div className="ab-grid-4" style={{ gap: 16 }}>
          {QUICK_ACTIONS.map((a) => (
            <Card
              key={a.to}
              interactive
              padded
              onClick={() => navigate({ to: a.to })}
              style={{ cursor: "pointer" }}
            >
              <Hexvatar
                icon={<Icon name={a.icon} size={20} />}
                tone={a.tone}
                variant="soft"
                size={46}
              />
              <h3
                style={{
                  margin: "14px 0 4px",
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-lg)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {a.label}
              </h3>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--text-muted)" }}>
                {a.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Evidence-first value props — divided rows (not a 3-card triplet) */}
      <section style={{ ...SHELL, paddingBottom: 80 }}>
        <Card padded>
          {VALUE_PROPS.map((v, i) => (
            <div
              key={v.title}
              style={{
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                padding: i === 0 ? "0 0 20px" : "20px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
              }}
            >
              <Hexvatar icon={<Icon name={v.icon} size={22} />} tone={v.tone} variant="soft" size={52} />
              <div style={{ minWidth: 0 }}>
                <h3
                  style={{
                    margin: "0 0 6px",
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-xl)",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {v.title}
                </h3>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.65, color: "var(--text-body)", maxWidth: "62ch" }}>
                  {v.body}
                </p>
              </div>
            </div>
          ))}
        </Card>
      </section>
    </main>
  );
}
