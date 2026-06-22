import { Badge } from "../../ds";
import type { ProvenanceRef } from "../../lib/api";

/**
 * Untrusted-document view (PRD DOC-03). Filing / announcement bodies are
 * untrusted data: any instructions, scripts, or hidden text inside them must
 * never change system behavior. Content is rendered as inert text (never via
 * dangerouslySetInnerHTML), and we additionally strip markup for readability.
 */
export function sanitizeUntrusted(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .trim();
}

export interface UntrustedDocumentViewProps {
  content: string;
  source?: ProvenanceRef;
  title?: string;
}

export function UntrustedDocumentView({
  content,
  source,
  title,
}: UntrustedDocumentViewProps) {
  const safe = sanitizeUntrusted(content);
  return (
    <div
      style={{
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          background: "var(--surface-sunken)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <Badge tone="warning" variant="soft" size="sm">
          不可信内容 · Untrusted
        </Badge>
        {title ? (
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-body)" }}>
            {title}
          </span>
        ) : null}
        {source ? (
          <span style={{ marginLeft: "auto", fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
            {source.source} · {source.data_version}
          </span>
        ) : null}
      </div>
      {/* Rendered as a text child — React escapes it, so embedded markup/scripts
          are inert and cannot execute or alter the page. */}
      <div
        style={{
          margin: 0,
          padding: "12px 14px",
          maxHeight: 360,
          overflow: "auto",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-sm)",
          lineHeight: "var(--leading-relaxed)",
          color: "var(--text-body)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {safe || "（空文档）"}
      </div>
    </div>
  );
}
