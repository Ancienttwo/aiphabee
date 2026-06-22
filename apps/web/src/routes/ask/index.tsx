import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, Icon } from "../../ds";
import { SHELL } from "../../lib/ui";

export const Route = createFileRoute("/ask/")({
  component: AskIndex,
});

const TEMPLATES = [
  {
    title: "解释个股波动",
    prompt: "腾讯这三天为什么跌？",
    desc: "结合行情、公告与同业，分层归因。",
  },
  {
    title: "长期基本面对照",
    prompt: "过去十年港交所收入与利润率如何变化？",
    desc: "确定性计算，区分阶段、不臆断因果。",
  },
  {
    title: "同业比较",
    prompt: "对比腾讯、阿里、美团近三年的毛利率",
    desc: "统一口径，明确标注不可比项。",
  },
  {
    title: "公告速读",
    prompt: "汇丰控股最近有哪些重要公告？",
    desc: "检索原文并定位关键段落。",
  },
] as const;

function AskIndex() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const start = (text: string) => {
    const q = text.trim();
    if (!q) return;
    navigate({
      to: "/ask/$runId",
      params: { runId: crypto.randomUUID() },
      search: { q },
    });
  };

  return (
    <main style={{ ...SHELL, paddingTop: 40, paddingBottom: 72 }}>
      <h1
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-3xl)",
          fontWeight: 700,
          color: "var(--ink-800)",
        }}
      >
        研究对话
      </h1>
      <p style={{ margin: "8px 0 24px", fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
        用自然语言提问，AiphaBee 调用只读工具作答，每个数字都可追溯证据。
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(prompt);
        }}
        style={{ display: "flex", gap: 10, marginBottom: 28 }}
      >
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="输入你的研究问题…"
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
        <Button type="submit" size="lg" iconRight={<Icon name="arrow-right" size={18} />}>
          开始研究
        </Button>
      </form>

      <h2
        style={{
          margin: "0 0 12px",
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-lg)",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        研究模板
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {TEMPLATES.map((t) => (
          <Card
            key={t.title}
            interactive
            padded
            onClick={() => start(t.prompt)}
            style={{ cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon name="sparkles" size={16} color="var(--honey-600)" />
              <h3
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {t.title}
              </h3>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
              {t.desc}
            </p>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                color: "var(--ink-700)",
                background: "var(--surface-sunken)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 10px",
              }}
            >
              “{t.prompt}”
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
