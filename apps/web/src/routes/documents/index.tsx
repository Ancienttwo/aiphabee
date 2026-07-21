import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Icon } from "../../ds";
import { AmbiguityResolver, UntrustedDocumentView } from "../../components/evidence";
import {
  getAnnouncement,
  presentError,
  searchAnnouncements,
  type AnnouncementResultItem,
  type SearchAnnouncementsResult,
} from "../../lib/api";
import { SHELL } from "../../lib/ui";
import { formatHkSymbol } from "../../lib/format";
import { useLocale, type MessageKey } from "../../i18n/locale";

export const Route = createFileRoute("/documents/")({
  component: Documents,
});

const CATEGORIES = [
  { v: "all", label: "categoryAll" },
  { v: "results", label: "categoryResults" },
  { v: "dividend", label: "categoryDividend" },
  { v: "buyback", label: "categoryBuyback" },
] as const satisfies ReadonlyArray<{ v: string; label: MessageKey }>;

const CATEGORY_LABEL: Record<string, MessageKey> = { results: "categoryResults", dividend: "categoryDividend", buyback: "categoryBuyback" };

function Documents() {
  const { t } = useLocale();
  const [security, setSecurity] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [result, setResult] = useState<SearchAnnouncementsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const seq = useRef(0);

  const run = async (overrideSecurity?: string) => {
    const sq = (overrideSecurity ?? security).trim();
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
      <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--text-primary)" }}>
        {t("documentsTitle")}
      </h1>
      <p style={{ margin: "8px 0 20px", fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
        {t("documentsDescription")}
      </p>

      <form onSubmit={(e) => { e.preventDefault(); run(); }} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        <input value={security} onChange={(e) => setSecurity(e.target.value)} placeholder={t("securityPlaceholder")} aria-label={t("security")}
          style={{ flex: "1 1 180px", height: 44, padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--surface-card)", fontSize: "var(--text-base)" }} />
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t("keywordOptional")} aria-label={t("keyword")}
          style={{ flex: "1 1 160px", height: 44, padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--surface-card)", fontSize: "var(--text-base)" }} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t("category")}
          style={{ height: 44, padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--surface-card)", fontSize: "var(--text-sm)" }}>
          {CATEGORIES.map((c) => <option key={c.v} value={c.v}>{t(c.label)}</option>)}
        </select>
        <Button type="submit" icon={<Icon name="search" size={16} />}>{t("search")}</Button>
      </form>

      {loading ? <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{t("searchingAnnouncements")}</p> : null}
      {error ? <Card padded><p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--red-600)" }}>{error}</p></Card> : null}

      {result && result.status === "blocked_resolution" && result.resolve_security?.candidates?.length ? (
        <AmbiguityResolver
          query={security}
          candidates={result.resolve_security.candidates}
          onSelect={(c) => {
            setSecurity(c.symbol);
            run(c.symbol);
          }}
        />
      ) : result ? (
        <div className="ab-grid-2" style={{ gap: 20, alignItems: "start" }}>
          {/* Results list */}
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--text-subtle)" }}>{result.total_count} {t("resultsCount")}</div>
            {result.results.map((a) => (
              <ResultCard key={a.announcement_id} a={a} active={selected === a.document_id} onOpen={() => setSelected(a.document_id)} />
            ))}
            {result.results.length === 0 ? <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{t("noAnnouncements")}</p> : null}
          </div>

          {/* Selected document excerpts */}
          <div style={{ position: "sticky", top: 80 }}>
            {!selected ? (
              <Card padded><p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{t("selectAnnouncement")}</p></Card>
            ) : doc.isLoading ? (
              <Card padded><p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{t("loadingExcerpt")}</p></Card>
            ) : docData ? (
              <Card>
                <CardHeader>
                  <CardTitle>{docData.source?.title ?? t("originalExcerpt")}</CardTitle>
                  <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                    {docData.source ? <Badge tone="navy" variant="soft" size="sm">{CATEGORY_LABEL[docData.source.category] ? t(CATEGORY_LABEL[docData.source.category]) : docData.source.category}</Badge> : null}
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)", fontFamily: "var(--font-mono)" }}>{docData.source?.published_at}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p style={{ margin: "0 0 12px", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
                    {t("sanitized")} {docData.sanitization_summary.sections_sanitized}/{docData.sanitization_summary.sections_reviewed} {t("sections")} · {docData.sanitization_summary.removed_item_count} {t("removedSuspicious")}
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
              <Card padded><p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{t("excerptLoadFailed")}</p></Card>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function ResultCard({ a, active, onOpen }: { a: AnnouncementResultItem; active: boolean; onOpen: () => void }) {
  const { t } = useLocale();
  return (
    <Card interactive onClick={onOpen} style={{ cursor: "pointer", borderColor: active ? "var(--honey-400)" : undefined }}>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <Badge tone="navy" variant="soft" size="sm">{CATEGORY_LABEL[a.category] ? t(CATEGORY_LABEL[a.category]) : a.category}</Badge>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>{a.title}</span>
        </div>
        <p style={{ margin: "0 0 8px", fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.summary}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
          <span style={{ fontFamily: "var(--font-mono)" }}>{formatHkSymbol(a.symbol)}</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{a.published_at}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="file-text" size={11} /> P.{a.evidence_locator.page}</span>
        </div>
      </div>
    </Card>
  );
}
