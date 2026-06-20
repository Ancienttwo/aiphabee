import type { BadgeTone } from "../ds";

/**
 * Illustrative mock HKEX IPO dataset, ported from the design system UI kit
 * (`ui_kits/ipo-agent`). NOT live market data.
 *
 * Compliance (Gate 0): the original kit's `recommendation` (强力买入/卖出 …)
 * is reframed here as a research `signal` (positive/negative …) and the
 * `aiNote` copy is rewritten to describe observations and risks rather than
 * give buy/sell/hold advice, target weights, or stop-loss levels.
 */

export type Sector = "tech" | "health" | "fintech" | "industrial" | "energy";
export type IpoStatus = "pending" | "priced" | "listed" | "withdrawn";
export type Sentiment = "bullish" | "cautious" | "neutral" | "bearish";
export type Tier = "small" | "medium" | "large";
export type ResearchSignal =
  | "strong_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "strong_negative";

export interface TierDimension {
  k: string;
  label: string;
  score: number;
}
export interface InstitutionRating {
  name: string;
  role: string;
  rating: number;
}
export interface Cornerstone {
  name: string;
  amount: string;
  pct: number;
}

export interface IpoRecord {
  id: string;
  name: string;
  cn: string;
  ticker: string;
  exchange: string;
  sector: Sector;
  status: IpoStatus;
  sentiment: Sentiment;
  score: number;
  tier: Tier;
  tierLabel: string;
  offer: number;
  raiseHKD: string;
  mcapHKD: string;
  listing: string;
  sub: number;
  rating: number;
  ratingCount: number;
  signal: ResearchSignal;
  confidence: number;
  desc: string;
  dims: TierDimension[];
  institutions: InstitutionRating[];
  cornerstones: Cornerstone[];
  aiNote: string;
}

export const SECTOR_LABEL: Record<Sector, string> = {
  tech: "科技 Technology",
  health: "生物医药 Healthcare",
  fintech: "金融科技 Fintech",
  industrial: "工业 Industrials",
  energy: "能源 Energy",
};

export const SENTIMENT_TONE: Record<Sentiment, BadgeTone> = {
  bullish: "bullish",
  cautious: "warning",
  neutral: "neutral",
  bearish: "bearish",
};

export const SENTIMENT_LABEL: Record<Sentiment, string> = {
  bullish: "牛市 Bullish",
  cautious: "谨慎乐观",
  neutral: "中性 Neutral",
  bearish: "熊市 Bearish",
};

export const STATUS_CONFIG: Record<IpoStatus, { tone: BadgeTone; label: string }> = {
  pending: { tone: "honey", label: "Upcoming 招股中" },
  priced: { tone: "info", label: "Priced 已定价" },
  listed: { tone: "bullish", label: "Listed 已上市" },
  withdrawn: { tone: "neutral", label: "Withdrawn" },
};

/**
 * Research SIGNAL framing — descriptive market-research signal, NOT a
 * personalized buy/sell/hold recommendation.
 */
export const SIGNAL_CONFIG: Record<
  ResearchSignal,
  { tone: BadgeTone; label: string }
> = {
  strong_positive: { tone: "bullish", label: "强正面信号 · Strong Positive" },
  positive: { tone: "warning", label: "正面信号 · Positive" },
  neutral: { tone: "neutral", label: "中性信号 · Neutral" },
  negative: { tone: "bearish", label: "偏负面信号 · Negative" },
  strong_negative: { tone: "bearish", label: "强负面信号 · Strong Negative" },
};

export const IPOS: IpoRecord[] = [
  {
    id: "honeycomb",
    name: "Honeycomb Intelligence",
    cn: "蜂巢智能",
    ticker: "2769.HK",
    exchange: "HKEX",
    sector: "tech",
    status: "pending",
    sentiment: "bullish",
    score: 78,
    tier: "medium",
    tierLabel: "中盘股",
    offer: 24.8,
    raiseHKD: "4.2B",
    mcapHKD: "38.6B",
    listing: "Jun 24, 2026",
    sub: 128.4,
    rating: 4.5,
    ratingCount: 21,
    signal: "strong_positive",
    confidence: 86,
    desc: "AI 投研基础设施服务商，为机构提供多模型估值与尽调自动化。Cornerstone 阵容强劲，超额认购火爆。",
    dims: [
      { k: "Chip", label: "筹码分布", score: 82 },
      { k: "Sponsor", label: "保荐质量", score: 88 },
      { k: "Underwriter", label: "承销实力", score: 74 },
      { k: "Sector", label: "板块动能", score: 90 },
      { k: "Fundamentals", label: "基本面", score: 68 },
      { k: "Cornerstone", label: "基石质量", score: 84 },
    ],
    institutions: [
      { name: "Morgan Stanley", role: "联席保荐人", rating: 5 },
      { name: "CICC 中金公司", role: "联席保荐人", rating: 4.5 },
      { name: "Goldman Sachs", role: "账簿管理人", rating: 4 },
    ],
    cornerstones: [
      { name: "Hillhouse 高瓴", amount: "HKD 600M", pct: 14.3 },
      { name: "GIC Singapore", amount: "HKD 420M", pct: 10.0 },
      { name: "Tencent 腾讯", amount: "HKD 380M", pct: 9.0 },
    ],
    aiNote:
      "科技板块情绪向好，叠加优质基石阵容；128× 超额认购显示散户与机构需求旺盛。首日开盘价相对招股价区间，是后续值得跟踪的关键观察点。",
  },
  {
    id: "lotus",
    name: "Lotus Digital Pay",
    cn: "莲花数科",
    ticker: "2611.HK",
    exchange: "HKEX",
    sector: "fintech",
    status: "pending",
    sentiment: "bullish",
    score: 71,
    tier: "large",
    tierLabel: "大盘股",
    offer: 18.2,
    raiseHKD: "6.8B",
    mcapHKD: "92.1B",
    listing: "Jun 27, 2026",
    sub: 64.2,
    rating: 4,
    ratingCount: 18,
    signal: "positive",
    confidence: 74,
    desc: "东南亚跨境支付与数字钱包龙头，盈利稳健，监管护城河深厚。",
    dims: [
      { k: "Chip", label: "筹码分布", score: 70 },
      { k: "Sponsor", label: "保荐质量", score: 80 },
      { k: "Underwriter", label: "承销实力", score: 78 },
      { k: "Sector", label: "板块动能", score: 66 },
      { k: "Fundamentals", label: "基本面", score: 82 },
      { k: "Cornerstone", label: "基石质量", score: 72 },
    ],
    institutions: [
      { name: "JPMorgan", role: "联席保荐人", rating: 4.5 },
      { name: "UBS", role: "账簿管理人", rating: 4 },
      { name: "Huatai 华泰", role: "账簿管理人", rating: 3.5 },
    ],
    cornerstones: [
      { name: "Temasek 淡马锡", amount: "HKD 800M", pct: 11.8 },
      { name: "BlackRock", amount: "HKD 500M", pct: 7.4 },
    ],
    aiNote:
      "基本面扎实，但板块动能一般；64× 认购处于健康区间。盈利质量与监管护城河，是其主要支撑维度。",
  },
  {
    id: "pearl",
    name: "Pearl River Biotech",
    cn: "珠江生物",
    ticker: "2197.HK",
    exchange: "HKEX",
    sector: "health",
    status: "priced",
    sentiment: "cautious",
    score: 54,
    tier: "small",
    tierLabel: "小盘股",
    offer: 9.6,
    raiseHKD: "1.1B",
    mcapHKD: "8.4B",
    listing: "Jun 20, 2026",
    sub: 12.6,
    rating: 3.5,
    ratingCount: 11,
    signal: "neutral",
    confidence: 61,
    desc: "创新药企，核心管线处于 II 期临床。未盈利，估值依赖里程碑预期。",
    dims: [
      { k: "Chip", label: "筹码分布", score: 58 },
      { k: "Sponsor", label: "保荐质量", score: 62 },
      { k: "Underwriter", label: "承销实力", score: 55 },
      { k: "Sector", label: "板块动能", score: 48 },
      { k: "Fundamentals", label: "基本面", score: 40 },
      { k: "Cornerstone", label: "基石质量", score: 60 },
    ],
    institutions: [
      { name: "CICC 中金公司", role: "独家保荐人", rating: 4 },
      { name: "CMB Intl 招银国际", role: "账簿管理人", rating: 3.5 },
    ],
    cornerstones: [{ name: "Qiming 启明创投", amount: "HKD 220M", pct: 20.0 }],
    aiNote:
      "18A 未盈利生物科技，历史波动较大，基本面评分偏低；估值高度依赖临床里程碑，管线进展是核心不确定性。",
  },
  {
    id: "apex",
    name: "Apex Logistics",
    cn: "顶峰物流",
    ticker: "9699.HK",
    exchange: "HKEX",
    sector: "industrial",
    status: "pending",
    sentiment: "neutral",
    score: 49,
    tier: "medium",
    tierLabel: "中盘股",
    offer: 13.4,
    raiseHKD: "2.4B",
    mcapHKD: "21.0B",
    listing: "Jun 30, 2026",
    sub: 6.8,
    rating: 3,
    ratingCount: 9,
    signal: "neutral",
    confidence: 55,
    desc: "区域智能仓储与冷链物流运营商，现金流稳定，成长性中性。",
    dims: [
      { k: "Chip", label: "筹码分布", score: 50 },
      { k: "Sponsor", label: "保荐质量", score: 58 },
      { k: "Underwriter", label: "承销实力", score: 52 },
      { k: "Sector", label: "板块动能", score: 44 },
      { k: "Fundamentals", label: "基本面", score: 60 },
      { k: "Cornerstone", label: "基石质量", score: 38 },
    ],
    institutions: [
      { name: "Haitong 海通国际", role: "联席保荐人", rating: 3.5 },
      { name: "BOCI 中银国际", role: "账簿管理人", rating: 3 },
    ],
    cornerstones: [],
    aiNote:
      "需求平淡，6.8× 认购偏冷，且缺乏基石支撑；现金流稳定但成长性中性，需求强度是主要观察点。",
  },
  {
    id: "greenfield",
    name: "GreenField Energy",
    cn: "绿野能源",
    ticker: "0586.HK",
    exchange: "HKEX",
    sector: "energy",
    status: "listed",
    sentiment: "bearish",
    score: 31,
    tier: "small",
    tierLabel: "小盘股",
    offer: 6.2,
    raiseHKD: "0.9B",
    mcapHKD: "5.6B",
    listing: "Jun 12, 2026",
    sub: 2.1,
    rating: 2.5,
    ratingCount: 7,
    signal: "negative",
    confidence: 64,
    desc: "光伏组件制造商，行业产能过剩、毛利承压。上市首日破发。",
    dims: [
      { k: "Chip", label: "筹码分布", score: 28 },
      { k: "Sponsor", label: "保荐质量", score: 40 },
      { k: "Underwriter", label: "承销实力", score: 35 },
      { k: "Sector", label: "板块动能", score: 22 },
      { k: "Fundamentals", label: "基本面", score: 30 },
      { k: "Cornerstone", label: "基石质量", score: 18 },
    ],
    institutions: [{ name: "Guotai Junan 国泰君安", role: "独家保荐人", rating: 2.5 }],
    cornerstones: [],
    aiNote:
      "行业景气度低、认购冷淡，上市首日已破发，多维评分全面偏弱；行业产能过剩与毛利承压，是其关键风险。",
  },
];

export function findIpo(id: string): IpoRecord | undefined {
  return IPOS.find((ipo) => ipo.id === id);
}
