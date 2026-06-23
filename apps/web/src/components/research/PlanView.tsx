import type { ReactNode } from "react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Icon } from "../../ds";
import type { AgentPlan } from "../../lib/api";

const PHASE_LABEL: Record<string, string> = {
  security_resolution: "证券解析",
  entitlement_gate: "权限校验",
  data_retrieval: "数据获取",
  market_data: "行情数据",
  fundamentals: "基本面",
  analysis: "分析计算",
  answer_generation: "生成答案",
  evidence_binding: "证据绑定",
};

const SECTION_LABEL: Record<string, string> = {
  direct_answer: "直接回答",
  data_status: "数据状态",
  key_evidence: "关键证据",
  explanation: "解释",
  next_steps: "后续建议",
  assumptions: "假设",
  caveats: "注意事项",
};

const SOURCE_LABEL: Record<string, string> = {
  tool_result: "工具结果",
  deterministic_calculation: "确定性计算",
  model_memory: "模型记忆",
  training_data: "训练数据",
  unverified_prompt: "未验证输入",
  unstated_source: "未注明来源",
};

function Pill({ tone, children }: { tone: "ok" | "block" | "neutral"; children: ReactNode }) {
  const map = {
    ok: { bg: "var(--green-50)", fg: "var(--green-600)" },
    block: { bg: "var(--red-50)", fg: "var(--red-600)" },
    neutral: { bg: "var(--neutral-100)", fg: "var(--neutral-600)" },
  } as const;
  const c = map[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-2xs)",
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
      }}
    >
      {children}
    </span>
  );
}

export function ResearchPlanCard({ plan }: { plan: AgentPlan }) {
  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <CardTitle>研究计划</CardTitle>
          <Badge tone="navy" variant="soft" size="sm">
            {plan.planned_step_count} 步 · 只读
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
          {plan.steps.map((s) => (
            <li key={s.step_id} style={{ display: "flex", gap: 12 }}>
              <span
                style={{
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--honey-50)",
                  color: "var(--honey-700)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  fontWeight: 700,
                }}
              >
                {s.index}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>
                    {s.public_label}
                  </span>
                  <Pill tone="neutral">{PHASE_LABEL[s.phase] ?? s.phase}</Pill>
                </span>
                {s.tool_calls.length > 0 ? (
                  <span style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                    {s.tool_calls.map((t) => (
                      <span
                        key={`${s.step_id}-${t.name}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--text-2xs)",
                          color: "var(--text-muted)",
                        }}
                      >
                        <Icon name="layers" size={11} color="var(--text-subtle)" />
                        {t.name}
                        <Pill tone="neutral">{t.required_scope}</Pill>
                      </span>
                    ))}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export function EvidenceContractCard({ plan }: { plan: AgentPlan }) {
  const struct = plan.answer_evidence_contract.answer_structure;
  const guard = plan.numeric_source_guard;
  return (
    <Card>
      <CardHeader>
        <CardTitle>证据契约</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>
          答案结构（PRD 8.3）
        </div>
        <ol style={{ margin: "0 0 16px", paddingLeft: 18, display: "grid", gap: 4 }}>
          {struct.ordered_sections.map((sec) => (
            <li key={sec.section_id} style={{ fontSize: "var(--text-sm)", color: "var(--text-body)" }}>
              {SECTION_LABEL[sec.section_id] ?? sec.section_id}
              {sec.required ? null : <span style={{ color: "var(--text-subtle)" }}>（可选）</span>}
            </li>
          ))}
        </ol>
        <p style={{ margin: "0 0 16px", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
          关键证据 {struct.key_evidence_items.min}–{struct.key_evidence_items.max} 条 · 直接回答{" "}
          {struct.min_direct_answer_sentences}–{struct.max_direct_answer_sentences} 句
        </p>

        <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>
          数字来源守卫
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
          {guard.allowed_sources.map((s) => (
            <Pill key={s} tone="ok">✓ {SOURCE_LABEL[s] ?? s}</Pill>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {guard.blocked_sources.map((s) => (
            <Pill key={s} tone="block">✕ {SOURCE_LABEL[s] ?? s}</Pill>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: "var(--text-2xs)", lineHeight: 1.6, color: "var(--text-muted)" }}>
          每个金融数字必须绑定来源记录或计算引用，否则按{" "}
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--red-600)" }}>{guard.answer_contract.failure_code}</span>{" "}
          拦截；无法取得的值标注为「{guard.answer_contract.unknown_value_label}」。
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid var(--border-subtle)",
            fontSize: "var(--text-2xs)",
            color: "var(--text-muted)",
          }}
        >
          <span>预算 {plan.budget.max_credits} credits</span>
          <span>·</span>
          <span>≤{plan.budget.max_steps} 步</span>
          <span>·</span>
          <span>≤{plan.budget.max_rows} 行</span>
        </div>
      </CardContent>
    </Card>
  );
}
