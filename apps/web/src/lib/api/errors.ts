import type { AiphaBeeErrorCode, ErrorEnvelope } from "./types";

/**
 * How a surface should react to a given error. The `action` hint lets pages
 * branch (e.g. show the AmbiguityResolver, prompt login) without re-deriving
 * intent from raw error codes.
 */
export interface ErrorPresentation {
  title: string;
  detail: string;
  action: "ambiguity" | "auth" | "budget" | "generic" | "quality" | "retry";
}

// Exhaustive over AiphaBeeErrorCode — TS flags any missing/extra code.
const PRESENTATIONS: Record<AiphaBeeErrorCode, ErrorPresentation> = {
  AMBIGUOUS_SECURITY: { title: "证券存在歧义", detail: "请从候选项中选择一个证券。", action: "ambiguity" },
  AUTH_REQUIRED: { title: "需要登录", detail: "请登录后继续。登录功能即将上线。", action: "auth" },
  BUDGET_EXCEEDED: { title: "额度不足", detail: "本次操作所需 credits 超过剩余额度。", action: "budget" },
  DATA_NOT_LICENSED: { title: "数据未授权", detail: "该字段在当前渠道未获授权。", action: "generic" },
  DATA_QUALITY_HOLD: { title: "数据质量保留", detail: "该数据因质量校验暂被保留。", action: "quality" },
  INTERNAL_ERROR: { title: "内部错误", detail: "发生未预期的错误，请稍后重试。", action: "retry" },
  MODEL_PROVIDER_NOT_CONFIGURED: { title: "模型未配置", detail: "模型供应商尚未配置（合成模式）。", action: "generic" },
  NOT_FOUND: { title: "未找到", detail: "未找到匹配的记录。", action: "generic" },
  OUT_OF_RANGE: { title: "超出范围", detail: "请求的范围超过允许的边界。", action: "generic" },
  POINT_IN_TIME_UNAVAILABLE: { title: "时点数据不可用", detail: "该历史时点的数据暂不可用。", action: "generic" },
  RATE_LIMITED: { title: "请求过于频繁", detail: "请稍后重试。", action: "retry" },
  SCOPE_DENIED: { title: "权限不足", detail: "当前 scope 无法访问该数据。", action: "generic" },
  SYMBOL_AMBIGUOUS: { title: "代码存在歧义", detail: "请从候选项中选择一个证券。", action: "ambiguity" },
  TOO_MANY_ROWS: { title: "结果过多", detail: "请缩小范围或使用分页。", action: "generic" },
  UPSTREAM_STALE: { title: "上游数据陈旧", detail: "上游数据源暂时陈旧，请稍后重试。", action: "retry" },
};

/** Maps an error envelope to user-facing copy, preferring the worker message. */
export function presentError(envelope: ErrorEnvelope): ErrorPresentation {
  const code = envelope.error?.code;
  const base = (code && PRESENTATIONS[code]) ?? PRESENTATIONS.INTERNAL_ERROR;
  return { ...base, detail: envelope.error?.message || base.detail };
}

/** True when the error means the security query matched multiple candidates. */
export function isAmbiguity(envelope: ErrorEnvelope): boolean {
  return (
    envelope.error.code === "AMBIGUOUS_SECURITY" ||
    envelope.error.code === "SYMBOL_AMBIGUOUS"
  );
}
