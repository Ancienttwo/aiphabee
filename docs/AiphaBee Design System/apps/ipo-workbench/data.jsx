/* ============================================================
   AiphaBee IPO 研究工作台 — mock dataset
   Canonical IPO schema per PRD: event · terms · timetable ·
   pools · clawback · allotment · cornerstones · lockup ·
   profile · evidence(data version). Illustrative mock only.
   ============================================================ */

const ASSETS = '../../assets';
const MASCOT_BP = ASSETS + '/mascot';
const LOGO = ASSETS + '/aiphabee-mascot.png';

/* ---------- label maps ---------- */
const SECTOR_LABEL = {
  tech: '科技 Technology', health: '生物医药 Healthcare',
  fintech: '金融科技 Fintech', industrial: '工业 Industrials',
  energy: '能源 Energy', consumer: '消费 Consumer', property: '房地产 Property',
};

/* IPO lifecycle stages (the pipeline lanes) */
const STAGES = [
  { key: 'processing',  label: '处理中',     en: 'In Processing', tone: 'neutral', icon: 'file-clock' },
  { key: 'subscribing', label: '招股中',     en: 'Subscribing',   tone: 'honey',   icon: 'flame' },
  { key: 'grey',        label: '暗盘 / 上市', en: 'Grey · Listed', tone: 'info',    icon: 'activity' },
  { key: 'allotted',    label: '已公布分配',  en: 'Allotted',      tone: 'bullish', icon: 'check-check' },
  { key: 'withdrawn',   label: '撤回 / 失效', en: 'Withdrawn',     tone: 'bearish', icon: 'x-circle' },
];
const STAGE_BY = Object.fromEntries(STAGES.map(s => [s.key, s]));

const LISTING_TYPE = {
  normal: 'Normal 普通',
  '18a': '18A 未盈利生物科技',
  '18c': '18C 特专科技',
  intro: 'By Introduction 介绍上市',
};

const SENTIMENT_TONE = { bullish: 'bullish', cautious: 'warning', neutral: 'neutral', bearish: 'bearish' };
const SENTIMENT_LABEL = { bullish: '牛市 Bullish', cautious: '谨慎乐观 Cautious', neutral: '中性 Neutral', bearish: '熊市 Bearish' };
/* AiphaBee 研究信号（描述性，非投资建议 / Gate-0 research signal, not advice） */
const REC_CFG = {
  strong_buy: { tone: 'bullish', label: '需求强劲 Strong Demand' },
  buy:        { tone: 'bullish', label: '需求稳健 Solid Demand' },
  hold:       { tone: 'neutral', label: '需求中性 Neutral' },
  avoid:      { tone: 'bearish', label: '需求疲弱 Weak Demand' },
  na:         { tone: 'neutral', label: '数据不足 Insufficient' },
};

/* demand-level color from oversubscription multiple */
function demandTone(x) {
  if (x == null) return 'var(--neutral-400)';
  if (x >= 100) return 'var(--demand-extreme)';
  if (x >= 50)  return 'var(--demand-very-hot)';
  if (x >= 10)  return 'var(--green-600)';
  if (x >= 5)   return 'var(--blue-500)';
  return 'var(--neutral-500)';
}

/* ============================================================
   IPO records
   ============================================================ */
const IPOS = [
  /* ---- 1. SUBSCRIBING — hot tech, live sub multiple ---- */
  {
    id: 'honeycomb', name: 'Honeycomb Intelligence', cn: '蜂巢智能', ticker: '2769.HK',
    exchange: 'HKEX', board: '主板 Main', sector: 'tech', listingType: 'normal',
    stage: 'subscribing', sentiment: 'bullish', score: 78, confidence: 86, recommendation: 'buy',
    tierLabel: '中盘股 Mid-cap',
    desc: 'AI 投研基础设施服务商，为机构提供多模型估值与尽调自动化。基石阵容强劲，公开发售火爆超额认购。',
    terms: {
      priceLow: 22.40, priceHigh: 24.80, finalPrice: null, ccy: 'HKD',
      entryFee: 5009.0, lotSize: 200, sharesOffered: '1.70 亿股', greenshoe: '15%',
      publicPct: 10, intlPct: 90, raiseHKD: '4.2B', mcapHKD: '38.6B',
      nta: 'HK$6.85', pe: '32.4×', pb: '5.1×',
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
    aiNote: '科技板块情绪向好叠加优质基石阵容，公开发售 128× 超额认购触发 50% 回拨上限。定价或落于区间上沿；以历史样本看，此类高倍超购标的的一手中签率通常偏低。',
    riskSummary: [
      { level: 'mid', text: '估值偏高：PE 32×，高于同业中位 24×。' },
      { level: 'low', text: '基石锁定 6 个月，上市初期抛压可控。' },
      { level: 'mid', text: '业务高度依赖头部机构客户，集中度风险。' },
    ],
    profile: {
      overview: '蜂巢智能是面向资产管理机构的 AI 投研基础设施服务商，提供多模型估值引擎、尽职调查自动化与组合风险监控。截至最近财年，付费机构客户 240 家，净收入留存率 128%。',
      useOfProceeds: [
        { pct: 45, label: '研发与模型训练 R&D' },
        { pct: 25, label: '海外市场拓展 Expansion' },
        { pct: 20, label: '数据采购与合规 Data & Compliance' },
        { pct: 10, label: '一般营运资金 Working Capital' },
      ],
      risks: [
        '核心客户集中度较高，前五大客户贡献约 41% 收入。',
        'AI 监管政策与数据合规要求趋严，或增加运营成本。',
        '估值对增长预期敏感，不达预期可能引发回调。',
      ],
      advantages: [
        '多模型估值引擎具备技术壁垒，迁移成本高。',
        '净收入留存率 128%，客户黏性与扩张能力强。',
        '基石阵容覆盖一线机构，背书效应显著。',
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
    stage: 'allotted', sentiment: 'bullish', score: 71, confidence: 79, recommendation: 'buy',
    tierLabel: '大盘股 Large-cap',
    desc: '东南亚跨境支付与数字钱包龙头，盈利稳健，监管护城河深厚。分配结果已公布，一手中签率中等。',
    terms: {
      priceLow: 16.80, priceHigh: 18.20, finalPrice: 18.20, ccy: 'HKD',
      entryFee: 3676.0, lotSize: 200, sharesOffered: '3.74 亿股', greenshoe: '15%',
      publicPct: 12, intlPct: 88, raiseHKD: '6.8B', mcapHKD: '92.1B',
      nta: 'HK$9.20', pe: '27.6×', pb: '3.4×',
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
    aiNote: '上沿 HK$18.20 定价、暗盘 +12.4% 共同反映需求扎实。公开发售 64× 触发 40% 回拨，一手中签率 32% 处于中等区间。盈利稳健、自由现金流为正。',
    riskSummary: [
      { level: 'low', text: '盈利稳健，现金流为正。' },
      { level: 'mid', text: '跨境支付监管多变，牌照风险需关注。' },
      { level: 'low', text: '暗盘已正溢价，破发概率较低。' },
    ],
    profile: {
      overview: '莲花数科运营东南亚领先的跨境支付与数字钱包网络，覆盖 6 国、月活用户 4,200 万。最近财年经调整净利润 HK$2.4B，同比增长 34%。',
      useOfProceeds: [
        { pct: 40, label: '区域扩张与牌照 Licensing' },
        { pct: 30, label: '技术与风控 Tech & Risk' },
        { pct: 20, label: '战略并购 M&A' },
        { pct: 10, label: '营运资金 Working Capital' },
      ],
      risks: [
        '多国支付牌照与外汇监管存在政策不确定性。',
        '行业竞争激烈，费率持续承压。',
        '汇率波动影响跨境结算收入。',
      ],
      advantages: [
        '区域网络效应与牌照壁垒构筑护城河。',
        '盈利能力领先同业，自由现金流为正。',
        '淡马锡、贝莱德背书强化机构信心。',
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
    stage: 'processing', sentiment: 'cautious', score: 54, confidence: 61, recommendation: 'hold',
    tierLabel: '小盘股 Small-cap',
    desc: '创新药企，核心管线处于 II 期临床。已通过聆讯，尚未启动招股；未盈利，估值依赖里程碑预期。',
    terms: {
      priceLow: null, priceHigh: null, finalPrice: null, ccy: 'HKD',
      entryFee: null, lotSize: 500, sharesOffered: '约 1.2 亿股（指示）', greenshoe: '15%',
      publicPct: 10, intlPct: 90, raiseHKD: '~1.1B（指示）', mcapHKD: '~8.4B（指示）',
      nta: '待定 TBD', pe: 'N/A（未盈利）', pb: '待定 TBD',
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
    aiNote: '18A 未盈利生物科技，已通过聆讯但招股细节未定。核心管线 II 期数据为关键催化；招股条款、定价区间与基石阵容尚未公布，需求强度暂无法测算。',
    riskSummary: [
      { level: 'high', text: '核心管线处 II 期，临床失败风险显著。' },
      { level: 'high', text: '未盈利，估值高度依赖里程碑预期。' },
      { level: 'mid', text: '招股条款未定，定价区间存在不确定性。' },
    ],
    profile: {
      overview: '珠江生物专注肿瘤免疫创新药研发，核心管线 PRB-201（PD-L1/VEGF 双抗）处于 II 期临床。公司尚无商业化产品，依据 18A 规则申请上市。',
      useOfProceeds: [
        { pct: 55, label: '核心管线临床 Clinical Trials' },
        { pct: 25, label: '产能与 CMC' },
        { pct: 12, label: '管线拓展 Pipeline' },
        { pct: 8, label: '营运资金 Working Capital' },
      ],
      risks: [
        '核心管线尚处 II 期，存在临床失败与延期风险。',
        '无收入与利润，持续依赖融资，存在摊薄风险。',
        '创新药竞争激烈，商业化前景不确定。',
      ],
      advantages: [
        '双抗平台具差异化机制，潜在 first-in-class。',
        '核心团队具备跨国药企研发背景。',
        '已获启明创投意向基石支持。',
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
    stage: 'grey', sentiment: 'neutral', score: 58, confidence: 68, recommendation: 'hold',
    tierLabel: '中盘股 Mid-cap',
    desc: '以介绍方式上市的区域商业地产信托，无公开发售、无回拨机制；上市初期流动性偏低。',
    terms: {
      priceLow: null, priceHigh: null, finalPrice: 22.00, ccy: 'HKD',
      entryFee: null, lotSize: 1000, sharesOffered: '不适用（介绍上市）', greenshoe: '—',
      publicPct: 0, intlPct: 0, raiseHKD: '不适用（无新股发行）', mcapHKD: '24.0B',
      nta: 'HK$25.60', pe: '—', pb: '0.86×',
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
    aiNote: '介绍方式上市不涉及新股发行与公开认购，无一手中签率概念。开盘价由市场撮合决定，初期流动性偏低、价格波动可能较大。当前交易于资产净值折让（P/NAV 0.86×）。',
    riskSummary: [
      { level: 'mid', text: '介绍上市无募资，初期流动性偏低。' },
      { level: 'mid', text: '开盘价缺乏发售价锚定，波动可能较大。' },
      { level: 'low', text: '交易于资产净值折让，估值具安全边际。' },
    ],
    profile: {
      overview: '子午线房托持有粤港澳大湾区 9 处优质商业物业，出租率 94%，分派收益率约 6.2%。本次以介绍方式上市，不发行新单位、不募集资金。',
      useOfProceeds: [
        { pct: 100, label: '不适用 — 介绍上市无募资 N/A' },
      ],
      risks: [
        '介绍上市无承销支持，初期成交清淡。',
        '商业地产受宏观与利率周期影响。',
        '物业估值下行将拖累 NAV 与分派。',
      ],
      advantages: [
        '组合出租率高、现金流稳定。',
        '交易价低于资产净值，存在折让修复空间。',
        '分派收益率具吸引力。',
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
    stage: 'withdrawn', sentiment: 'bearish', score: 31, confidence: 64, recommendation: 'avoid',
    tierLabel: '小盘股 Small-cap',
    desc: '光伏组件制造商，因行业产能过剩、需求冷淡，公开发售认购不足，发行人决定撤回上市申请。',
    terms: {
      priceLow: 5.80, priceHigh: 6.20, finalPrice: null, ccy: 'HKD',
      entryFee: 3131.0, lotSize: 500, sharesOffered: '1.45 亿股（已撤回）', greenshoe: '—',
      publicPct: 10, intlPct: 90, raiseHKD: '~0.9B（已撤回）', mcapHKD: '~5.6B',
      nta: 'HK$4.10', pe: '亏损 Loss', pb: '1.5×',
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
    aiNote: '行业景气低迷、公开发售认购不足 1×，发行人于截止后撤回上市。多维研究信号全面偏弱，需求基础薄弱。',
    riskSummary: [
      { level: 'high', text: '公开发售认购不足，已撤回上市。' },
      { level: 'high', text: '行业产能过剩、毛利持续承压、当前亏损。' },
      { level: 'mid', text: '无基石支持，需求基础薄弱。' },
    ],
    profile: {
      overview: '绿野能源为光伏组件制造商，受行业产能过剩与价格战影响，最近财年由盈转亏。公开发售反应冷淡，认购不足，发行人决定撤回本次上市。',
      useOfProceeds: [
        { pct: 100, label: '已撤回 — 募资计划终止 N/A' },
      ],
      risks: [
        '行业产能严重过剩，组件价格持续下行。',
        '公司由盈转亏，现金流承压。',
        '上市撤回后再融资难度上升。',
      ],
      advantages: [
        '具备一体化产能，成本端有一定弹性。',
        '若行业出清，存在周期反转期权价值。',
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
    stage: 'subscribing', sentiment: 'neutral', score: 49, confidence: 55, recommendation: 'hold',
    tierLabel: '中盘股 Mid-cap',
    desc: '连锁精品咖啡运营商，门店扩张快但盈利尚浅；当前公开发售认购平淡。',
    terms: {
      priceLow: 12.60, priceHigh: 13.40, finalPrice: null, ccy: 'HKD',
      entryFee: 2707.0, lotSize: 200, sharesOffered: '1.80 亿股', greenshoe: '15%',
      publicPct: 10, intlPct: 90, raiseHKD: '2.4B', mcapHKD: '21.0B',
      nta: 'HK$5.30', pe: '41.2×', pb: '2.5×',
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
    aiNote: '消费板块情绪平淡，公开发售 6.8× 认购偏冷且估值 PE 41× 偏高。基石支持有限，需求支撑较弱。',
    riskSummary: [
      { level: 'mid', text: '估值偏高：PE 41×，盈利尚浅。' },
      { level: 'mid', text: '门店快速扩张，单店模型尚待验证。' },
      { level: 'mid', text: '认购平淡，上市初期支撑有限。' },
    ],
    profile: {
      overview: '顶峰咖啡运营 1,200 余家精品连锁门店，主打高性价比现磨咖啡。最近财年收入快速增长但净利率较薄，处于规模扩张期。',
      useOfProceeds: [
        { pct: 50, label: '门店扩张 Store Expansion' },
        { pct: 25, label: '供应链与烘焙 Supply Chain' },
        { pct: 15, label: '品牌与数字化 Brand & Digital' },
        { pct: 10, label: '营运资金 Working Capital' },
      ],
      risks: [
        '门店快速扩张，单店盈利模型尚待验证。',
        '咖啡赛道竞争激烈，价格战压制利润。',
        '原材料价格波动影响毛利。',
      ],
      advantages: [
        '规模与供应链具备成本优势。',
        '高性价比定位契合大众消费。',
        '门店网络扩张迅速，品牌认知提升。',
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

const IPO_BY = Object.fromEntries(IPOS.map(i => [i.id, i]));

Object.assign(window, {
  ASSETS, MASCOT_BP, LOGO,
  SECTOR_LABEL, STAGES, STAGE_BY, LISTING_TYPE,
  SENTIMENT_TONE, SENTIMENT_LABEL, REC_CFG, demandTone,
  IPOS, IPO_BY,
});
