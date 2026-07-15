/* ============================================================
   Netquity 数据工作台 — 演示数据（非真实数值）+ 权限矩阵
   数据以长和 00001.HK 为样例；所有数值均为设计演示用途。
   ============================================================ */

/* ---------- 权限矩阵：dataset group → 最低授权层级 ---------- */
const NQ_TIER_RANK = { free: 0, premium: 1, enterprise: 2 };

const NQ_GROUPS = {
  sm:         { min: 'free',       label: '证券主数据',   ds: 'security_master' },
  dir_roster: { min: 'free',       label: '董事名录',     ds: 'nq_biography' },
  dir_bio:    { min: 'premium',    label: '董事履历',     ds: 'nq_biography' },
  dir_cross:  { min: 'premium',    label: '交叉任职',     ds: 'nq_biography' },
  dir_comp:   { denied: true,      label: '董事薪酬',     ds: 'nq_biography' },
  sdi_stock:  { min: 'premium',    label: '个股权益披露', ds: 'nq_sdidata' },
  sdi_market: { min: 'enterprise', label: '全市场披露流', ds: 'nq_sdidata' },
  own_summary:{ min: 'premium',    label: '股本与流通',   ds: 'nq_sharecapital' },
  own_graph:  { min: 'enterprise', label: '交叉持股结构', ds: 'nq_listcompheld' },
  events:     { min: 'premium',    label: '公司事件',     ds: 'nq_corpact' },
  fin:        { min: 'premium',    label: '财务报表',     ds: 'nq_finreport' },
  fin_ipo:    { min: 'enterprise', label: '上市前财务',   ds: 'nq_finreportipo' },
  price:      { min: 'premium',    label: '价格与成交',   ds: 'nq_unadjprice2' },
  warrants:   { min: 'premium',    label: '相关轮证',     ds: 'nq_basicdata' },
};

/* gate(groupKey, plan, holdSim) → { state, tier, group }
   state: 'available' | 'locked' | 'denied' */
function nqGate(key, plan) {
  const g = NQ_GROUPS[key];
  if (!g) return { state: 'denied', group: { label: key, ds: key } };
  if (g.denied) return { state: 'denied', group: g };
  if (NQ_TIER_RANK[plan] >= NQ_TIER_RANK[g.min]) return { state: 'available', group: g };
  return { state: 'locked', tier: g.min, group: g };
}

/* ---------- 样例公司 ---------- */
const NQ_STOCK = {
  instrumentId: 'HKEX:00001',
  symbol: '00001.HK',
  nameZh: '长和',
  nameEn: 'CK Hutchison Holdings Ltd.',
  exchange: 'HKEX',
  currency: 'HKD',
  industry: '综合企业 Conglomerates',
  listedAt: '2015-03-18',
  status: 'listed',
};

/* ---------- (a) 证券主数据搜索 ---------- */
const NQ_SEARCH_FIXTURES = {
  '长和': [
    { symbol: '00001.HK', nameZh: '长和', nameEn: 'CK Hutchison Holdings Ltd.', status: 'listed', matched: '中文简称', listedAt: '2015-03-18', industry: '综合企业' },
    { symbol: '01113.HK', nameZh: '长实集团', nameEn: 'CK Asset Holdings Ltd.', status: 'listed', matched: '中文简称（近似）', listedAt: '2015-06-03', industry: '地产' },
    { symbol: '01038.HK', nameZh: '长江基建集团', nameEn: 'CK Infrastructure Holdings Ltd.', status: 'listed', matched: '中文简称（近似）', listedAt: '1996-07-17', industry: '基建' },
  ],
  '和记': [
    { symbol: '00013.HK', nameZh: '和记黄埔', nameEn: 'Hutchison Whampoa Ltd.', status: 'delisted', matched: '中文简称', listedAt: '1978-01-03', delistedAt: '2015-06-03', delistReason: '与长江实业重组合并，股份被吸收注销', industry: '综合企业' },
    { symbol: '00215.HK', nameZh: '和记电讯香港', nameEn: 'Hutchison Telecommunications HK Holdings Ltd.', status: 'listed', matched: '中文简称', listedAt: '2009-05-08', industry: '电讯' },
    { symbol: '00001.HK', nameZh: '长和', nameEn: 'CK Hutchison Holdings Ltd.', status: 'listed', matched: '英文名 Hutchison', listedAt: '2015-03-18', industry: '综合企业' },
  ],
};

/* ---------- (b) 董事与高管 ---------- */
const NQ_DIRECTORS = [
  {
    id: 'd1', nameZh: '李泽钜', nameEn: 'LI Tzar Kuoi, Victor', role: '主席兼集团联席董事总经理', type: 'exec',
    since: '2015-01', age: 61,
    bioShort: '1985 年加入集团，历任副主席、董事总经理；斯坦福大学土木工程学士、结构工程硕士。',
    bioFull: '同时担任集团旗下多家上市公司主席职务，主导集团于欧洲及亚洲之基建、电讯投资组合逾二十年。曾任香港特别行政区行政会议非官守成员。',
    committees: ['提名委员会'],
    cross: [
      { symbol: '01113.HK', name: '长实集团', role: '主席' },
      { symbol: '01038.HK', name: '长江基建集团', role: '主席' },
      { symbol: '00006.HK', name: '电能实业', role: '非执行董事' },
    ],
  },
  {
    id: 'd2', nameZh: '霍建宁', nameEn: 'FOK Kin Ning, Canning', role: '集团联席董事总经理', type: 'exec',
    since: '2015-01', age: 74,
    bioShort: '1979 年加入集团；香港大学文学士，澳洲新英格兰大学财务管理文凭，特许会计师。',
    bioFull: '长期负责集团电讯业务（3 集团）与港口业务之营运管理，为集团任职年资最长的执行董事之一。',
    committees: [],
    cross: [
      { symbol: '01038.HK', name: '长江基建集团', role: '副主席' },
      { symbol: '00006.HK', name: '电能实业', role: '主席' },
      { symbol: '00215.HK', name: '和记电讯香港', role: '主席' },
    ],
  },
  {
    id: 'd3', nameZh: '陆法兰', nameEn: 'SIXT Frank John', role: '集团财务董事兼副董事总经理', type: 'exec',
    since: '2015-01', age: 74,
    bioShort: '1991 年加入集团；加拿大麦吉尔大学文学硕士、民法学士，安大略省执业律师。',
    bioFull: '统筹集团财资、税务与投资者关系职能，主导多宗跨境债券发行与资产处置交易。',
    committees: [],
    cross: [
      { symbol: '01038.HK', name: '长江基建集团', role: '非执行董事' },
      { symbol: '02688.HK', name: 'TOM 集团', role: '非执行主席' },
    ],
  },
  {
    id: 'd4', nameZh: '甘庆林', nameEn: 'KAM Hing Lam', role: '副董事总经理', type: 'exec',
    since: '2015-01', age: 79,
    bioShort: '1993 年加入集团；上海复旦大学理学士，美国芝加哥大学工商管理硕士。',
    bioFull: '兼管集团中国内地基建与生命科技投资组合。',
    committees: [],
    cross: [
      { symbol: '01113.HK', name: '长实集团', role: '副董事总经理' },
      { symbol: '00775.HK', name: '长江生命科技', role: '主席' },
    ],
  },
  {
    id: 'd5', nameZh: '史美伦', nameEn: 'SHIH Mei Lun, Laura', role: '独立非执行董事', type: 'ined',
    since: '2021-05', age: 76,
    bioShort: '前香港交易所主席、中国证监会副主席；资深金融监管专家。',
    bioFull: '现任多家金融机构及公营机构董事；于上市监管、公司治理范畴具广泛经验。',
    committees: ['审核委员会（主席）', '提名委员会'],
    cross: [
      { symbol: '00005.HK', name: '汇丰控股', role: '独立非执行董事' },
    ],
  },
  {
    id: 'd6', nameZh: '黄颂显', nameEn: 'WONG Chung Hin', role: '独立非执行董事', type: 'ined',
    since: '2015-03', age: 71,
    bioShort: '执业律师，前香港律师会理事；公司融资与并购法律顾问逾三十年。',
    bioFull: '曾参与多宗大型上市公司私有化及重组项目之法律工作。',
    committees: ['审核委员会', '薪酬委员会（主席）'],
    cross: [],
  },
];

/* ---------- (c) SDI 权益披露 ---------- */
const NQ_SDI_STOCK = [
  {
    id: 's1', date: '2026-07-06', holderZh: '李泽钜（家族信托受益人）', holderEn: 'LI Tzar Kuoi, Victor',
    kind: 'increase', kindZh: '场内增持', shares: '+500,000', after: 30.17, before: 30.04,
    position: '好仓', form: 'DI-2A', crossing: null,
  },
  {
    id: 's2', date: '2026-06-24', holderZh: 'Li Ka-Shing Unity Trustee Company Ltd.', holderEn: 'LKS Unity Trustee',
    kind: 'passive', kindZh: '被动变动（回购注销）', shares: '±0', after: 30.04, before: 29.98,
    position: '好仓', form: 'DI-2', crossing: '上穿 30% 披露界线',
  },
  {
    id: 's3', date: '2026-06-12', holderZh: '贝莱德 BlackRock, Inc.', holderEn: 'BlackRock, Inc.',
    kind: 'decrease', kindZh: '减持', shares: '−1,530,000', after: 4.98, before: 5.02,
    position: '好仓', form: 'DI-2', crossing: '下穿 5% 披露界线',
  },
  {
    id: 's4', date: '2026-05-30', holderZh: '摩根大通 JPMorgan Chase & Co.', holderEn: 'JPMorgan Chase & Co.',
    kind: 'increase', kindZh: '增持', shares: '+9,190,000', after: 6.11, before: 5.87,
    position: '好仓 6.11% · 淡仓 0.42%', form: 'DI-2', crossing: null,
  },
];

const NQ_SDI_MARKET = [
  { id: 'm1', date: '2026-07-10', symbol: '00700.HK', nameZh: '腾讯控股', holderZh: 'Naspers / Prosus', kindZh: '减持', after: 23.89, before: 24.02, crossing: null, kind: 'decrease' },
  { id: 'm2', date: '2026-07-10', symbol: '00001.HK', nameZh: '长和', holderZh: '李泽钜（家族信托受益人）', kindZh: '场内增持', after: 30.17, before: 30.04, crossing: null, kind: 'increase' },
  { id: 'm3', date: '2026-07-09', symbol: '00005.HK', nameZh: '汇丰控股', holderZh: '平安资产管理', kindZh: '增持', after: 8.31, before: 7.98, crossing: '上穿 8% 披露界线', kind: 'increase' },
  { id: 'm4', date: '2026-07-09', symbol: '01038.HK', nameZh: '长江基建集团', holderZh: '贝莱德 BlackRock, Inc.', kindZh: '被动变动', after: 5.01, before: 4.97, crossing: '上穿 5% 披露界线', kind: 'passive' },
  { id: 'm5', date: '2026-07-08', symbol: '09988.HK', nameZh: '阿里巴巴-W', holderZh: '软银集团 SoftBank Group', kindZh: '减持', after: 12.86, before: 13.11, crossing: null, kind: 'decrease' },
  { id: 'm6', date: '2026-07-08', symbol: '02638.HK', nameZh: '港灯-SS', holderZh: '国家电网海外投资', kindZh: '增持', after: 19.02, before: 18.66, crossing: null, kind: 'increase' },
];

/* ---------- (d) 股权与流通结构 ---------- */
const NQ_OWNERSHIP = {
  issuedShares: '3,828,724,371',
  parValue: '无面值（2014 新公司条例）',
  treasuryShares: '12,500,000',
  freeFloatPct: 64.2,
  holders: [
    { name: '李嘉诚基金会 + 家族信托（合计）', pct: 30.17, kind: 'insider' },
    { name: '摩根大通 JPMorgan', pct: 6.11, kind: 'institution' },
    { name: '贝莱德 BlackRock', pct: 4.98, kind: 'institution' },
    { name: '其他机构（<5% 汇总）', pct: 18.35, kind: 'institution' },
    { name: '公众及零售', pct: 40.39, kind: 'public' },
  ],
  chain: [
    { from: { symbol: '00001.HK', name: '长和' }, to: { symbol: '01038.HK', name: '长江基建' }, pct: 75.67 },
    { from: { symbol: '01038.HK', name: '长江基建' }, to: { symbol: '00006.HK', name: '电能实业' }, pct: 35.96 },
    { from: { symbol: '00006.HK', name: '电能实业' }, to: { symbol: '02638.HK', name: '港灯-SS' }, pct: 33.37 },
  ],
};

/* ---------- (e) 公司事件 ---------- */
const NQ_EVENTS = [
  { id: 'e1', date: '2026-08-14', type: 'dividend', title: '2026 中期股息 · 每股 HKD 0.880', detail: '除净 2026-09-03 · 派付 2026-09-18', status: '已公告', amount: 'HKD 0.880' },
  { id: 'e2', date: '2026-06-20', type: 'buyback', title: '场内回购 1,250,000 股', detail: '均价 HKD 41.35 · 已注销', status: '已确认', amount: 'HKD 51.7mn' },
  { id: 'e3', date: '2026-05-15', type: 'dividend', title: '2025 末期股息 · 每股 HKD 1.775', detail: '除净 2026-05-21 · 已派付 2026-06-05', status: '已确认', amount: 'HKD 1.775' },
  { id: 'e4', date: '2026-03-02', type: 'raise', title: '发行 5 年期美元中期票据', detail: '票面 4.15% · 集资净额约 US$1.0bn', status: '已确认', amount: 'US$1.0bn' },
  { id: 'e5', date: '2025-09-19', type: 'dividend', title: '2025 中期股息 · 每股 HKD 0.860', detail: '已派付 2025-09-19', status: '已确认', amount: 'HKD 0.860' },
  { id: 'e6', date: '2025-06-27', type: 'buyback', title: '场内回购 3,400,000 股', detail: '均价 HKD 38.02 · 已注销', status: '已确认', amount: 'HKD 129.3mn' },
  { id: 'e7', date: '2015-03-18', type: 'listing', title: '以介绍形式上市（集团重组）', detail: '长江实业 + 和记黄埔重组为长和系', status: '历史', amount: null },
];

/* ---------- (f) 财务报表（HKD mn，演示数值） ---------- */
const NQ_FIN = {
  currency: 'HKD mn',
  standard: 'HKFRS',
  periods: ['FY2022', 'FY2023', 'FY2024', 'FY2025', '1H2026'],
  interimIdx: 4,
  rows: [
    { label: '营业额 Revenue', values: [271502, 275578, 283646, 289110, 142335] },
    { label: 'EBITDA', values: [55380, 57119, 60024, 61873, 29882] },
    { label: '股东应占溢利 Net Profit', values: [36680, 23500, 25216, 26894, 12105], holdTarget: false },
    { label: '每股盈利 EPS (HKD)', values: [9.58, 6.14, 6.59, 7.03, 3.16], decimals: 2, holdTarget: true, holdReason: '中期数与已披露回购注销后股数不一致，供应商复核中' },
    { label: '每股股息 DPS (HKD)', values: [2.926, 2.376, 2.550, 2.655, 0.880], decimals: 3 },
    { label: '总资产 Total Assets', values: [1082044, 1050340, 1061218, 1074502, 1079880] },
    { label: '股东权益 Equity', values: [500514, 495281, 503112, 511948, 516230] },
    { label: '净负债比率 Net Debt %', values: [17.3, 16.8, 15.9, 15.2, 15.5], decimals: 1, pct: true },
  ],
  ipoEra: { label: '上市前財務（1H2014–FY2014 重组备考）', note: '介绍上市前之备考合并报表，含和记黄埔口径' },
};

Object.assign(window, {
  NQ_TIER_RANK, NQ_GROUPS, nqGate,
  NQ_STOCK, NQ_SEARCH_FIXTURES,
  NQ_DIRECTORS,
  NQ_SDI_STOCK, NQ_SDI_MARKET,
  NQ_OWNERSHIP,
  NQ_EVENTS,
  NQ_FIN,
});
