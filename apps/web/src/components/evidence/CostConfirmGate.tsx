import { Button, Card, Icon } from "../../ds";

/**
 * Cost-confirmation gate (PRD US-W10). High-cost actions (deep reports,
 * full-market screens) must show an estimated credit cost and get explicit
 * user confirmation before running.
 */
export interface CostConfirmGateProps {
  open: boolean;
  estimatedCredits: number;
  dataRange?: string;
  outputDescription?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CostConfirmGate({
  open,
  estimatedCredits,
  dataRange,
  outputDescription,
  onConfirm,
  onCancel,
}: CostConfirmGateProps) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="确认本次操作成本"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-4)",
        background: "rgba(15, 23, 42, 0.45)",
      }}
      onClick={onCancel}
    >
      <Card
        padded
        style={{ maxWidth: 420, width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Icon name="alert-circle" size={20} color="var(--honey-600)" />
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-lg)",
              fontWeight: 700,
              color: "var(--ink-800)",
            }}
          >
            确认本次操作
          </h3>
        </div>
        <div
          style={{
            display: "grid",
            gap: 8,
            padding: "12px 14px",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-sunken)",
            marginBottom: 16,
          }}
        >
          <Line k="预估成本" v={`${estimatedCredits} credits`} strong />
          {dataRange ? <Line k="数据范围" v={dataRange} /> : null}
          {outputDescription ? <Line k="预期输出" v={outputDescription} /> : null}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            确认并继续
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Line({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{k}</span>
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-sm)",
          fontWeight: strong ? 700 : 500,
          color: strong ? "var(--honey-700)" : "var(--text-body)",
        }}
      >
        {v}
      </span>
    </div>
  );
}
