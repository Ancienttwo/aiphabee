/* ============================================================
   AiphaBee IPO Agent — UI kit shell
   App router state, nav bar, Lucide icon helper, and mock HK IPO
   data. Views live in home.jsx and research.jsx.
   ============================================================ */

const DS = window.AiphaBeeDesignSystem_599c13;
const { Button, Badge } = DS;

/* ---------- Lucide icon helper ---------- */
function Icon({ name, size = 18, color, style = {} }) {
  return (
    <span className="luc" style={{ display: 'inline-flex', lineHeight: 0, color, '--ic-size': size + 'px', ...style }}>
      <i data-lucide={name}></i>
    </span>
  );
}
function useLucide(dep) {
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
}

const LOGO = '../../assets/aiphabee-mascot.png';
const MASCOT_BP = '../../assets/mascot';

/* ---------- Mock HK IPO data ---------- */
const SECTOR_LABEL = { tech: '科技 Technology', health: '生物医药 Healthcare', fintech: '金融科技 Fintech', industrial: '工业 Industrials', energy: '能源 Energy' };

const IPOS = [
  {
    id: 'honeycomb', name: 'Honeycomb Intelligence', cn: '蜂巢智能', ticker: '2769.HK', exchange: 'HKEX',
    sector: 'tech', status: 'pending', sentiment: 'bullish', score: 78, tier: 'medium', tierLabel: '中盘股',
    offer: 24.80, raiseHKD: '4.2B', mcapHKD: '38.6B', listing: 'Jun 24, 2026', sub: 128.4,
    rating: 4.5, ratingCount: 21, recommendation: 'strong_buy', confidence: 86,
    desc: 'AI 投研基础设施服务商，为机构提供多模型估值与尽调自动化。Cornerstone 阵容强劲，超额认购火爆。',
    dims: [
      { k: 'Chip', label: '筹码分布', score: 82 },
      { k: 'Sponsor', label: '保荐质量', score: 88 },
      { k: 'Underwriter', label: '承销实力', score: 74 },
      { k: 'Sector', label: '板块动能', score: 90 },
      { k: 'Fundamentals', label: '基本面', score: 68 },
      { k: 'Cornerstone', label: '基石质量', score: 84 },
    ],
    institutions: [
      { name: 'Morgan Stanley', role: '联席保荐人', rating: 5 },
      { name: 'CICC 中金公司', role: '联席保荐人', rating: 4.5 },
      { name: 'Goldman Sachs', role: '账簿管理人', rating: 4 },
    ],
    cornerstones: [
      { name: 'Hillhouse 高瓴', amount: 'HKD 600M', pct: 14.3 },
      { name: 'GIC Singapore', amount: 'HKD 420M', pct: 10.0 },
      { name: 'Tencent 腾讯', amount: 'HKD 380M', pct: 9.0 },
    ],
    aiNote: '科技板块情绪向好叠加优质基石阵容，128× 超额认购显示散户与机构需求旺盛。建议关注首日开盘价，回调至招股价上沿可逢低布局。',
  },
  {
    id: 'lotus', name: 'Lotus Digital Pay', cn: '莲花数科', ticker: '2611.HK', exchange: 'HKEX',
    sector: 'fintech', status: 'pending', sentiment: 'bullish', score: 71, tier: 'large', tierLabel: '大盘股',
    offer: 18.20, raiseHKD: '6.8B', mcapHKD: '92.1B', listing: 'Jun 27, 2026', sub: 64.2,
    rating: 4, ratingCount: 18, recommendation: 'buy', confidence: 74,
    desc: '东南亚跨境支付与数字钱包龙头，盈利稳健，监管护城河深厚。',
    dims: [
      { k: 'Chip', label: '筹码分布', score: 70 }, { k: 'Sponsor', label: '保荐质量', score: 80 },
      { k: 'Underwriter', label: '承销实力', score: 78 }, { k: 'Sector', label: '板块动能', score: 66 },
      { k: 'Fundamentals', label: '基本面', score: 82 }, { k: 'Cornerstone', label: '基石质量', score: 72 },
    ],
    institutions: [ { name: 'JPMorgan', role: '联席保荐人', rating: 4.5 }, { name: 'UBS', role: '账簿管理人', rating: 4 }, { name: 'Huatai 华泰', role: '账簿管理人', rating: 3.5 } ],
    cornerstones: [ { name: 'Temasek 淡马锡', amount: 'HKD 800M', pct: 11.8 }, { name: 'BlackRock', amount: 'HKD 500M', pct: 7.4 } ],
    aiNote: '基本面扎实但板块动能一般，64× 认购属健康区间。适合稳健型投资者中长期持有。',
  },
  {
    id: 'pearl', name: 'Pearl River Biotech', cn: '珠江生物', ticker: '2197.HK', exchange: 'HKEX',
    sector: 'health', status: 'priced', sentiment: 'cautious', score: 54, tier: 'small', tierLabel: '小盘股',
    offer: 9.60, raiseHKD: '1.1B', mcapHKD: '8.4B', listing: 'Jun 20, 2026', sub: 12.6,
    rating: 3.5, ratingCount: 11, recommendation: 'hold', confidence: 61,
    desc: '创新药企，核心管线处于 II 期临床。未盈利，估值依赖里程碑预期。',
    dims: [
      { k: 'Chip', label: '筹码分布', score: 58 }, { k: 'Sponsor', label: '保荐质量', score: 62 },
      { k: 'Underwriter', label: '承销实力', score: 55 }, { k: 'Sector', label: '板块动能', score: 48 },
      { k: 'Fundamentals', label: '基本面', score: 40 }, { k: 'Cornerstone', label: '基石质量', score: 60 },
    ],
    institutions: [ { name: 'CICC 中金公司', role: '独家保荐人', rating: 4 }, { name: 'CMB Intl 招银国际', role: '账簿管理人', rating: 3.5 } ],
    cornerstones: [ { name: 'Qiming 启明创投', amount: 'HKD 220M', pct: 20.0 } ],
    aiNote: '18A 未盈利生物科技，波动较大。基本面评分偏低，建议小仓位参与并严设止损。',
  },
  {
    id: 'apex', name: 'Apex Logistics', cn: '顶峰物流', ticker: '9699.HK', exchange: 'HKEX',
    sector: 'industrial', status: 'pending', sentiment: 'neutral', score: 49, tier: 'medium', tierLabel: '中盘股',
    offer: 13.40, raiseHKD: '2.4B', mcapHKD: '21.0B', listing: 'Jun 30, 2026', sub: 6.8,
    rating: 3, ratingCount: 9, recommendation: 'hold', confidence: 55,
    desc: '区域智能仓储与冷链物流运营商，现金流稳定，成长性中性。',
    dims: [
      { k: 'Chip', label: '筹码分布', score: 50 }, { k: 'Sponsor', label: '保荐质量', score: 58 },
      { k: 'Underwriter', label: '承销实力', score: 52 }, { k: 'Sector', label: '板块动能', score: 44 },
      { k: 'Fundamentals', label: '基本面', score: 60 }, { k: 'Cornerstone', label: '基石质量', score: 38 },
    ],
    institutions: [ { name: 'Haitong 海通国际', role: '联席保荐人', rating: 3.5 }, { name: 'BOCI 中银国际', role: '账簿管理人', rating: 3 } ],
    cornerstones: [],
    aiNote: '需求平淡，6.8× 认购偏冷，缺乏基石支撑。建议观望，待二级市场企稳后再评估。',
  },
  {
    id: 'greenfield', name: 'GreenField Energy', cn: '绿野能源', ticker: '0586.HK', exchange: 'HKEX',
    sector: 'energy', status: 'listed', sentiment: 'bearish', score: 31, tier: 'small', tierLabel: '小盘股',
    offer: 6.20, raiseHKD: '0.9B', mcapHKD: '5.6B', listing: 'Jun 12, 2026', sub: 2.1,
    rating: 2.5, ratingCount: 7, recommendation: 'sell', confidence: 64,
    desc: '光伏组件制造商，行业产能过剩、毛利承压。上市首日破发。',
    dims: [
      { k: 'Chip', label: '筹码分布', score: 28 }, { k: 'Sponsor', label: '保荐质量', score: 40 },
      { k: 'Underwriter', label: '承销实力', score: 35 }, { k: 'Sector', label: '板块动能', score: 22 },
      { k: 'Fundamentals', label: '基本面', score: 30 }, { k: 'Cornerstone', label: '基石质量', score: 18 },
    ],
    institutions: [ { name: 'Guotai Junan 国泰君安', role: '独家保荐人', rating: 2.5 } ],
    cornerstones: [],
    aiNote: '行业景气度低、认购冷淡且已破发，多维评分全面偏弱。建议规避，等待行业出清信号。',
  },
];

const SENTIMENT_TONE = { bullish: 'bullish', cautious: 'warning', neutral: 'neutral', bearish: 'bearish' };
const SENTIMENT_LABEL = { bullish: '牛市 Bullish', cautious: '谨慎乐观', neutral: '中性 Neutral', bearish: '熊市 Bearish' };
const STATUS = { pending: { tone: 'honey', label: 'Upcoming 招股中' }, priced: { tone: 'info', label: 'Priced 已定价' }, listed: { tone: 'bullish', label: 'Listed 已上市' }, withdrawn: { tone: 'neutral', label: 'Withdrawn' } };
const RATING_CFG = { strong_buy: { tone: 'bullish', label: '强力买入 Strong Buy' }, buy: { tone: 'warning', label: '买入 Buy' }, hold: { tone: 'neutral', label: '持有 Hold' }, sell: { tone: 'bearish', label: '卖出 Sell' } };

/* ---------- Top navigation ---------- */
function NavBar({ view, go }) {
  const link = (v, label) => (
    <button onClick={() => go(v)} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
      color: view === v ? 'var(--ink-800)' : 'var(--text-muted)',
      borderBottom: view === v ? '2px solid var(--honey-500)' : '2px solid transparent',
      padding: '4px 2px',
    }}>{label}</button>
  );
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 'var(--z-sticky)',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(10px)',
    }}>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 24px', height: 'var(--nav-height)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => go('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
          <img src={LOGO} alt="AiphaBee" style={{ height: 38, width: 'auto' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--ink-800)', letterSpacing: 'var(--tracking-tight)' }}>IPO&nbsp;Agent</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          {link('dashboard', 'Dashboard')}
          {link('listings', 'Browse IPOs')}
          <Button size="sm" onClick={() => go('dashboard')}>Get Started</Button>
        </div>
      </div>
    </nav>
  );
}

/* ---------- Root app ---------- */
function App() {
  const [view, setView] = React.useState('home');
  const [selected, setSelected] = React.useState(IPOS[0]);
  useLucide(view);

  const go = (v) => { setView(v); window.scrollTo(0, 0); };
  const openIpo = (ipo) => { setSelected(ipo); go('detail'); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)', fontFamily: 'var(--font-sans)' }}>
      <NavBar view={view} go={go} />
      {view === 'home' && <HomeView go={go} openIpo={openIpo} />}
      {view === 'dashboard' && <DashboardView go={go} openIpo={openIpo} />}
      {view === 'listings' && <ListingsView openIpo={openIpo} />}
      {view === 'detail' && <DetailView ipo={selected} go={go} />}
    </div>
  );
}

Object.assign(window, {
  Icon, useLucide, App, NavBar,
  IPOS, SECTOR_LABEL, SENTIMENT_TONE, SENTIMENT_LABEL, STATUS, RATING_CFG, LOGO, MASCOT_BP,
});
