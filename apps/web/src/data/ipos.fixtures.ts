/**
 * Rich IPO workbench mock dataset + lookups (FP1), adapted from the design
 * prototype `docs/AiphaBee Design System/apps/ipo-workbench/data.jsx`.
 * Illustrative mock only — the real data arrives from Codex's worker inside the
 * shared `ResponseEnvelope<T>`. Narrative and textual offer fields carry an
 * explicit locale map and are selected before entering that envelope.
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
    exchange: 'HKEX', board: '主板 Main', sector: 'tech', listingType: 'normal',
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
    subPeriod: { start: 'Jun 18', end: 'Jun 23 12:00' }, listingDate: 'Jun 26, 2026',
    pricingDate: 'Jun 23, 2026',
    live: { subPublic: 128.4, subIntl: 6.2, marginDays: '5.5 日', greyChg: null,
      validApps: null, oneLotRate: null, headHammer: null, clawbackApplied: null },
    timetable: [
      { type: 'open', title: '公开发售开始 Offer Opens', at: 'Jun 18 09:00', done: true },
      { type: 'close', title: '公开发售截止 Offer Closes', at: 'Jun 23 12:00', done: false, active: true },
      { type: 'price', title: '定价日 Pricing', at: 'Jun 23', done: false },
      { type: 'allot', title: '公布分配结果 Allotment', at: 'Jun 25', done: false },
      { type: 'grey', title: '暗盘交易 Grey Market', at: 'Jun 25 16:15', done: false },
      { type: 'list', title: '上市日 Listing', at: 'Jun 26 09:30', done: false },
    ],
    pools: [
      { name: 'Pool A', desc: '≤ HK$5M 申请', lots: '7,500 手', apps: null },
      { name: 'Pool B', desc: '> HK$5M 申请', lots: '7,500 手', apps: null },
    ],
    clawback: [
      { trigger: '≥ 15× 且 < 50×', publicPct: '30%' },
      { trigger: '≥ 50× 且 < 100×', publicPct: '40%' },
      { trigger: '≥ 100×', publicPct: '50%', active: true },
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
      { name: 'Hillhouse 高瓴', amount: 'HKD 600M', pct: 14.3, lockup: '6 个月' },
      { name: 'GIC Singapore', amount: 'HKD 420M', pct: 10.0, lockup: '6 个月' },
      { name: 'Tencent 腾讯', amount: 'HKD 380M', pct: 9.0, lockup: '6 个月' },
    ],
    lockup: [
      { type: '控股股东 Controlling', endDate: 'Dec 26, 2026', pct: '52.4%', shares: '8.9 亿股' },
      { type: '基石投资者 Cornerstone', endDate: 'Dec 26, 2026', pct: '33.3%', shares: '0.57 亿股' },
    ],
    sponsors: [
      { name: 'Morgan Stanley', role: '联席保荐人 Sponsor', rating: 5 },
      { name: 'CICC 中金公司', role: '联席保荐人 Sponsor', rating: 4.5 },
      { name: 'Goldman Sachs', role: '账簿管理人 Bookrunner', rating: 4 },
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
        { pct: 45, label: '研发与模型训练 R&D' },
        { pct: 25, label: '海外市场拓展 Expansion' },
        { pct: 20, label: '数据采购与合规 Data & Compliance' },
        { pct: 10, label: '一般营运资金 Working Capital' },
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
        { k: '成立年份', v: '2018' },
        { k: '总部', v: '香港 · 新加坡' },
        { k: '员工人数', v: '约 680 人' },
        { k: '最近财年净收入', v: 'HK$1.92B' },
        { k: '净收入留存率', v: '128%' },
      ],
    },
    evidence: { asOf: 'Jun 23, 2026 11:40 HKT', dataVersion: 'v2026.06.23-3', methodology: 'm-ipo-1.4', source: 'HKEX 招股章程 · 联交所披露易' },
  },

  /* ---- 2. ALLOTTED — win rate + clawback published ---- */
  {
    id: 'lotus', name: 'Lotus Digital Pay', cn: '莲花数科', ticker: '2611.HK',
    exchange: 'HKEX', board: '主板 Main', sector: 'fintech', listingType: 'normal',
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
    subPeriod: { start: 'Jun 12', end: 'Jun 17' }, listingDate: 'Jun 23, 2026',
    pricingDate: 'Jun 17, 2026',
    live: { subPublic: 64.2, subIntl: 4.1, marginDays: null, greyChg: 12.4,
      validApps: '186,420 户', oneLotRate: 32, headHammer: '6,000 手', clawbackApplied: '40%' },
    timetable: [
      { type: 'open', title: '公开发售开始 Offer Opens', at: 'Jun 12 09:00', done: true },
      { type: 'close', title: '公开发售截止 Offer Closes', at: 'Jun 17 12:00', done: true },
      { type: 'price', title: '定价 HK$18.20 上沿定价', at: 'Jun 17', done: true },
      { type: 'allot', title: '公布分配结果 Allotment', at: 'Jun 20', done: true, active: true },
      { type: 'grey', title: '暗盘 +12.4% Grey', at: 'Jun 20 16:15', done: true },
      { type: 'list', title: '上市日 Listing', at: 'Jun 23 09:30', done: false },
    ],
    pools: [
      { name: 'Pool A', desc: '≤ HK$5M 申请', lots: '11,220 手', apps: '171,300 户' },
      { name: 'Pool B', desc: '> HK$5M 申请', lots: '11,220 手', apps: '15,120 户' },
    ],
    clawback: [
      { trigger: '≥ 15× 且 < 50×', publicPct: '30%' },
      { trigger: '≥ 50× 且 < 100×', publicPct: '40%', active: true },
      { trigger: '≥ 100×', publicPct: '50%' },
    ],
    applicationTiers: [
      { lots: 1, shares: 200, amount: 3676, rate: '32%' },
      { lots: 5, shares: 1000, amount: 18380, rate: '58%' },
      { lots: 10, shares: 2000, amount: 36760, rate: '85%' },
      { lots: 20, shares: 4000, amount: 73520, rate: '100%（稳中一手）' },
    ],
    allotment: {
      oneLotRate: 32, validApps: '186,420 户', headHammer: '6,000 手',
      clawbackApplied: '40%', subPublic: 64.2, finalPrice: 18.20,
      result: [
        { lots: 1, applied: '171,300 户', rate: '32%' },
        { lots: 5, applied: '9,640 户', rate: '58%' },
        { lots: 10, applied: '3,210 户', rate: '85%' },
        { lots: 20, applied: '2,270 户', rate: '100%' },
      ],
    },
    cornerstones: [
      { name: 'Temasek 淡马锡', amount: 'HKD 800M', pct: 11.8, lockup: '6 个月' },
      { name: 'BlackRock', amount: 'HKD 500M', pct: 7.4, lockup: '6 个月' },
    ],
    lockup: [
      { type: '控股股东 Controlling', endDate: 'Dec 23, 2026', pct: '61.2%', shares: '22.9 亿股' },
      { type: '基石投资者 Cornerstone', endDate: 'Dec 23, 2026', pct: '19.2%', shares: '0.72 亿股' },
    ],
    sponsors: [
      { name: 'JPMorgan', role: '联席保荐人 Sponsor', rating: 4.5 },
      { name: 'UBS', role: '账簿管理人 Bookrunner', rating: 4 },
      { name: 'Huatai 华泰', role: '账簿管理人 Bookrunner', rating: 3.5 },
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
        { pct: 40, label: '区域扩张与牌照 Licensing' },
        { pct: 30, label: '技术与风控 Tech & Risk' },
        { pct: 20, label: '战略并购 M&A' },
        { pct: 10, label: '营运资金 Working Capital' },
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
        { k: '成立年份', v: '2014' },
        { k: '总部', v: '新加坡' },
        { k: '覆盖市场', v: '东南亚 6 国' },
        { k: '月活用户', v: '4,200 万' },
        { k: '经调整净利润', v: 'HK$2.4B' },
      ],
    },
    evidence: { asOf: 'Jun 20, 2026 18:05 HKT', dataVersion: 'v2026.06.20-1', methodology: 'm-ipo-1.4', source: 'HKEX 分配结果公告 · 联交所披露易' },
  },

  /* ---- 3. PROCESSING — 18A biotech, post-hearing ---- */
  {
    id: 'pearl', name: 'Pearl River Biotech', cn: '珠江生物', ticker: '—',
    exchange: 'HKEX', board: '主板 Main', sector: 'health', listingType: '18a',
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
    subPeriod: { start: '待定', end: '待定' }, listingDate: '待定 TBD',
    pricingDate: '待定',
    live: { subPublic: null, subIntl: null, marginDays: null, greyChg: null,
      validApps: null, oneLotRate: null, headHammer: null, clawbackApplied: null },
    timetable: [
      { type: 'file', title: '递交上市申请 A1 Filing', at: 'Apr 02', done: true },
      { type: 'hearing', title: '通过上市聆讯 Hearing Passed', at: 'Jun 16', done: true, active: true },
      { type: 'roadshow', title: '路演 / 预路演 Roadshow', at: '待定', done: false },
      { type: 'open', title: '启动公开发售 Offer Opens', at: '待定', done: false },
      { type: 'list', title: '预计上市 Listing', at: '待定', done: false },
    ],
    pools: null,
    clawback: [
      { trigger: '≥ 15× 且 < 50×', publicPct: '30%' },
      { trigger: '≥ 50× 且 < 100×', publicPct: '40%' },
      { trigger: '≥ 100×', publicPct: '50%' },
    ],
    applicationTiers: null,
    allotment: null,
    cornerstones: [
      { name: 'Qiming 启明创投', amount: 'HKD 220M（意向）', pct: 20.0, lockup: '6 个月' },
    ],
    lockup: [
      { type: '控股股东 Controlling', endDate: '上市后 6 个月', pct: '— TBD', shares: '— TBD' },
    ],
    sponsors: [
      { name: 'CICC 中金公司', role: '独家保荐人 Sole Sponsor', rating: 4 },
      { name: 'CMB Intl 招银国际', role: '账簿管理人 Bookrunner', rating: 3.5 },
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
        { pct: 55, label: '核心管线临床 Clinical Trials' },
        { pct: 25, label: '产能与 CMC' },
        { pct: 12, label: '管线拓展 Pipeline' },
        { pct: 8, label: '营运资金 Working Capital' },
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
        { k: '成立年份', v: '2019' },
        { k: '总部', v: '广州' },
        { k: '核心管线', v: 'PRB-201（II 期）' },
        { k: '上市规则', v: '主板 18A' },
        { k: '商业化产品', v: '暂无' },
      ],
    },
    evidence: { asOf: 'Jun 17, 2026 09:20 HKT', dataVersion: 'v2026.06.17-2', methodology: 'm-ipo-1.4', source: 'HKEX 聆讯后资料集 PHIP · 联交所披露易' },
  },

  /* ---- 4. BY INTRODUCTION — no pool / no clawback ---- */
  {
    id: 'meridian', name: 'Meridian Trust REIT', cn: '子午线房托', ticker: '0827.HK',
    exchange: 'HKEX', board: '主板 Main', sector: 'property', listingType: 'intro',
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
    subPeriod: { start: '不适用', end: '不适用' }, listingDate: 'Jun 24, 2026',
    pricingDate: 'Jun 23, 2026（参考价）',
    live: { subPublic: null, subIntl: null, marginDays: null, greyChg: null,
      validApps: null, oneLotRate: null, headHammer: null, clawbackApplied: null },
    timetable: [
      { type: 'file', title: '递交介绍上市申请 Filing', at: 'May 05', done: true },
      { type: 'hearing', title: '通过上市聆讯 Hearing', at: 'Jun 10', done: true },
      { type: 'ref', title: '公布参考价 HK$22.00', at: 'Jun 23', done: true, active: true },
      { type: 'list', title: '介绍方式上市 Listing', at: 'Jun 24 09:30', done: false },
    ],
    pools: null,
    clawback: null,
    applicationTiers: null,
    allotment: null,
    cornerstones: [],
    lockup: [
      { type: '原股东 Existing Holders', endDate: '无统一锁定', pct: '—', shares: '—' },
    ],
    sponsors: [
      { name: 'HSBC 汇丰', role: '上市顾问 Listing Agent', rating: 4 },
      { name: 'DBS 星展', role: '财务顾问 Adviser', rating: 3.5 },
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
        { pct: 100, label: '不适用，介绍上市无募资 N/A' },
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
        { k: '成立年份', v: '2011' },
        { k: '物业数量', v: '9 处' },
        { k: '出租率', v: '94%' },
        { k: '分派收益率', v: '约 6.2%' },
        { k: '上市方式', v: '介绍上市 By Introduction' },
      ],
    },
    evidence: { asOf: 'Jun 23, 2026 17:30 HKT', dataVersion: 'v2026.06.23-1', methodology: 'm-ipo-1.4', source: 'HKEX 上市文件 · 联交所披露易' },
  },

  /* ---- 5. WITHDRAWN / FAILED ---- */
  {
    id: 'greenfield', name: 'GreenField Energy', cn: '绿野能源', ticker: '—',
    exchange: 'HKEX', board: '主板 Main', sector: 'energy', listingType: 'normal',
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
    subPeriod: { start: 'Jun 05', end: 'Jun 10（提前截止）' }, listingDate: '已撤回 Withdrawn',
    pricingDate: '未定价 Not Priced',
    live: { subPublic: 0.4, subIntl: 0.3, marginDays: null, greyChg: null,
      validApps: null, oneLotRate: null, headHammer: null, clawbackApplied: null },
    timetable: [
      { type: 'open', title: '公开发售开始 Offer Opens', at: 'Jun 05 09:00', done: true },
      { type: 'close', title: '公开发售截止 Offer Closes', at: 'Jun 10 12:00', done: true },
      { type: 'withdraw', title: '撤回上市申请 Withdrawn', at: 'Jun 11', done: true, active: true, danger: true },
    ],
    pools: [
      { name: 'Pool A', desc: '≤ HK$5M 申请', lots: '认购不足', apps: '认购不足' },
      { name: 'Pool B', desc: '> HK$5M 申请', lots: '认购不足', apps: '认购不足' },
    ],
    clawback: null,
    applicationTiers: null,
    allotment: null,
    cornerstones: [],
    lockup: [],
    sponsors: [
      { name: 'Guotai Junan 国泰君安', role: '独家保荐人 Sole Sponsor', rating: 2.5 },
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
        { pct: 100, label: '已撤回，募资计划终止 N/A' },
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
        { k: '成立年份', v: '2016' },
        { k: '总部', v: '合肥' },
        { k: '主营', v: '光伏组件制造' },
        { k: '最近财年', v: '由盈转亏' },
        { k: '上市状态', v: '已撤回 Withdrawn' },
      ],
    },
    evidence: { asOf: 'Jun 11, 2026 10:00 HKT', dataVersion: 'v2026.06.11-1', methodology: 'm-ipo-1.4', source: 'HKEX 撤回公告 · 联交所披露易' },
  },

  /* ---- 6. SUBSCRIBING — consumer, moderate demand ---- */
  {
    id: 'apex', name: 'Apex Coffee Roasters', cn: '顶峰咖啡', ticker: '9699.HK',
    exchange: 'HKEX', board: '主板 Main', sector: 'consumer', listingType: 'normal',
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
    subPeriod: { start: 'Jun 19', end: 'Jun 24 12:00' }, listingDate: 'Jun 30, 2026',
    pricingDate: 'Jun 24, 2026',
    live: { subPublic: 6.8, subIntl: 1.4, marginDays: '4 日', greyChg: null,
      validApps: null, oneLotRate: null, headHammer: null, clawbackApplied: null },
    timetable: [
      { type: 'open', title: '公开发售开始 Offer Opens', at: 'Jun 19 09:00', done: true },
      { type: 'close', title: '公开发售截止 Offer Closes', at: 'Jun 24 12:00', done: false, active: true },
      { type: 'price', title: '定价日 Pricing', at: 'Jun 24', done: false },
      { type: 'allot', title: '公布分配结果 Allotment', at: 'Jun 29', done: false },
      { type: 'list', title: '上市日 Listing', at: 'Jun 30 09:30', done: false },
    ],
    pools: [
      { name: 'Pool A', desc: '≤ HK$5M 申请', lots: '4,500 手', apps: null },
      { name: 'Pool B', desc: '> HK$5M 申请', lots: '4,500 手', apps: null },
    ],
    clawback: [
      { trigger: '≥ 15× 且 < 50×', publicPct: '30%' },
      { trigger: '≥ 50× 且 < 100×', publicPct: '40%' },
      { trigger: '≥ 100×', publicPct: '50%' },
    ],
    applicationTiers: [
      { lots: 1, shares: 200, amount: 2707, hot: true },
      { lots: 5, shares: 1000, amount: 13535 },
      { lots: 10, shares: 2000, amount: 27070 },
      { lots: 50, shares: 10000, amount: 135350 },
    ],
    allotment: null,
    cornerstones: [
      { name: 'Hony Capital 弘毅', amount: 'HKD 180M', pct: 7.5, lockup: '6 个月' },
    ],
    lockup: [
      { type: '控股股东 Controlling', endDate: 'Dec 30, 2026', pct: '58.0%', shares: '9.1 亿股' },
    ],
    sponsors: [
      { name: 'Citi 花旗', role: '独家保荐人 Sole Sponsor', rating: 4 },
      { name: 'CCB Intl 建银国际', role: '账簿管理人 Bookrunner', rating: 3.5 },
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
        { pct: 50, label: '门店扩张 Store Expansion' },
        { pct: 25, label: '供应链与烘焙 Supply Chain' },
        { pct: 15, label: '品牌与数字化 Brand & Digital' },
        { pct: 10, label: '营运资金 Working Capital' },
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
        { k: '成立年份', v: '2017' },
        { k: '门店数量', v: '1,200+ 家' },
        { k: '总部', v: '上海' },
        { k: '净利率', v: '约 6%' },
        { k: '会员数', v: '3,100 万' },
      ],
    },
    evidence: { asOf: 'Jun 23, 2026 11:40 HKT', dataVersion: 'v2026.06.23-3', methodology: 'm-ipo-1.4', source: 'HKEX 招股章程 · 联交所披露易' },
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
