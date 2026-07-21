/**
 * Rich IPO workbench mock dataset + lookups (FP1), adapted from the design
 * prototype `docs/AiphaBee Design System/apps/ipo-workbench/data.jsx`.
 * Illustrative mock only — the real data arrives from Codex's worker inside the
 * shared `ResponseEnvelope<T>`. Every user-visible vendor/analysis text field
 * carries an explicit locale map and is selected before entering that envelope.
 */
import type { BadgeTone } from "../ds";
import type {
  DemandSignal,
  DemandSignalConfig,
  IpoContentLocale,
  IpoLocalizedText,
  IpoRecord,
  IpoSentiment,
  ResolvedIpoRecord,
  ResolvedIpoValue,
} from "../lib/api/ipo-types";

function localizedText(
  zhHant: string,
  zhHans: string,
  en: string,
): IpoLocalizedText {
  return {
    kind: "ipo_localized_text",
    values: { "zh-Hant": zhHant, "zh-Hans": zhHans, en },
  };
}

function localeNeutralText(value: string): IpoLocalizedText {
  return localizedText(value, value, value);
}

const STRUCTURED_TEXT = {
  mainBoard: localizedText("主板", "主板", "Main Board"),
  offerOpens: localizedText("公開發售開始", "公开发售开始", "Public offer opens"),
  offerCloses: localizedText("公開發售截止", "公开发售截止", "Public offer closes"),
  pricingDay: localizedText("定價日", "定价日", "Pricing day"),
  allotmentPublished: localizedText("公布分配結果", "公布分配结果", "Allotment results published"),
  greyMarket: localizedText("暗盤交易", "暗盘交易", "Grey-market trading"),
  listingDay: localizedText("上市日", "上市日", "Listing day"),
  poolA: localizedText("≤ HK$5M 申請", "≤ HK$5M 申请", "Applications ≤ HK$5M"),
  poolB: localizedText("> HK$5M 申請", "> HK$5M 申请", "Applications > HK$5M"),
  trigger15To50: localizedText("≥ 15× 且 < 50×", "≥ 15× 且 < 50×", "≥ 15× and < 50×"),
  trigger50To100: localizedText("≥ 50× 且 < 100×", "≥ 50× 且 < 100×", "≥ 50× and < 100×"),
  trigger100: localeNeutralText("≥ 100×"),
  sixMonths: localizedText("六個月", "六个月", "Six months"),
  controllingShareholder: localizedText("控股股東", "控股股东", "Controlling shareholder"),
  cornerstoneInvestors: localizedText("基石投資者", "基石投资者", "Cornerstone investors"),
  jointSponsor: localizedText("聯席保薦人", "联席保荐人", "Joint sponsor"),
  soleSponsor: localizedText("獨家保薦人", "独家保荐人", "Sole sponsor"),
  bookrunner: localizedText("賬簿管理人", "账簿管理人", "Bookrunner"),
  tbd: localizedText("待定", "待定", "TBD"),
  notApplicable: localizedText("不適用", "不适用", "Not applicable"),
  prospectusSource: localizedText("HKEX 招股章程 · 聯交所披露易", "HKEX 招股章程 · 联交所披露易", "HKEX prospectus · HKEXnews"),
} as const;

/* ---------- label maps ---------- */
export const SECTOR_LABEL = {
  tech: '科技 Technology', health: '生物医药 Healthcare',
  fintech: '金融科技 Fintech', industrial: '工业 Industrials',
  energy: '能源 Energy', consumer: '消费 Consumer', property: '房地产 Property',
};

/* IPO lifecycle stages (the pipeline lanes) */
export const STAGES = [
  { key: 'processing',  label: '处理中',     en: 'In Processing', tone: 'neutral', icon: 'file-clock' },
  { key: 'subscribing', label: '招股中',     en: 'Subscribing',   tone: 'honey',   icon: 'flame' },
  { key: 'grey',        label: '暗盘 / 上市', en: 'Grey · Listed', tone: 'info',    icon: 'activity' },
  { key: 'allotted',    label: '已公布分配',  en: 'Allotted',      tone: 'bullish', icon: 'check-check' },
  { key: 'withdrawn',   label: '撤回 / 失效', en: 'Withdrawn',     tone: 'bearish', icon: 'x-circle' },
];
export const STAGE_BY = Object.fromEntries(STAGES.map((s) => [s.key, s] as const));

export const LISTING_TYPE = {
  normal: 'Normal 普通',
  '18a': '18A 未盈利生物科技',
  '18c': '18C 特专科技',
  intro: 'By Introduction 介绍上市',
};

export const SENTIMENT_TONE: Record<IpoSentiment, BadgeTone> = { bullish: 'bullish', cautious: 'warning', neutral: 'neutral', bearish: 'bearish' };
export const SENTIMENT_LABEL = { bullish: '牛市 Bullish', cautious: '谨慎乐观 Cautious', neutral: '中性 Neutral', bearish: '熊市 Bearish' };
/* AiphaBee 研究信号（描述性，非投资建议 / Gate-0 research signal, not advice） */
export const DEMAND_SIGNAL_CFG: Record<DemandSignal, DemandSignalConfig> = {
  strong:  { tone: 'bullish', label: '需求强劲 Strong Demand' },
  solid:   { tone: 'bullish', label: '需求稳健 Solid Demand' },
  neutral: { tone: 'neutral', label: '需求中性 Neutral' },
  weak:    { tone: 'bearish', label: '需求疲弱 Weak Demand' },
  unknown: { tone: 'neutral', label: '数据不足 Insufficient' },
};

/* ============================================================
   IPO records
   ============================================================ */
export const IPO_FIXTURES: IpoRecord[] = [
  /* ---- 1. SUBSCRIBING — hot tech, live sub multiple ---- */
  {
    id: 'honeycomb', name: 'Honeycomb Intelligence', cn: '蜂巢智能', ticker: '2769.HK',
    exchange: 'HKEX', board: STRUCTURED_TEXT.mainBoard, sector: 'tech', listingType: 'normal',
    stage: 'subscribing', sentiment: 'bullish', score: 78, confidence: 86, demandSignal: 'solid',
    tierLabel: localizedText('中盤股', '中盘股', 'Mid-cap'),
    desc: localizedText(
      'AI 投研基礎設施服務商，為機構提供多模型估值與盡調自動化。基石陣容強勁，公開發售錄得火熱超額認購。',
      'AI 投研基础设施服务商，为机构提供多模型估值与尽调自动化。基石阵容强劲，公开发售录得火热超额认购。',
      'An AI research infrastructure provider offering institutions multi-model valuation and automated due diligence. Its cornerstone lineup is strong and the public offer is heavily oversubscribed.',
    ),
    terms: {
      priceLow: 22.40, priceHigh: 24.80, finalPrice: null, ccy: 'HKD',
      entryFee: 5009.0, lotSize: 200,
      sharesOffered: localizedText('1.70 億股', '1.70 亿股', '170 million shares'),
      greenshoe: localeNeutralText('15%'),
      publicPct: 10, intlPct: 90, raiseHKD: localeNeutralText('4.2B'),
      mcapHKD: localeNeutralText('38.6B'), nta: localeNeutralText('HK$6.85'),
      pe: localeNeutralText('32.4×'), pb: localeNeutralText('5.1×'),
    },
    subPeriod: { start: localeNeutralText('Jun 18'), end: localeNeutralText('Jun 23 12:00') },
    listingDate: localeNeutralText('Jun 26, 2026'), pricingDate: localeNeutralText('Jun 23, 2026'),
    live: { subPublic: 128.4, subIntl: 6.2, marginDays: localizedText('5.5 日', '5.5 天', '5.5 days'), greyChg: null,
      validApps: null, oneLotRate: null, headHammer: null, clawbackApplied: null },
    timetable: [
      { type: 'open', title: STRUCTURED_TEXT.offerOpens, at: localeNeutralText('Jun 18 09:00'), done: true },
      { type: 'close', title: STRUCTURED_TEXT.offerCloses, at: localeNeutralText('Jun 23 12:00'), done: false, active: true },
      { type: 'price', title: STRUCTURED_TEXT.pricingDay, at: localeNeutralText('Jun 23'), done: false },
      { type: 'allot', title: STRUCTURED_TEXT.allotmentPublished, at: localeNeutralText('Jun 25'), done: false },
      { type: 'grey', title: STRUCTURED_TEXT.greyMarket, at: localeNeutralText('Jun 25 16:15'), done: false },
      { type: 'list', title: STRUCTURED_TEXT.listingDay, at: localeNeutralText('Jun 26 09:30'), done: false },
    ],
    pools: [
      { name: 'Pool A', desc: STRUCTURED_TEXT.poolA, lots: localizedText('7,500 手', '7,500 手', '7,500 lots'), apps: null },
      { name: 'Pool B', desc: STRUCTURED_TEXT.poolB, lots: localizedText('7,500 手', '7,500 手', '7,500 lots'), apps: null },
    ],
    clawback: [
      { trigger: STRUCTURED_TEXT.trigger15To50, publicPct: localeNeutralText('30%') },
      { trigger: STRUCTURED_TEXT.trigger50To100, publicPct: localeNeutralText('40%') },
      { trigger: STRUCTURED_TEXT.trigger100, publicPct: localeNeutralText('50%'), active: true },
    ],
    applicationTiers: [
      { lots: 1, shares: 200, amount: 5009, hot: true },
      { lots: 5, shares: 1000, amount: 25045 },
      { lots: 10, shares: 2000, amount: 50090 },
      { lots: 50, shares: 10000, amount: 250450 },
      { lots: 100, shares: 20000, amount: 500900 },
    ],
    allotment: null,
    cornerstones: [
      { name: 'Hillhouse 高瓴', amount: localeNeutralText('HKD 600M'), pct: 14.3, lockup: STRUCTURED_TEXT.sixMonths },
      { name: 'GIC Singapore', amount: localeNeutralText('HKD 420M'), pct: 10.0, lockup: STRUCTURED_TEXT.sixMonths },
      { name: 'Tencent 腾讯', amount: localeNeutralText('HKD 380M'), pct: 9.0, lockup: STRUCTURED_TEXT.sixMonths },
    ],
    lockup: [
      { type: STRUCTURED_TEXT.controllingShareholder, endDate: localeNeutralText('Dec 26, 2026'), pct: localeNeutralText('52.4%'), shares: localizedText('8.9 億股', '8.9 亿股', '890 million shares') },
      { type: STRUCTURED_TEXT.cornerstoneInvestors, endDate: localeNeutralText('Dec 26, 2026'), pct: localeNeutralText('33.3%'), shares: localizedText('0.57 億股', '0.57 亿股', '57 million shares') },
    ],
    sponsors: [
      { name: 'Morgan Stanley', role: STRUCTURED_TEXT.jointSponsor, rating: 5 },
      { name: 'CICC 中金公司', role: STRUCTURED_TEXT.jointSponsor, rating: 4.5 },
      { name: 'Goldman Sachs', role: STRUCTURED_TEXT.bookrunner, rating: 4 },
    ],
    aiNote: localizedText(
      '科技板塊情緒向好，加上優質基石陣容，公開發售 128× 超額認購觸發 50% 回撥上限。定價或落於區間上沿；歷史樣本顯示，此類高倍超購標的一手中籤率通常偏低。',
      '科技板块情绪向好，加上优质基石阵容，公开发售 128× 超额认购触发 50% 回拨上限。定价或落于区间上沿；历史样本显示，此类高倍超购标的一手中签率通常偏低。',
      'Positive technology-sector sentiment and a high-quality cornerstone lineup have driven 128× public-offer subscription, triggering the 50% clawback ceiling. Pricing may land near the top of the range; historically, similarly oversubscribed deals tend to have a low one-lot success rate.',
    ),
    riskSummary: [
      { level: 'mid', text: localizedText('估值偏高：PE 32×，高於同業中位數 24×。', '估值偏高：PE 32×，高于同业中位数 24×。', 'Valuation is elevated: P/E is 32× versus a 24× peer median.') },
      { level: 'low', text: localizedText('基石鎖定六個月，上市初期拋售壓力可控。', '基石锁定六个月，上市初期抛售压力可控。', 'Cornerstone shares are locked up for six months, limiting early selling pressure.') },
      { level: 'mid', text: localizedText('業務高度依賴大型機構客戶，存在集中度風險。', '业务高度依赖大型机构客户，存在集中度风险。', 'The business depends heavily on large institutional clients, creating concentration risk.') },
    ],
    profile: {
      overview: localizedText(
        '蜂巢智能是面向資產管理機構的 AI 投研基礎設施服務商，提供多模型估值引擎、盡職調查自動化與投資組合風險監控。截至最近財年，付費機構客戶 240 家，淨收入留存率 128%。',
        '蜂巢智能是面向资产管理机构的 AI 投研基础设施服务商，提供多模型估值引擎、尽职调查自动化与投资组合风险监控。截至最近财年，付费机构客户 240 家，净收入留存率 128%。',
        'Honeycomb Intelligence provides AI research infrastructure to asset managers, including multi-model valuation engines, automated due diligence and portfolio risk monitoring. It had 240 paying institutional clients and 128% net revenue retention in the latest financial year.',
      ),
      useOfProceeds: [
        { pct: 45, label: localizedText('研發與模型訓練', '研发与模型训练', 'R&D and model training') },
        { pct: 25, label: localizedText('海外市場拓展', '海外市场拓展', 'Overseas market expansion') },
        { pct: 20, label: localizedText('數據採購與合規', '数据采购与合规', 'Data procurement and compliance') },
        { pct: 10, label: localizedText('一般營運資金', '一般营运资金', 'General working capital') },
      ],
      risks: [
        localizedText('核心客戶集中度較高，前五大客戶貢獻約 41% 收入。', '核心客户集中度较高，前五大客户贡献约 41% 收入。', 'Customer concentration is high, with the top five clients contributing about 41% of revenue.'),
        localizedText('AI 監管政策與數據合規要求趨嚴，或增加營運成本。', 'AI 监管政策与数据合规要求趋严，或增加运营成本。', 'Tighter AI regulation and data-compliance requirements may raise operating costs.'),
        localizedText('估值對增長預期敏感，增長不達預期可能引發回調。', '估值对增长预期敏感，增长不达预期可能引发回调。', 'The valuation is sensitive to growth expectations; a shortfall could trigger a correction.'),
      ],
      advantages: [
        localizedText('多模型估值引擎具備技術壁壘，遷移成本高。', '多模型估值引擎具备技术壁垒，迁移成本高。', 'Its multi-model valuation engine has technical barriers and high switching costs.'),
        localizedText('淨收入留存率 128%，客戶黏性與擴張能力強。', '净收入留存率 128%，客户黏性与扩张能力强。', 'Net revenue retention of 128% indicates strong customer stickiness and expansion.'),
        localizedText('基石陣容涵蓋一線機構，背書效應顯著。', '基石阵容涵盖一线机构，背书效应显著。', 'The cornerstone group includes leading institutions, providing strong validation.'),
      ],
      company: [
        { k: localizedText('成立年份', '成立年份', 'Founded'), v: localeNeutralText('2018') },
        { k: localizedText('總部', '总部', 'Headquarters'), v: localizedText('香港 · 新加坡', '香港 · 新加坡', 'Hong Kong · Singapore') },
        { k: localizedText('員工人數', '员工人数', 'Employees'), v: localizedText('約 680 人', '约 680 人', 'Approximately 680') },
        { k: localizedText('最近財年淨收入', '最近财年净收入', 'Latest-year net revenue'), v: localeNeutralText('HK$1.92B') },
        { k: localizedText('淨收入留存率', '净收入留存率', 'Net revenue retention'), v: localeNeutralText('128%') },
      ],
    },
    evidence: { asOf: 'Jun 23, 2026 11:40 HKT', dataVersion: 'v2026.06.23-3', methodology: 'm-ipo-1.4', source: STRUCTURED_TEXT.prospectusSource },
  },

  /* ---- 2. ALLOTTED — win rate + clawback published ---- */
  {
    id: 'lotus', name: 'Lotus Digital Pay', cn: '莲花数科', ticker: '2611.HK',
    exchange: 'HKEX', board: STRUCTURED_TEXT.mainBoard, sector: 'fintech', listingType: 'normal',
    stage: 'allotted', sentiment: 'bullish', score: 71, confidence: 79, demandSignal: 'solid',
    tierLabel: localizedText('大盤股', '大盘股', 'Large-cap'),
    desc: localizedText(
      '東南亞跨境支付與數碼錢包龍頭，盈利穩健，監管護城河深厚。分配結果已公布，一手中籤率中等。',
      '东南亚跨境支付与数字钱包龙头，盈利稳健，监管护城河深厚。分配结果已公布，一手中签率中等。',
      'A leading Southeast Asian cross-border payments and digital-wallet operator with steady profitability and a strong regulatory moat. Allotment results are published, with a moderate one-lot success rate.',
    ),
    terms: {
      priceLow: 16.80, priceHigh: 18.20, finalPrice: 18.20, ccy: 'HKD',
      entryFee: 3676.0, lotSize: 200,
      sharesOffered: localizedText('3.74 億股', '3.74 亿股', '374 million shares'),
      greenshoe: localeNeutralText('15%'),
      publicPct: 12, intlPct: 88, raiseHKD: localeNeutralText('6.8B'),
      mcapHKD: localeNeutralText('92.1B'), nta: localeNeutralText('HK$9.20'),
      pe: localeNeutralText('27.6×'), pb: localeNeutralText('3.4×'),
    },
    subPeriod: { start: localeNeutralText('Jun 12'), end: localeNeutralText('Jun 17') },
    listingDate: localeNeutralText('Jun 23, 2026'), pricingDate: localeNeutralText('Jun 17, 2026'),
    live: { subPublic: 64.2, subIntl: 4.1, marginDays: null, greyChg: 12.4,
      validApps: localizedText('186,420 戶', '186,420 户', '186,420 applicants'), oneLotRate: 32,
      headHammer: localizedText('6,000 手', '6,000 手', '6,000 lots'), clawbackApplied: localeNeutralText('40%') },
    timetable: [
      { type: 'open', title: STRUCTURED_TEXT.offerOpens, at: localeNeutralText('Jun 12 09:00'), done: true },
      { type: 'close', title: STRUCTURED_TEXT.offerCloses, at: localeNeutralText('Jun 17 12:00'), done: true },
      { type: 'price', title: localizedText('定價 HK$18.20（區間上沿）', '定价 HK$18.20（区间上沿）', 'Priced at the HK$18.20 top end'), at: localeNeutralText('Jun 17'), done: true },
      { type: 'allot', title: STRUCTURED_TEXT.allotmentPublished, at: localeNeutralText('Jun 20'), done: true, active: true },
      { type: 'grey', title: localizedText('暗盤 +12.4%', '暗盘 +12.4%', 'Grey market +12.4%'), at: localeNeutralText('Jun 20 16:15'), done: true },
      { type: 'list', title: STRUCTURED_TEXT.listingDay, at: localeNeutralText('Jun 23 09:30'), done: false },
    ],
    pools: [
      { name: 'Pool A', desc: STRUCTURED_TEXT.poolA, lots: localizedText('11,220 手', '11,220 手', '11,220 lots'), apps: localizedText('171,300 戶', '171,300 户', '171,300 applicants') },
      { name: 'Pool B', desc: STRUCTURED_TEXT.poolB, lots: localizedText('11,220 手', '11,220 手', '11,220 lots'), apps: localizedText('15,120 戶', '15,120 户', '15,120 applicants') },
    ],
    clawback: [
      { trigger: STRUCTURED_TEXT.trigger15To50, publicPct: localeNeutralText('30%') },
      { trigger: STRUCTURED_TEXT.trigger50To100, publicPct: localeNeutralText('40%'), active: true },
      { trigger: STRUCTURED_TEXT.trigger100, publicPct: localeNeutralText('50%') },
    ],
    applicationTiers: [
      { lots: 1, shares: 200, amount: 3676, rate: localeNeutralText('32%') },
      { lots: 5, shares: 1000, amount: 18380, rate: localeNeutralText('58%') },
      { lots: 10, shares: 2000, amount: 36760, rate: localeNeutralText('85%') },
      { lots: 20, shares: 4000, amount: 73520, rate: localizedText('100%（穩中一手）', '100%（稳中一手）', '100% (at least one lot)') },
    ],
    allotment: {
      oneLotRate: 32, validApps: localizedText('186,420 戶', '186,420 户', '186,420 applicants'),
      headHammer: localizedText('6,000 手', '6,000 手', '6,000 lots'),
      clawbackApplied: localeNeutralText('40%'), subPublic: 64.2, finalPrice: 18.20,
      result: [
        { lots: 1, applied: localizedText('171,300 戶', '171,300 户', '171,300 applicants'), rate: localeNeutralText('32%') },
        { lots: 5, applied: localizedText('9,640 戶', '9,640 户', '9,640 applicants'), rate: localeNeutralText('58%') },
        { lots: 10, applied: localizedText('3,210 戶', '3,210 户', '3,210 applicants'), rate: localeNeutralText('85%') },
        { lots: 20, applied: localizedText('2,270 戶', '2,270 户', '2,270 applicants'), rate: localeNeutralText('100%') },
      ],
    },
    cornerstones: [
      { name: 'Temasek 淡马锡', amount: localeNeutralText('HKD 800M'), pct: 11.8, lockup: STRUCTURED_TEXT.sixMonths },
      { name: 'BlackRock', amount: localeNeutralText('HKD 500M'), pct: 7.4, lockup: STRUCTURED_TEXT.sixMonths },
    ],
    lockup: [
      { type: STRUCTURED_TEXT.controllingShareholder, endDate: localeNeutralText('Dec 23, 2026'), pct: localeNeutralText('61.2%'), shares: localizedText('22.9 億股', '22.9 亿股', '2.29 billion shares') },
      { type: STRUCTURED_TEXT.cornerstoneInvestors, endDate: localeNeutralText('Dec 23, 2026'), pct: localeNeutralText('19.2%'), shares: localizedText('0.72 億股', '0.72 亿股', '72 million shares') },
    ],
    sponsors: [
      { name: 'JPMorgan', role: STRUCTURED_TEXT.jointSponsor, rating: 4.5 },
      { name: 'UBS', role: STRUCTURED_TEXT.bookrunner, rating: 4 },
      { name: 'Huatai 华泰', role: STRUCTURED_TEXT.bookrunner, rating: 3.5 },
    ],
    aiNote: localizedText(
      '上沿 HK$18.20 定價及暗盤 +12.4% 共同反映需求穩健。公開發售 64× 觸發 40% 回撥，一手中籤率 32% 處於中等區間。盈利穩健，自由現金流為正。',
      '上沿 HK$18.20 定价及暗盘 +12.4% 共同反映需求稳健。公开发售 64× 触发 40% 回拨，一手中签率 32% 处于中等区间。盈利稳健，自由现金流为正。',
      'Pricing at the HK$18.20 top end and a 12.4% grey-market gain both indicate solid demand. Public subscription reached 64× and triggered a 40% clawback; the 32% one-lot success rate is moderate. Profitability is steady and free cash flow is positive.',
    ),
    riskSummary: [
      { level: 'low', text: localizedText('盈利穩健，現金流為正。', '盈利稳健，现金流为正。', 'Profitability is steady and cash flow is positive.') },
      { level: 'mid', text: localizedText('跨境支付監管多變，需要關注牌照風險。', '跨境支付监管多变，需要关注牌照风险。', 'Cross-border payment regulation changes frequently, creating licence risk.') },
      { level: 'low', text: localizedText('暗盤已有正溢價，跌破發售價的風險較低。', '暗盘已有正溢价，跌破发行价的风险较低。', 'The positive grey-market premium indicates a lower risk of trading below the offer price.') },
    ],
    profile: {
      overview: localizedText(
        '蓮花數科營運東南亞領先的跨境支付與數碼錢包網絡，覆蓋六國，月活躍用戶 4,200 萬。最近財年經調整淨利潤為 HK$2.4B，同比增長 34%。',
        '莲花数科运营东南亚领先的跨境支付与数字钱包网络，覆盖六国，月活跃用户 4,200 万。最近财年经调整净利润为 HK$2.4B，同比增长 34%。',
        'Lotus Digital Pay operates a leading Southeast Asian cross-border payments and digital-wallet network spanning six countries and 42 million monthly active users. Adjusted net profit was HK$2.4B in the latest financial year, up 34% year on year.',
      ),
      useOfProceeds: [
        { pct: 40, label: localizedText('區域擴張與牌照', '区域扩张与牌照', 'Regional expansion and licences') },
        { pct: 30, label: localizedText('技術與風控', '技术与风控', 'Technology and risk controls') },
        { pct: 20, label: localizedText('策略性併購', '战略并购', 'Strategic M&A') },
        { pct: 10, label: localizedText('營運資金', '营运资金', 'Working capital') },
      ],
      risks: [
        localizedText('多國支付牌照與外匯監管存在政策不確定性。', '多国支付牌照与外汇监管存在政策不确定性。', 'Payment licences and foreign-exchange rules across multiple jurisdictions carry policy uncertainty.'),
        localizedText('行業競爭激烈，費率持續受壓。', '行业竞争激烈，费率持续承压。', 'Intense industry competition continues to pressure fee rates.'),
        localizedText('匯率波動影響跨境結算收入。', '汇率波动影响跨境结算收入。', 'Exchange-rate volatility affects cross-border settlement revenue.'),
      ],
      advantages: [
        localizedText('區域網絡效應與牌照壁壘構築護城河。', '区域网络效应与牌照壁垒构筑护城河。', 'Regional network effects and licence barriers form a competitive moat.'),
        localizedText('盈利能力領先同業，自由現金流為正。', '盈利能力领先同业，自由现金流为正。', 'Profitability leads peers and free cash flow is positive.'),
        localizedText('淡馬錫與貝萊德的支持增強機構信心。', '淡马锡与贝莱德的支持增强机构信心。', 'Backing from Temasek and BlackRock reinforces institutional confidence.'),
      ],
      company: [
        { k: localizedText('成立年份', '成立年份', 'Founded'), v: localeNeutralText('2014') },
        { k: localizedText('總部', '总部', 'Headquarters'), v: localizedText('新加坡', '新加坡', 'Singapore') },
        { k: localizedText('覆蓋市場', '覆盖市场', 'Markets covered'), v: localizedText('東南亞六國', '东南亚六国', 'Six Southeast Asian countries') },
        { k: localizedText('月活躍用戶', '月活跃用户', 'Monthly active users'), v: localizedText('4,200 萬', '4,200 万', '42 million') },
        { k: localizedText('經調整淨利潤', '经调整净利润', 'Adjusted net profit'), v: localeNeutralText('HK$2.4B') },
      ],
    },
    evidence: { asOf: 'Jun 20, 2026 18:05 HKT', dataVersion: 'v2026.06.20-1', methodology: 'm-ipo-1.4', source: localizedText('HKEX 分配結果公告 · 聯交所披露易', 'HKEX 分配结果公告 · 联交所披露易', 'HKEX allotment-results announcement · HKEXnews') },
  },

  /* ---- 3. PROCESSING — 18A biotech, post-hearing ---- */
  {
    id: 'pearl', name: 'Pearl River Biotech', cn: '珠江生物', ticker: '—',
    exchange: 'HKEX', board: STRUCTURED_TEXT.mainBoard, sector: 'health', listingType: '18a',
    stage: 'processing', sentiment: 'cautious', score: 54, confidence: 61, demandSignal: 'neutral',
    tierLabel: localizedText('小盤股', '小盘股', 'Small-cap'),
    desc: localizedText(
      '創新藥企業，核心管線處於 II 期臨床。已通過聆訊，尚未啟動招股；公司未盈利，估值依賴里程碑預期。',
      '创新药企业，核心管线处于 II 期临床。已通过聆讯，尚未启动招股；公司未盈利，估值依赖里程碑预期。',
      'An innovative drug developer whose lead pipeline is in Phase II trials. It has passed its listing hearing but has not launched the offer; the company is pre-profit and valuation depends on clinical milestones.',
    ),
    terms: {
      priceLow: null, priceHigh: null, finalPrice: null, ccy: 'HKD',
      entryFee: null, lotSize: 500,
      sharesOffered: localizedText('約 1.2 億股（指示性）', '约 1.2 亿股（指示性）', 'Approximately 120 million shares (indicative)'),
      greenshoe: localeNeutralText('15%'), publicPct: 10, intlPct: 90,
      raiseHKD: localizedText('~1.1B（指示性）', '~1.1B（指示性）', '~1.1B (indicative)'),
      mcapHKD: localizedText('~8.4B（指示性）', '~8.4B（指示性）', '~8.4B (indicative)'),
      nta: localizedText('待定', '待定', 'TBD'),
      pe: localizedText('不適用（未盈利）', '不适用（未盈利）', 'N/A (pre-profit)'),
      pb: localizedText('待定', '待定', 'TBD'),
    },
    subPeriod: { start: STRUCTURED_TEXT.tbd, end: STRUCTURED_TEXT.tbd },
    listingDate: STRUCTURED_TEXT.tbd, pricingDate: STRUCTURED_TEXT.tbd,
    live: { subPublic: null, subIntl: null, marginDays: null, greyChg: null,
      validApps: null, oneLotRate: null, headHammer: null, clawbackApplied: null },
    timetable: [
      { type: 'file', title: localizedText('遞交上市申請', '递交上市申请', 'Listing application filed'), at: localeNeutralText('Apr 02'), done: true },
      { type: 'hearing', title: localizedText('通過上市聆訊', '通过上市聆讯', 'Listing hearing passed'), at: localeNeutralText('Jun 16'), done: true, active: true },
      { type: 'roadshow', title: localizedText('路演／預路演', '路演／预路演', 'Roadshow / pre-roadshow'), at: STRUCTURED_TEXT.tbd, done: false },
      { type: 'open', title: localizedText('啟動公開發售', '启动公开发售', 'Public offer launch'), at: STRUCTURED_TEXT.tbd, done: false },
      { type: 'list', title: localizedText('預計上市', '预计上市', 'Expected listing'), at: STRUCTURED_TEXT.tbd, done: false },
    ],
    pools: null,
    clawback: [
      { trigger: STRUCTURED_TEXT.trigger15To50, publicPct: localeNeutralText('30%') },
      { trigger: STRUCTURED_TEXT.trigger50To100, publicPct: localeNeutralText('40%') },
      { trigger: STRUCTURED_TEXT.trigger100, publicPct: localeNeutralText('50%') },
    ],
    applicationTiers: null,
    allotment: null,
    cornerstones: [
      { name: 'Qiming 启明创投', amount: localizedText('HKD 220M（意向）', 'HKD 220M（意向）', 'HKD 220M (indicated)'), pct: 20.0, lockup: STRUCTURED_TEXT.sixMonths },
    ],
    lockup: [
      { type: STRUCTURED_TEXT.controllingShareholder, endDate: localizedText('上市後六個月', '上市后六个月', 'Six months after listing'), pct: STRUCTURED_TEXT.tbd, shares: STRUCTURED_TEXT.tbd },
    ],
    sponsors: [
      { name: 'CICC 中金公司', role: STRUCTURED_TEXT.soleSponsor, rating: 4 },
      { name: 'CMB Intl 招银国际', role: STRUCTURED_TEXT.bookrunner, rating: 3.5 },
    ],
    aiNote: localizedText(
      '這是一家按 18A 規則上市的未盈利生物科技公司，已通過聆訊但招股細節未定。核心管線 II 期數據是關鍵催化因素；招股條款、定價區間與基石陣容尚未公布，需求強度暫時無法測算。',
      '这是一家按 18A 规则上市的未盈利生物科技公司，已通过聆讯但招股细节未定。核心管线 II 期数据是关键催化因素；招股条款、定价区间与基石阵容尚未公布，需求强度暂时无法测算。',
      'This is a pre-profit biotech listing under Chapter 18A. It has passed its hearing, but offer details remain undecided. Phase II data for the lead programme is the key catalyst; demand cannot yet be assessed because terms, pricing and cornerstone participation have not been announced.',
    ),
    riskSummary: [
      { level: 'high', text: localizedText('核心管線處於 II 期，臨床失敗風險顯著。', '核心管线处于 II 期，临床失败风险显著。', 'The lead programme is in Phase II and carries significant clinical failure risk.') },
      { level: 'high', text: localizedText('公司尚未盈利，估值高度依賴里程碑預期。', '公司尚未盈利，估值高度依赖里程碑预期。', 'The company is pre-profit and its valuation depends heavily on milestone expectations.') },
      { level: 'mid', text: localizedText('招股條款未定，定價區間存在不確定性。', '招股条款未定，定价区间存在不确定性。', 'Offer terms are undecided, leaving the pricing range uncertain.') },
    ],
    profile: {
      overview: localizedText(
        '珠江生物專注腫瘤免疫創新藥研發，核心管線 PRB-201（PD-L1/VEGF 雙抗）處於 II 期臨床。公司尚無商業化產品，依據 18A 規則申請上市。',
        '珠江生物专注肿瘤免疫创新药研发，核心管线 PRB-201（PD-L1/VEGF 双抗）处于 II 期临床。公司尚无商业化产品，依据 18A 规则申请上市。',
        'Pearl River Biotech develops innovative immuno-oncology therapies. Its lead programme, PRB-201, is a PD-L1/VEGF bispecific antibody in Phase II trials. The company has no commercialised product and is applying to list under Chapter 18A.',
      ),
      useOfProceeds: [
        { pct: 55, label: localizedText('核心管線臨床試驗', '核心管线临床试验', 'Lead-programme clinical trials') },
        { pct: 25, label: localizedText('產能與 CMC', '产能与 CMC', 'Manufacturing capacity and CMC') },
        { pct: 12, label: localizedText('管線拓展', '管线拓展', 'Pipeline expansion') },
        { pct: 8, label: localizedText('營運資金', '营运资金', 'Working capital') },
      ],
      risks: [
        localizedText('核心管線仍處於 II 期，存在臨床失敗與延誤風險。', '核心管线仍处于 II 期，存在临床失败与延误风险。', 'The lead programme remains in Phase II and faces clinical failure and delay risk.'),
        localizedText('公司沒有收入與利潤，持續依賴融資，存在攤薄風險。', '公司没有收入与利润，持续依赖融资，存在摊薄风险。', 'With no revenue or profit, the company remains dependent on funding and faces dilution risk.'),
        localizedText('創新藥競爭激烈，商業化前景不確定。', '创新药竞争激烈，商业化前景不确定。', 'Competition in innovative drugs is intense and commercial prospects are uncertain.'),
      ],
      advantages: [
        localizedText('雙抗平台具差異化機制，具有成為同類首創的潛力。', '双抗平台具差异化机制，具有成为同类首创的潜力。', 'The bispecific platform has a differentiated mechanism with potential to be first in class.'),
        localizedText('核心團隊具備跨國藥企研發背景。', '核心团队具备跨国药企研发背景。', 'The core team has multinational pharmaceutical R&D experience.'),
        localizedText('已獲啟明創投意向基石支持。', '已获启明创投意向基石支持。', 'Qiming Venture Partners has indicated cornerstone support.'),
      ],
      company: [
        { k: localizedText('成立年份', '成立年份', 'Founded'), v: localeNeutralText('2019') },
        { k: localizedText('總部', '总部', 'Headquarters'), v: localizedText('廣州', '广州', 'Guangzhou') },
        { k: localizedText('核心管線', '核心管线', 'Lead programme'), v: localizedText('PRB-201（II 期）', 'PRB-201（II 期）', 'PRB-201 (Phase II)') },
        { k: localizedText('上市規則', '上市规则', 'Listing rule'), v: localizedText('主板 18A', '主板 18A', 'Main Board Chapter 18A') },
        { k: localizedText('商業化產品', '商业化产品', 'Commercialised products'), v: localizedText('暫無', '暂无', 'None') },
      ],
    },
    evidence: { asOf: 'Jun 17, 2026 09:20 HKT', dataVersion: 'v2026.06.17-2', methodology: 'm-ipo-1.4', source: localizedText('HKEX 聆訊後資料集 PHIP · 聯交所披露易', 'HKEX 聆讯后资料集 PHIP · 联交所披露易', 'HKEX post-hearing information pack · HKEXnews') },
  },

  /* ---- 4. BY INTRODUCTION — no pool / no clawback ---- */
  {
    id: 'meridian', name: 'Meridian Trust REIT', cn: '子午线房托', ticker: '0827.HK',
    exchange: 'HKEX', board: STRUCTURED_TEXT.mainBoard, sector: 'property', listingType: 'intro',
    stage: 'grey', sentiment: 'neutral', score: 58, confidence: 68, demandSignal: 'neutral',
    tierLabel: localizedText('中盤股', '中盘股', 'Mid-cap'),
    desc: localizedText(
      '以介紹方式上市的區域商業房地產信託，沒有公開發售或回撥機制；上市初期流動性偏低。',
      '以介绍方式上市的区域商业房地产信托，没有公开发售或回拨机制；上市初期流动性偏低。',
      'A regional commercial-property trust listing by introduction, with no public offer or clawback mechanism. Initial trading liquidity is expected to be limited.',
    ),
    terms: {
      priceLow: null, priceHigh: null, finalPrice: 22.00, ccy: 'HKD',
      entryFee: null, lotSize: 1000,
      sharesOffered: localizedText('不適用（介紹上市）', '不适用（介绍上市）', 'Not applicable (listing by introduction)'),
      greenshoe: localeNeutralText('—'), publicPct: 0, intlPct: 0,
      raiseHKD: localizedText('不適用（沒有發行新單位）', '不适用（没有发行新单位）', 'Not applicable (no new units issued)'),
      mcapHKD: localeNeutralText('24.0B'), nta: localeNeutralText('HK$25.60'),
      pe: localeNeutralText('—'), pb: localeNeutralText('0.86×'),
    },
    subPeriod: { start: STRUCTURED_TEXT.notApplicable, end: STRUCTURED_TEXT.notApplicable },
    listingDate: localeNeutralText('Jun 24, 2026'),
    pricingDate: localizedText('Jun 23, 2026（參考價）', 'Jun 23, 2026（参考价）', 'Jun 23, 2026 (reference price)'),
    live: { subPublic: null, subIntl: null, marginDays: null, greyChg: null,
      validApps: null, oneLotRate: null, headHammer: null, clawbackApplied: null },
    timetable: [
      { type: 'file', title: localizedText('遞交介紹上市申請', '递交介绍上市申请', 'Introduction-listing application filed'), at: localeNeutralText('May 05'), done: true },
      { type: 'hearing', title: localizedText('通過上市聆訊', '通过上市聆讯', 'Listing hearing passed'), at: localeNeutralText('Jun 10'), done: true },
      { type: 'ref', title: localizedText('公布參考價 HK$22.00', '公布参考价 HK$22.00', 'HK$22.00 reference price announced'), at: localeNeutralText('Jun 23'), done: true, active: true },
      { type: 'list', title: localizedText('以介紹方式上市', '以介绍方式上市', 'Listing by introduction'), at: localeNeutralText('Jun 24 09:30'), done: false },
    ],
    pools: null,
    clawback: null,
    applicationTiers: null,
    allotment: null,
    cornerstones: [],
    lockup: [
      { type: localizedText('原有單位持有人', '原单位持有人', 'Existing unitholders'), endDate: localizedText('沒有統一禁售期', '没有统一限售期', 'No uniform lock-up'), pct: localeNeutralText('—'), shares: localeNeutralText('—') },
    ],
    sponsors: [
      { name: 'HSBC 汇丰', role: localizedText('上市顧問', '上市顾问', 'Listing agent'), rating: 4 },
      { name: 'DBS 星展', role: localizedText('財務顧問', '财务顾问', 'Financial adviser'), rating: 3.5 },
    ],
    aiNote: localizedText(
      '介紹上市不涉及發行新單位或公開認購，因此沒有一手中籤率。開盤價由市場撮合決定，初期流動性偏低，價格波動可能較大。參考價相對資產淨值有折讓（P/NAV 0.86×）。',
      '介绍上市不涉及发行新单位或公开认购，因此没有一手中签率。开盘价由市场撮合决定，初期流动性偏低，价格波动可能较大。参考价相对资产净值有折让（P/NAV 0.86×）。',
      'A listing by introduction involves no new units or public subscription, so there is no one-lot success rate. The opening price is determined by market matching; limited initial liquidity may produce greater volatility. The reference price implies a discount to net asset value at 0.86× P/NAV.',
    ),
    riskSummary: [
      { level: 'mid', text: localizedText('介紹上市沒有募資，初期流動性偏低。', '介绍上市没有募资，初期流动性偏低。', 'The listing raises no new funds and initial liquidity is expected to be limited.') },
      { level: 'mid', text: localizedText('開盤價沒有發售價錨定，波動可能較大。', '开盘价没有发行价锚定，波动可能较大。', 'Without an offer-price anchor, the opening price may be more volatile.') },
      { level: 'low', text: localizedText('參考價相對資產淨值有折讓，提供一定估值緩衝。', '参考价相对资产净值有折让，提供一定估值缓冲。', 'The reference price is below net asset value, providing some valuation buffer.') },
    ],
    profile: {
      overview: localizedText(
        '子午線房託的資產組合包括粵港澳大灣區九項優質商業物業，出租率 94%，分派收益率約 6.2%。本次以介紹方式上市，不發行新單位或募集資金。',
        '子午线房托的资产组合包括粤港澳大湾区九项优质商业物业，出租率 94%，分派收益率约 6.2%。本次以介绍方式上市，不发行新单位或募集资金。',
        'Meridian Trust REIT owns nine high-quality commercial properties in the Greater Bay Area, with 94% occupancy and an estimated 6.2% distribution yield. It is listing by introduction, with no new units issued and no funds raised.',
      ),
      useOfProceeds: [
        { pct: 100, label: localizedText('不適用，介紹上市沒有募資', '不适用，介绍上市没有募资', 'Not applicable; no funds raised in a listing by introduction') },
      ],
      risks: [
        localizedText('介紹上市沒有承銷支持，初期成交可能清淡。', '介绍上市没有承销支持，初期成交可能清淡。', 'A listing by introduction has no underwriting support, so initial trading may be thin.'),
        localizedText('商業房地產受宏觀經濟與利率週期影響。', '商业房地产受宏观经济与利率周期影响。', 'Commercial property is exposed to macroeconomic and interest-rate cycles.'),
        localizedText('物業估值下跌將拖累資產淨值與分派。', '物业估值下跌将拖累资产净值与分派。', 'Lower property valuations would weigh on net asset value and distributions.'),
      ],
      advantages: [
        localizedText('資產組合出租率高，現金流穩定。', '资产组合出租率高，现金流稳定。', 'The portfolio has high occupancy and stable cash flow.'),
        localizedText('參考價低於資產淨值，存在折讓收窄空間。', '参考价低于资产净值，存在折让收窄空间。', 'The reference price is below net asset value, leaving room for the discount to narrow.'),
        localizedText('分派收益率具吸引力。', '分派收益率具吸引力。', 'The distribution yield is attractive.'),
      ],
      company: [
        { k: localizedText('成立年份', '成立年份', 'Founded'), v: localeNeutralText('2011') },
        { k: localizedText('物業數量', '物业数量', 'Properties'), v: localizedText('九項', '九项', 'Nine') },
        { k: localizedText('出租率', '出租率', 'Occupancy'), v: localeNeutralText('94%') },
        { k: localizedText('分派收益率', '分派收益率', 'Distribution yield'), v: localizedText('約 6.2%', '约 6.2%', 'Approximately 6.2%') },
        { k: localizedText('上市方式', '上市方式', 'Listing method'), v: localizedText('介紹上市', '介绍上市', 'By introduction') },
      ],
    },
    evidence: { asOf: 'Jun 23, 2026 17:30 HKT', dataVersion: 'v2026.06.23-1', methodology: 'm-ipo-1.4', source: localizedText('HKEX 上市文件 · 聯交所披露易', 'HKEX 上市文件 · 联交所披露易', 'HKEX listing document · HKEXnews') },
  },

  /* ---- 5. WITHDRAWN / FAILED ---- */
  {
    id: 'greenfield', name: 'GreenField Energy', cn: '绿野能源', ticker: '—',
    exchange: 'HKEX', board: STRUCTURED_TEXT.mainBoard, sector: 'energy', listingType: 'normal',
    stage: 'withdrawn', sentiment: 'bearish', score: 31, confidence: 64, demandSignal: 'weak',
    tierLabel: localizedText('小盤股', '小盘股', 'Small-cap'),
    desc: localizedText(
      '光伏組件製造商，受行業產能過剩與需求疲弱影響，公開發售認購不足，發行人決定撤回上市申請。',
      '光伏组件制造商，受行业产能过剩与需求疲弱影响，公开发售认购不足，发行人决定撤回上市申请。',
      'A solar-module manufacturer affected by industry overcapacity and weak demand. The public offer was undersubscribed and the issuer withdrew its listing application.',
    ),
    terms: {
      priceLow: 5.80, priceHigh: 6.20, finalPrice: null, ccy: 'HKD',
      entryFee: 3131.0, lotSize: 500,
      sharesOffered: localizedText('1.45 億股（已撤回）', '1.45 亿股（已撤回）', '145 million shares (withdrawn)'),
      greenshoe: localeNeutralText('—'), publicPct: 10, intlPct: 90,
      raiseHKD: localizedText('~0.9B（已撤回）', '~0.9B（已撤回）', '~0.9B (withdrawn)'),
      mcapHKD: localeNeutralText('~5.6B'), nta: localeNeutralText('HK$4.10'),
      pe: localizedText('虧損', '亏损', 'Loss-making'), pb: localeNeutralText('1.5×'),
    },
    subPeriod: { start: localeNeutralText('Jun 05'), end: localizedText('Jun 10（提前截止）', 'Jun 10（提前截止）', 'Jun 10 (closed early)') },
    listingDate: localizedText('已撤回', '已撤回', 'Withdrawn'),
    pricingDate: localizedText('未定價', '未定价', 'Not priced'),
    live: { subPublic: 0.4, subIntl: 0.3, marginDays: null, greyChg: null,
      validApps: null, oneLotRate: null, headHammer: null, clawbackApplied: null },
    timetable: [
      { type: 'open', title: STRUCTURED_TEXT.offerOpens, at: localeNeutralText('Jun 05 09:00'), done: true },
      { type: 'close', title: STRUCTURED_TEXT.offerCloses, at: localeNeutralText('Jun 10 12:00'), done: true },
      { type: 'withdraw', title: localizedText('撤回上市申請', '撤回上市申请', 'Listing application withdrawn'), at: localeNeutralText('Jun 11'), done: true, active: true, danger: true },
    ],
    pools: [
      { name: 'Pool A', desc: STRUCTURED_TEXT.poolA, lots: localizedText('認購不足', '认购不足', 'Undersubscribed'), apps: localizedText('認購不足', '认购不足', 'Undersubscribed') },
      { name: 'Pool B', desc: STRUCTURED_TEXT.poolB, lots: localizedText('認購不足', '认购不足', 'Undersubscribed'), apps: localizedText('認購不足', '认购不足', 'Undersubscribed') },
    ],
    clawback: null,
    applicationTiers: null,
    allotment: null,
    cornerstones: [],
    lockup: [],
    sponsors: [
      { name: 'Guotai Junan 国泰君安', role: STRUCTURED_TEXT.soleSponsor, rating: 2.5 },
    ],
    aiNote: localizedText(
      '行業景氣低迷，公開發售認購不足 1×，發行人在截止後撤回上市。多維研究信號全面偏弱，需求基礎薄弱。',
      '行业景气低迷，公开发售认购不足 1×，发行人在截止后撤回上市。多维研究信号全面偏弱，需求基础薄弱。',
      'Industry conditions are weak and public subscription was below 1×. The issuer withdrew the listing after the offer closed. Research signals are broadly weak and the demand base is limited.',
    ),
    riskSummary: [
      { level: 'high', text: localizedText('公開發售認購不足，上市已撤回。', '公开发售认购不足，上市已撤回。', 'The public offer was undersubscribed and the listing has been withdrawn.') },
      { level: 'high', text: localizedText('行業產能過剩，毛利率持續受壓，公司目前虧損。', '行业产能过剩，毛利率持续承压，公司目前亏损。', 'Industry overcapacity continues to pressure gross margin and the company is loss-making.') },
      { level: 'mid', text: localizedText('沒有基石投資者支持，需求基礎薄弱。', '没有基石投资者支持，需求基础薄弱。', 'There is no cornerstone support and the demand base is weak.') },
    ],
    profile: {
      overview: localizedText(
        '綠野能源是一家光伏組件製造商，受行業產能過剩與價格戰影響，最近財年由盈轉虧。公開發售反應冷淡、認購不足，發行人決定撤回本次上市。',
        '绿野能源是一家光伏组件制造商，受行业产能过剩与价格战影响，最近财年由盈转亏。公开发售反应冷淡、认购不足，发行人决定撤回本次上市。',
        'GreenField Energy manufactures solar modules. Industry overcapacity and price competition pushed it from profit to loss in the latest financial year. Weak, undersubscribed public demand led the issuer to withdraw the listing.',
      ),
      useOfProceeds: [
        { pct: 100, label: localizedText('已撤回，募資計劃終止', '已撤回，募资计划终止', 'Withdrawn; fundraising plan terminated') },
      ],
      risks: [
        localizedText('行業產能嚴重過剩，組件價格持續下跌。', '行业产能严重过剩，组件价格持续下跌。', 'Severe industry overcapacity continues to drive module prices lower.'),
        localizedText('公司由盈轉虧，現金流受壓。', '公司由盈转亏，现金流承压。', 'The company has moved from profit to loss and cash flow is under pressure.'),
        localizedText('上市撤回後，再融資難度上升。', '上市撤回后，再融资难度上升。', 'With the listing withdrawn, refinancing has become more difficult.'),
      ],
      advantages: [
        localizedText('具備一體化產能，成本端有一定彈性。', '具备一体化产能，成本端有一定弹性。', 'Integrated production capacity provides some cost flexibility.'),
        localizedText('若行業完成出清，仍存在週期反轉的潛在價值。', '若行业完成出清，仍存在周期反转的潜在价值。', 'If industry capacity clears, there may be upside from a cyclical recovery.'),
      ],
      company: [
        { k: localizedText('成立年份', '成立年份', 'Founded'), v: localeNeutralText('2016') },
        { k: localizedText('總部', '总部', 'Headquarters'), v: localizedText('合肥', '合肥', 'Hefei') },
        { k: localizedText('主營業務', '主营业务', 'Primary business'), v: localizedText('光伏組件製造', '光伏组件制造', 'Solar-module manufacturing') },
        { k: localizedText('最近財年', '最近财年', 'Latest financial year'), v: localizedText('由盈轉虧', '由盈转亏', 'Swung from profit to loss') },
        { k: localizedText('上市狀態', '上市状态', 'Listing status'), v: localizedText('已撤回', '已撤回', 'Withdrawn') },
      ],
    },
    evidence: { asOf: 'Jun 11, 2026 10:00 HKT', dataVersion: 'v2026.06.11-1', methodology: 'm-ipo-1.4', source: localizedText('HKEX 撤回公告 · 聯交所披露易', 'HKEX 撤回公告 · 联交所披露易', 'HKEX withdrawal announcement · HKEXnews') },
  },

  /* ---- 6. SUBSCRIBING — consumer, moderate demand ---- */
  {
    id: 'apex', name: 'Apex Coffee Roasters', cn: '顶峰咖啡', ticker: '9699.HK',
    exchange: 'HKEX', board: STRUCTURED_TEXT.mainBoard, sector: 'consumer', listingType: 'normal',
    stage: 'subscribing', sentiment: 'neutral', score: 49, confidence: 55, demandSignal: 'neutral',
    tierLabel: localizedText('中盤股', '中盘股', 'Mid-cap'),
    desc: localizedText(
      '精品咖啡連鎖營運商，門店擴張迅速但盈利能力仍薄弱；目前公開發售認購反應平淡。',
      '精品咖啡连锁运营商，门店扩张迅速但盈利能力仍薄弱；目前公开发售认购反应平淡。',
      'A speciality coffee-chain operator expanding stores rapidly but still generating thin profits. Public-offer demand is currently subdued.',
    ),
    terms: {
      priceLow: 12.60, priceHigh: 13.40, finalPrice: null, ccy: 'HKD',
      entryFee: 2707.0, lotSize: 200,
      sharesOffered: localizedText('1.80 億股', '1.80 亿股', '180 million shares'),
      greenshoe: localeNeutralText('15%'), publicPct: 10, intlPct: 90,
      raiseHKD: localeNeutralText('2.4B'), mcapHKD: localeNeutralText('21.0B'),
      nta: localeNeutralText('HK$5.30'), pe: localeNeutralText('41.2×'),
      pb: localeNeutralText('2.5×'),
    },
    subPeriod: { start: localeNeutralText('Jun 19'), end: localeNeutralText('Jun 24 12:00') },
    listingDate: localeNeutralText('Jun 30, 2026'), pricingDate: localeNeutralText('Jun 24, 2026'),
    live: { subPublic: 6.8, subIntl: 1.4, marginDays: localizedText('四日', '四天', 'Four days'), greyChg: null,
      validApps: null, oneLotRate: null, headHammer: null, clawbackApplied: null },
    timetable: [
      { type: 'open', title: STRUCTURED_TEXT.offerOpens, at: localeNeutralText('Jun 19 09:00'), done: true },
      { type: 'close', title: STRUCTURED_TEXT.offerCloses, at: localeNeutralText('Jun 24 12:00'), done: false, active: true },
      { type: 'price', title: STRUCTURED_TEXT.pricingDay, at: localeNeutralText('Jun 24'), done: false },
      { type: 'allot', title: STRUCTURED_TEXT.allotmentPublished, at: localeNeutralText('Jun 29'), done: false },
      { type: 'list', title: STRUCTURED_TEXT.listingDay, at: localeNeutralText('Jun 30 09:30'), done: false },
    ],
    pools: [
      { name: 'Pool A', desc: STRUCTURED_TEXT.poolA, lots: localizedText('4,500 手', '4,500 手', '4,500 lots'), apps: null },
      { name: 'Pool B', desc: STRUCTURED_TEXT.poolB, lots: localizedText('4,500 手', '4,500 手', '4,500 lots'), apps: null },
    ],
    clawback: [
      { trigger: STRUCTURED_TEXT.trigger15To50, publicPct: localeNeutralText('30%') },
      { trigger: STRUCTURED_TEXT.trigger50To100, publicPct: localeNeutralText('40%') },
      { trigger: STRUCTURED_TEXT.trigger100, publicPct: localeNeutralText('50%') },
    ],
    applicationTiers: [
      { lots: 1, shares: 200, amount: 2707, hot: true },
      { lots: 5, shares: 1000, amount: 13535 },
      { lots: 10, shares: 2000, amount: 27070 },
      { lots: 50, shares: 10000, amount: 135350 },
    ],
    allotment: null,
    cornerstones: [
      { name: 'Hony Capital 弘毅', amount: localeNeutralText('HKD 180M'), pct: 7.5, lockup: STRUCTURED_TEXT.sixMonths },
    ],
    lockup: [
      { type: STRUCTURED_TEXT.controllingShareholder, endDate: localeNeutralText('Dec 30, 2026'), pct: localeNeutralText('58.0%'), shares: localizedText('9.1 億股', '9.1 亿股', '910 million shares') },
    ],
    sponsors: [
      { name: 'Citi 花旗', role: STRUCTURED_TEXT.soleSponsor, rating: 4 },
      { name: 'CCB Intl 建银国际', role: STRUCTURED_TEXT.bookrunner, rating: 3.5 },
    ],
    aiNote: localizedText(
      '消費板塊情緒平淡，公開發售認購 6.8×，需求偏冷，而 41× 的市盈率估值偏高。基石支持有限，需求支撐較弱。',
      '消费板块情绪平淡，公开发售认购 6.8×，需求偏冷，而 41× 的市盈率估值偏高。基石支持有限，需求支撑较弱。',
      'Consumer-sector sentiment is subdued. Public subscription of 6.8× is relatively cool while the 41× P/E valuation is elevated. Cornerstone support is limited and demand support is weak.',
    ),
    riskSummary: [
      { level: 'mid', text: localizedText('估值偏高：市盈率 41×，盈利能力仍薄弱。', '估值偏高：市盈率 41×，盈利能力仍薄弱。', 'Valuation is elevated at 41× P/E while profitability remains thin.') },
      { level: 'mid', text: localizedText('門店快速擴張，單店營運模式仍待驗證。', '门店快速扩张，单店运营模式仍待验证。', 'Rapid store expansion leaves the unit economics of individual stores unproven.') },
      { level: 'mid', text: localizedText('認購反應平淡，上市初期的需求支撐有限。', '认购反应平淡，上市初期的需求支撑有限。', 'Subdued subscription indicates limited demand support in early trading.') },
    ],
    profile: {
      overview: localizedText(
        '頂峰咖啡營運超過 1,200 家精品連鎖門店，主打高性價比現磨咖啡。最近財年收入快速增長但淨利率較薄，目前處於規模擴張期。',
        '顶峰咖啡运营超过 1,200 家精品连锁门店，主打高性价比现磨咖啡。最近财年收入快速增长但净利率较薄，目前处于规模扩张期。',
        'Apex Coffee Roasters operates more than 1,200 speciality coffee shops focused on value-for-money freshly brewed coffee. Revenue grew rapidly in the latest financial year, but net margin remains thin as the company scales.',
      ),
      useOfProceeds: [
        { pct: 50, label: localizedText('門店擴張', '门店扩张', 'Store expansion') },
        { pct: 25, label: localizedText('供應鏈與烘焙', '供应链与烘焙', 'Supply chain and roasting') },
        { pct: 15, label: localizedText('品牌與數碼化', '品牌与数字化', 'Brand and digital capabilities') },
        { pct: 10, label: localizedText('營運資金', '营运资金', 'Working capital') },
      ],
      risks: [
        localizedText('門店快速擴張，單店盈利模式仍待驗證。', '门店快速扩张，单店盈利模式仍待验证。', 'Rapid store expansion leaves the profitability of individual stores unproven.'),
        localizedText('咖啡市場競爭激烈，價格戰壓縮利潤。', '咖啡市场竞争激烈，价格战压缩利润。', 'Intense coffee-market competition and price wars compress profit.'),
        localizedText('原材料價格波動影響毛利率。', '原材料价格波动影响毛利率。', 'Raw-material price volatility affects gross margin.'),
      ],
      advantages: [
        localizedText('規模與供應鏈帶來成本優勢。', '规模与供应链带来成本优势。', 'Scale and supply-chain capabilities provide a cost advantage.'),
        localizedText('高性價比定位符合大眾消費需求。', '高性价比定位符合大众消费需求。', 'Its value positioning fits mass-market consumer demand.'),
        localizedText('門店網絡快速擴張，品牌認知度提升。', '门店网络快速扩张，品牌认知度提升。', 'The store network is expanding rapidly and brand awareness is improving.'),
      ],
      company: [
        { k: localizedText('成立年份', '成立年份', 'Founded'), v: localeNeutralText('2017') },
        { k: localizedText('門店數量', '门店数量', 'Stores'), v: localizedText('1,200+ 家', '1,200+ 家', 'More than 1,200') },
        { k: localizedText('總部', '总部', 'Headquarters'), v: localizedText('上海', '上海', 'Shanghai') },
        { k: localizedText('淨利率', '净利率', 'Net margin'), v: localizedText('約 6%', '约 6%', 'Approximately 6%') },
        { k: localizedText('會員數', '会员数', 'Members'), v: localizedText('3,100 萬', '3,100 万', '31 million') },
      ],
    },
    evidence: { asOf: 'Jun 23, 2026 11:40 HKT', dataVersion: 'v2026.06.23-3', methodology: 'm-ipo-1.4', source: STRUCTURED_TEXT.prospectusSource },
  },
];

function isLocalizedText(value: object): value is IpoLocalizedText {
  return "kind" in value && value.kind === "ipo_localized_text";
}

function resolveIpoValue<T>(
  value: T,
  locale: IpoContentLocale,
): ResolvedIpoValue<T> {
  if (Array.isArray(value)) {
    return value.map((item) => resolveIpoValue(item, locale)) as ResolvedIpoValue<T>;
  }
  if (value && typeof value === "object") {
    if (isLocalizedText(value)) {
      return value.values[locale] as ResolvedIpoValue<T>;
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        resolveIpoValue(item, locale),
      ]),
    ) as ResolvedIpoValue<T>;
  }
  return value as ResolvedIpoValue<T>;
}

const IPOS_BY_LOCALE: Readonly<Record<IpoContentLocale, ResolvedIpoRecord[]>> = {
  "zh-Hant": IPO_FIXTURES.map((ipo) => resolveIpoValue(ipo, "zh-Hant")),
  "zh-Hans": IPO_FIXTURES.map((ipo) => resolveIpoValue(ipo, "zh-Hans")),
  en: IPO_FIXTURES.map((ipo) => resolveIpoValue(ipo, "en")),
};

/** Return the authoritative, fully resolved IPO payload for one locale. */
export function getIpos(locale: IpoContentLocale): readonly ResolvedIpoRecord[] {
  return IPOS_BY_LOCALE[locale];
}

/** Lookup one locale-resolved IPO record by id (mock helper). */
export function findIpo(
  id: string,
  locale: IpoContentLocale,
): ResolvedIpoRecord | undefined {
  return IPOS_BY_LOCALE[locale].find((ipo) => ipo.id === id);
}
