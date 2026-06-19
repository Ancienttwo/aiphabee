/* ============================================================
   AiphaBee IPO Agent — Listings & Detail (research) views
   ============================================================ */
const _RDS = window.AiphaBeeDesignSystem_599c13;
const { Button: RBtn, Badge: RBadge, Card: RCard, CardHeader: RCH, CardTitle: RCT, CardDescription: RCD, CardContent: RCC, ScoreMeter: RScore, RatingStars: RStars, BeeNote: RBeeNote, MascotState: RMascotState } = _RDS;

/* ---------- 6-dimension radar chart (SVG) ---------- */
function Radar({ dims, size = 260, color = 'var(--chart-1)' }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 34;
  const n = dims.length;
  const pt = (i, rad) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  };
  const rings = [0.25, 0.5, 0.75, 1];
  const gridPoly = (f) => dims.map((_, i) => pt(i, r * f).join(',')).join(' ');
  const dataPoly = dims.map((d, i) => pt(i, r * (d.score / 100)).join(',')).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      {rings.map((f, i) => (
        <polygon key={i} points={gridPoly(f)} fill="none" stroke="var(--border-subtle)" strokeWidth="1" />
      ))}
      {dims.map((_, i) => {
        const [x, y] = pt(i, r);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border-subtle)" strokeWidth="1" />;
      })}
      <polygon points={dataPoly} fill={color} fillOpacity="0.28" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {dims.map((d, i) => {
        const [x, y] = pt(i, r * (d.score / 100));
        return <circle key={i} cx={x} cy={y} r="3.5" fill={color} />;
      })}
      {dims.map((d, i) => {
        const [x, y] = pt(i, r + 18);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fontFamily="var(--font-sans)" fontSize="11" fontWeight="600" fill="var(--text-muted)">{d.label}</text>
        );
      })}
    </svg>
  );
}

/* ---------- Listings ---------- */
function IpoListCard({ ipo, openIpo }) {
  const st = STATUS[ipo.status];
  return (
    <RCard interactive onClick={() => openIpo(ipo)} style={{ cursor: 'pointer' }}>
      <div style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>{ipo.name}</h3>
              <RBadge tone={st.tone} size="sm">{st.label}</RBadge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{ipo.ticker}</span>
              <span>·</span><span>{ipo.exchange}</span><span>·</span><span>{SECTOR_LABEL[ipo.sector]}</span>
            </div>
          </div>
          <Icon name="arrow-up-right" size={20} color="var(--text-subtle)" />
        </div>
        <p style={{ margin: '12px 0 16px', fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text-body)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ipo.desc}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
          <Metric label="Listing" value={ipo.listing.replace(', 2026', '')} />
          <Metric label="Offer" value={`HK$${ipo.offer.toFixed(2)}`} mono />
          <Metric label="超额认购" value={`${ipo.sub}×`} mono tone={ipo.sub >= 50 ? 'var(--green-600)' : ipo.sub < 5 ? 'var(--neutral-500)' : undefined} />
          <Metric label="Sentiment" value={<RBadge tone={SENTIMENT_TONE[ipo.sentiment]} size="sm" dot>{ipo.sentiment}</RBadge>} />
        </div>
      </div>
    </RCard>
  );
}

function Metric({ label, value, mono, tone }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 600, color: tone || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function ListingsView({ openIpo }) {
  useLucide();
  const [filter, setFilter] = React.useState('All');
  const chips = ['All', 'Upcoming', 'Priced', 'Listed', 'HKEX'];
  const shown = IPOS.filter(i =>
    filter === 'All' || filter === 'HKEX' ? true :
    filter === 'Upcoming' ? i.status === 'pending' :
    filter === 'Priced' ? i.status === 'priced' :
    filter === 'Listed' ? i.status === 'listed' : true);
  return (
    <main style={{ ...SHELL, padding: '40px 24px 80px' }}>
      <h1 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', fontWeight: 700, color: 'var(--ink-800)' }}>IPO Listings</h1>
      <p style={{ margin: '0 0 24px', fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>港股 IPO 全维度 AI 估值与风险分析</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {chips.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '8px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 600,
            border: '1px solid ' + (filter === c ? 'var(--honey-500)' : 'var(--border-default)'),
            background: filter === c ? 'var(--honey-500)' : 'var(--surface-card)',
            color: filter === c ? 'var(--ink-800)' : 'var(--text-body)',
          }}>{c}</button>
        ))}
      </div>
      {shown.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {shown.map(ipo => <IpoListCard key={ipo.id} ipo={ipo} openIpo={openIpo} />)}
        </div>
      ) : (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
          <RMascotState basePath={MASCOT_BP} pose="empty" title="这个筛选下还没有标的"
            description="换个筛选条件，工蜂继续为你采集港美股的新机会。" />
        </div>
      )}
      <Footer />
    </main>
  );
}

/* ---------- Detail (research view) ---------- */
function DetailView({ ipo, go }) {
  useLucide();
  const rcfg = RATING_CFG[ipo.recommendation];
  const scoreTone = ipo.sentiment === 'bullish' ? 'bullish' : ipo.sentiment === 'bearish' ? 'bearish' : ipo.sentiment === 'cautious' ? 'cautious' : 'neutral';
  return (
    <main style={{ ...SHELL, padding: '24px 24px 80px' }}>
      <button onClick={() => go('listings')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)', marginBottom: 18 }}>
        <Icon name="arrow-left" size={16} /> Back to listings
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', fontWeight: 700, color: 'var(--ink-800)' }}>{ipo.name}</h1>
            <RBadge tone={STATUS[ipo.status].tone}>{STATUS[ipo.status].label}</RBadge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--text-base)', color: 'var(--text-muted)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-body)' }}>{ipo.ticker}</span>
            <span>·</span><span>{ipo.cn}</span><span>·</span><span>{SECTOR_LABEL[ipo.sector]}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <RBadge tone={SENTIMENT_TONE[ipo.sentiment]} variant="solid" dot>{SENTIMENT_LABEL[ipo.sentiment]}</RBadge>
          <RBtn variant="ai" icon={<Icon name="sparkles" size={16} />}>Ask the Bee</RBtn>
        </div>
      </div>

      {/* Key stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        <KV label="Offer Price" value={`HK$${ipo.offer.toFixed(2)}`} />
        <KV label="Total Raise" value={`HK$${ipo.raiseHKD}`} />
        <KV label="Market Cap" value={`HK$${ipo.mcapHKD}`} />
        <KV label="超额认购" value={`${ipo.sub}×`} tone={ipo.sub >= 50 ? 'var(--green-600)' : ipo.sub < 5 ? 'var(--neutral-500)' : 'var(--text-primary)'} />
        <KV label="Listing Date" value={ipo.listing.replace(', 2026', '')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Tier analysis */}
        <RCard>
          <RCH>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <RCT>分层分析 Tier Analysis</RCT>
                <RCD>6 维智能评估 · {ipo.tierLabel}</RCD>
              </div>
              <RBadge tone={rcfg.tone} variant="solid">{rcfg.label}</RBadge>
            </div>
          </RCH>
          <RCC>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>综合评分 Overall</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-5xl)', fontWeight: 800, color: 'var(--honey-500)', lineHeight: 1 }}>{ipo.score}</span>
                  <span style={{ color: 'var(--text-subtle)' }}>/ 100</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>置信度 Confidence</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>{ipo.confidence}%</div>
              </div>
            </div>
            <Radar dims={ipo.dims} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
              {ipo.dims.map((d, i) => (
                <div key={d.k}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>{d.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{d.score}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 'var(--radius-pill)', background: 'var(--surface-muted)', overflow: 'hidden' }}>
                    <div style={{ width: `${d.score}%`, height: '100%', borderRadius: 'var(--radius-pill)', background: `var(--chart-${i + 1})` }} />
                  </div>
                </div>
              ))}
            </div>
          </RCC>
        </RCard>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Sentiment */}
          <RCard>
            <RCH><RCT>市场情绪 Sentiment</RCT><RCD>该标的 30 日情绪指数</RCD></RCH>
            <RCC><RScore value={ipo.score} tone={scoreTone} labels={['极度悲观', '中性', '极度乐观']} /></RCC>
          </RCard>

          {/* Institution ratings */}
          <RCard>
            <RCH><RCT>机构评级 Institutions</RCT><RCD>保荐人与承销团质量</RCD></RCH>
            <RCC style={{ padding: 0 }}>
              {ipo.institutions.map((ins, i) => (
                <div key={ins.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{ins.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{ins.role}</div>
                  </div>
                  <RStars value={ins.rating} size={15} />
                </div>
              ))}
            </RCC>
          </RCard>

          {/* Cornerstone investors */}
          <RCard>
            <RCH><RCT>基石投资者 Cornerstone</RCT><RCD>{ipo.cornerstones.length ? `${ipo.cornerstones.length} 名基石` : '暂无基石投资者'}</RCD></RCH>
            <RCC style={{ padding: ipo.cornerstones.length ? 0 : '0 24px 24px' }}>
              {ipo.cornerstones.length ? ipo.cornerstones.map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{c.amount}</div>
                    <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{c.pct}% of offer</div>
                  </div>
                </div>
              )) : <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>该 IPO 未引入基石投资者，需求支撑较弱。</p>}
            </RCC>
          </RCard>
        </div>
      </div>

      {/* AI recommendation — worker-bee insight */}
      <div style={{ marginTop: 24 }}>
        <RBeeNote basePath={MASCOT_BP} pose={ipo.recommendation === 'sell' ? 'risk' : ipo.recommendation === 'strong_buy' ? 'success' : 'insight'}
          tone="navy" title="AiphaBee 投资建议"
          action={<RBadge tone={rcfg.tone} variant="solid" size="sm">{rcfg.label} · 置信度 {ipo.confidence}%</RBadge>}>
          {ipo.aiNote}
        </RBeeNote>
      </div>
      <Footer />
    </main>
  );
}

function KV({ label, value, tone }) {
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 700, color: tone || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

Object.assign(window, { ListingsView, DetailView, Radar });
