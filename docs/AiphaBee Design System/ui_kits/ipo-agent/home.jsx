/* ============================================================
   AiphaBee IPO Agent — Home & Dashboard views
   ============================================================ */
const _DS = window.AiphaBeeDesignSystem_599c13;
const { Button: HBtn, Badge: HBadge, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, StatCard, ScoreMeter, RatingStars, BeeNote, Hexvatar, ForageLoader } = _DS;

const SHELL = { maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 24px' };

/* ---------- Market sentiment panel (recreates MarketSentimentCard) ---------- */
function MarketSentimentPanel() {
  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <CardTitle>市场情绪指标 · HKEX</CardTitle>
            <CardDescription>最后更新 5 分钟前 · 30 日窗口</CardDescription>
          </div>
          <HBadge tone="bullish" dot>谨慎乐观 → 牛市</HBadge>
        </div>
      </CardHeader>
      <CardContent>
        <ScoreMeter label="情绪指数 Sentiment Index" value={72} tone="bullish" labels={['极度悲观', '中性', '极度乐观']} />
        <div style={{ marginTop: 20 }}>
          <BeeNote basePath={MASCOT_BP} pose="insight" title="工蜂洞察 · 已为您勤劳搜罗">
            港美股 IPO 市场情绪回暖，科技与金融科技板块认购火爆。建议优先关注基石阵容强劲、超额认购 50× 以上的标的。
          </BeeNote>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ icon, tone, title, body }) {
  return (
    <Card padded>
      <Hexvatar icon={<Icon name={icon} size={22} />} tone={tone} variant="soft" size={52} />
      <h3 style={{ margin: '16px 0 6px', fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.65, color: 'var(--text-body)' }}>{body}</p>
    </Card>
  );
}

function HomeView({ go, openIpo }) {
  useLucide();
  return (
    <main>
      {/* Hero */}
      <section style={{ ...SHELL, paddingTop: 64, paddingBottom: 56, textAlign: 'center' }}>
        <img src={MASCOT_BP + '/greeting.png'} alt="AiphaBee" style={{ width: 132, height: 132, objectFit: 'contain', marginBottom: 8 }} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 'var(--radius-pill)', background: 'var(--honey-50)', border: '1px solid var(--honey-200)', marginBottom: 24 }}>
          <Icon name="sparkles" size={15} color="var(--honey-700)" />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--honey-800)' }}>港股 IPO 投研 Agent · Powered by Claude</span>
        </div>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-6xl)', fontWeight: 800, lineHeight: 1.05, letterSpacing: 'var(--tracking-tight)', color: 'var(--ink-800)' }}>
          Find the alpha.<br /><span style={{ color: 'var(--honey-500)' }}>Let the bee do the digging.</span>
        </h1>
        <p style={{ maxWidth: 640, margin: '24px auto 0', fontSize: 'var(--text-lg)', lineHeight: 1.6, color: 'var(--text-body)' }}>
          数据驱动的港股 IPO 投研平台：多模型估值、AI 招股书解读、基石投资者评分与全维度风险打分。
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 36 }}>
          <HBtn size="lg" onClick={() => go('dashboard')} iconRight={<Icon name="arrow-right" size={18} />}>Start Analysis</HBtn>
          <HBtn size="lg" variant="outline" onClick={() => go('listings')}>Browse IPOs</HBtn>
        </div>
      </section>

      {/* Market overview */}
      <section style={{ ...SHELL, paddingBottom: 56 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Icon name="sparkles" size={22} color="var(--violet-500)" />
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--ink-800)' }}>实时市场概览</h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>AI 驱动的市场情绪分析，帮助您把握 IPO 投资时机</p>
        </div>
        <div style={{ maxWidth: 680, margin: '0 auto' }}><MarketSentimentPanel /></div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button onClick={() => go('listings')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-700)', fontWeight: 600, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)' }}>
            查看所有 IPO 分析 <Icon name="trending-up" size={16} />
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{ ...SHELL, paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          <FeatureCard icon="trending-up" tone="honey" title="Multi-Model Valuation" body="DCF、可比公司与先例交易三法合一，结合 6 维分层模型给出公允价值区间。" />
          <FeatureCard icon="shield" tone="green" title="Risk Scoring Engine" body="15+ 财务健康与市场环境指标，量化筹码、保荐、承销与基石质量。" />
          <FeatureCard icon="sparkles" tone="violet" title="AI Prospectus Analysis" body="Claude 解读冗长招股书，秒级提炼关键风险、亮点与认购情绪。" />
        </div>
      </section>

      <Footer />
    </main>
  );
}

function DashboardView({ go, openIpo }) {
  useLucide();
  const upcoming = IPOS.filter(i => i.status === 'pending');
  return (
    <main>
      <div style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-card)' }}>
        <div style={{ ...SHELL, padding: '32px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="rocket" size={30} color="var(--honey-500)" />
            <div>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--ink-800)' }}>IPO Agent Dashboard</h1>
              <p style={{ margin: '4px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>欢迎回来！这是您的港股 IPO 市场概览。</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...SHELL, padding: '32px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          <StatCard label="Active IPOs 招股中" value="12" tone="honey" icon={<Icon name="calendar" size={20} />} />
          <StatCard label="本周上市 This week" value="5" tone="green" delta="2 vs 上周" deltaDirection="up" icon={<Icon name="trending-up" size={20} />} />
          <StatCard label="平均超额认购" value="42.8×" tone="violet" icon={<Icon name="layers" size={20} />} />
          <StatCard label="Watchlist 关注" value="7" tone="blue" icon={<Icon name="star" size={20} />} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginTop: 24, alignItems: 'start' }}>
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <CardTitle>本周招股 Upcoming this week</CardTitle>
                <button onClick={() => go('listings')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-700)', fontWeight: 600, fontSize: 'var(--text-xs)', fontFamily: 'var(--font-sans)' }}>View all →</button>
              </div>
            </CardHeader>
            <CardContent style={{ padding: 0 }}>
              {upcoming.map((ipo, i) => (
                <button key={ipo.id} onClick={() => openIpo(ipo)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                  padding: '14px 24px', background: 'none', cursor: 'pointer', textAlign: 'left',
                  border: 'none', borderTop: i ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{ipo.name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{ipo.ticker}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{ipo.listing} · {SECTOR_LABEL[ipo.sector]}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <HBadge tone={SENTIMENT_TONE[ipo.sentiment]} size="sm" dot>{SENTIMENT_LABEL[ipo.sentiment]}</HBadge>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{ipo.sub}×</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <MarketSentimentPanel />
        </div>
      </div>
      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-card)' }}>
      <div style={{ ...SHELL, padding: '40px 24px', textAlign: 'center' }}>
        <img src={LOGO} alt="AiphaBee" style={{ height: 44, marginBottom: 12 }} />
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>© 2026 AiphaBee · IPO Agent. 港股 IPO 投研 · Insight 平台.</p>
        <p style={{ margin: '6px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>Data shown is illustrative mock data for design purposes.</p>
      </div>
    </footer>
  );
}

Object.assign(window, { HomeView, DashboardView, MarketSentimentPanel, Footer, SHELL });
