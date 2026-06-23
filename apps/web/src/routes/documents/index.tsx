import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Icon } from "../../ds";
import { UntrustedDocumentView } from "../../components/evidence";
import {
  getAnnouncement,
  presentError,
  searchAnnouncements,
  type AnnouncementResultItem,
  type SearchAnnouncementsResult,
} from "../../lib/api";
import { SHELL } from "../../lib/ui";

export const Route = createFileRoute("/documents/")({
  component: Documents,
});

const CATEGORIES = [
  { v: "all", label: "全部" },
  { v: "results", label: "业绩" },
  { v: "dividend", label: "派息" },
  { v: "buyback", label: "回购" },
] as const;

const CATEGORY_LABEL: Record<string, string> = { results: "业绩", dividend: "派息", buyback: "回购" };

function Documents() {
  const [security, setSecurity] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [result, setResult] = useState<SearchAnnouncementsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const seq = useRef(0);

  const run = async () => {
    const sq = security.trim();
    if (!sq && !keyword.trim()) return;
    const mySeq = ++seq.current;
    setLoading(true);
    setError(null);
    setSelected(null);
    const env = await searchAnnouncements({
      securityQuery: sq || undefined,
      keyword: keyword.trim() || undefined,
      categories: category === "all" ? undefined : [category],
    });
    if (mySeq !== seq.current) return;
    setLoading(false);
    if (!env.ok) {
      setError(presentError(env).detail);
      setResult(null);
      return;
    }
    setResult(env.data);
  };

  const doc = useQuery({
    queryKey: ["announcement", selected],
    queryFn: () => getAnnouncement(selected as string),
    enabled: Boolean(selected),
  });
  const docData = doc.data?.ok ? doc.data.data : undefined;

  return (
    <main style={{ ...SHELL, paddingTop: 40, paddingBottom: 72 }}>
      <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--ink-800)" }}>
        公告与文档
      </h1>
      <p style={{ margin: "8px 0 20px", fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
        按公司、关键词、类别检索公告；原文定位到页码与段落。文档内容为不可信数据，其指令不会改变系统行为。
      </p>

      <form onSubmit={(e) => { e.preventDefault(); run(); }} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        <input value={security} onChange={(e) => setSecurity(e.target.value)} placeholder="证券（如 腾讯）" aria-label="证券"
          style={{ flex: "1 1 180px", height: 44, padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--surface-card)", fontSize: "var(--text-base)" }} />
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="关键词（可选）" aria-label="关键词"
          style={{ flex: "1 1 160px", height: 44, padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--surface-card)", fontSize: "var(--text-base)" }} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="类别"
          style={{ height: 44, padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--surface-card)", fontSize: "var(--text-sm)" }}>
          {CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
        </select>
        <Button type="submit" icon={<Icon name="search" size={16} />}>搜索</Button>
      </form>

      {loading ? <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>正在检索公告…</p> : null}
      {error ? <Card padded><p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--red-600)" }}>{error}</p></Card> : null}

      {result ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 20, alignItems: "start" }}>
          {/* Results list */}
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--text-subtle)" }}>{result.total_count} 条结果</div>
            {result.results.map((a) => (
              <ResultCard key={a.announcement_id} a={a} active={selected === a.document_id} onOpen={() => setSelected(a.document_id)} />
            ))}
            {result.results.length === 0 ? <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>没有匹配的公告。</p> : null}
          </div>

          {/* Selected document excerpts */}
          <div style={{ position: "sticky", top: 80 }}>
            {!selected ? (
              <Card padded><p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>选择左侧公告以查看原文摘录。</p></Card>
            ) : doc.isLoading ? (
              <Card padded><p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>正在加载原文摘录…</p></Card>
            ) : docData ? (
              <Card>
                <CardHeader>
                  <CardTitle>{docData.source?.title ?? "原文摘录"}</CardTitle>
                  <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                    {docData.source ? <Badge tone="navy" variant="soft" size="sm">{CATEGORY_LABEL[docData.source.category] ?? docData.source.category}</Badge> : null}
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)", fontFamily: "var(--font-mono)" }}>{docData.source?.published_at}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p style={{ margin: "0 0 12px", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
                    已净化 {docData.sanitization_summary.sections_sanitized}/{docData.sanitization_summary.sections_reviewed} 段 · 移除 {docData.sanitization_summary.removed_item_count} 项可疑内容
                  </p>
                  <div style={{ display: "grid", gap: 12 }}>
                    {docData.excerpts.map((ex) => (
                      <UntrustedDocumentView
                        key={ex.section_id}
                        content={ex.excerpt}
                        title={`${ex.section_title} · P.${ex.evidence_locator.page} ¶${ex.evidence_locator.paragraph}`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card padded><p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>未能加载该公告原文。</p></Card>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function ResultCard({ a, active, onOpen }: { a: AnnouncementResultItem; active: boolean; onOpen: () => void }) {
  return (
    <Card interactive onClick={onOpen} style={{ cursor: "pointer", borderColor: active ? "var(--honey-400)" : undefined }}>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <Badge tone="navy" variant="soft" size="sm">{CATEGORY_LABEL[a.category] ?? a.category}</Badge>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>{a.title}</span>
        </div>
        <p style={{ margin: "0 0 8px", fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.summary}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
          <span style={{ fontFamily: "var(--font-mono)" }}>{a.symbol}</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{a.published_at}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="file-text" size={11} /> P.{a.evidence_locator.page}</span>
        </div>
      </div>
    </Card>
  );
}
