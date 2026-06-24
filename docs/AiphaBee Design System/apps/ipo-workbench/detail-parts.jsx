/* ============================================================
   AiphaBee IPO 研究工作台 — Detail 左栏模块 + 底部 tabs
   ============================================================ */
const _MDS = window.AiphaBeeDesignSystem_599c13;
const { Badge: MBadge } = _MDS;

/* ---------- Timetable (vertical timeline) ---------- */
function Timeline({ events }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 4 }}>
      {events.map((e, i) => {
        const last = i === events.length - 1;
        const color = e.danger ? 'var(--red-500)' : e.done ? 'var(--green-500)' : e.active ? 'var(--honey-500)' : 'var(--neutral-300)';
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '22px 1fr', gap: 14, position: 'relative' }}>
            {/* node + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 16, height: 16, borderRadius: e.active ? 4 : '50%', flexShrink: 0,
                background: e.done || e.active || e.danger ? color : 'var(--surface-card)',
                border: '2px solid ' + color, marginTop: 2,
                boxShadow: e.active ? '0 0 0 4px rgba(251,203,10,0.25)' : 'none',
                transform: e.active ? 'rotate(45deg)' : 'none',
              }} />
              {!last && <div style={{ width: 2, flex: 1, minHeight: 26, background: e.done ? 'var(--green-500)' : 'var(--border-subtle)', marginTop: 2, marginBottom: 2 }} />}
            </div>
            <div style={{ paddingBottom: last ? 0 : 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'var(--text-sm)', lineHeight: 1.35, fontWeight: e.active ? 700 : 600, color: e.danger ? 'var(--red-600)' : e.done || e.active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{e.title}</span>
                {e.active && <MBadge tone="honey" size="sm">进行中 Now</MBadge>}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: e.done || e.active ? 'var(--text-body)' : 'var(--text-subtle)', marginTop: 2 }}>{e.at}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Terms grid ---------- */
function TermsGrid({ ipo }) {
  const t = ipo.terms;
  const items = [
    ['招股价区间 Price Range', t.priceLow && t.priceHigh ? `HK$${t.priceLow.toFixed(2)} – ${t.priceHigh.toFixed(2)}` : '待定'],
    ['最终定价 Final Price', t.finalPrice ? `HK$${t.finalPrice.toFixed(2)}` : (ipo.stage === 'subscribing' ? '招股中' : '—')],
    ['入场费 Entry Fee', t.entryFee ? `HK$${t.entryFee.toLocaleString()}` : '—'],
    ['每手股数 Lot Size', `${t.lotSize.toLocaleString()} 股`],
    ['发行股数 Shares Offered', t.sharesOffered],
    ['公开 / 国际 Split', t.publicPct ? `${t.publicPct}% / ${t.intlPct}%` : '不适用'],
    ['集资额 Total Raise', t.raiseHKD],
    ['市值 Market Cap', t.mcapHKD],
    ['每股 NTA', t.nta],
    ['市盈率 P/E', t.pe],
    ['市净率 P/B', t.pb],
    ['超额配股权 Greenshoe', t.greenshoe],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {items.map(([k, v], i) => (
        <div key={k} style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', borderRight: (i % 3 !== 2) ? '1px solid var(--border-subtle)' : 'none' }}>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginBottom: 4 }}>{k}</div>
          <Mono size="var(--text-sm)">{v}</Mono>
        </div>
      ))}
    </div>
  );
}

/* ---------- Public-offer pool + clawback ---------- */
function PoolClawback({ ipo }) {
  if (ipo.listingType === 'intro' || !ipo.pools) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)' }}>
        <Icon name="info" size={18} color="var(--text-muted)" />
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)', lineHeight: 1.55 }}>
          <strong>{LISTING_TYPE[ipo.listingType].split(' ')[0]}</strong> — 本次{ipo.listingType === 'intro' ? '以介绍方式上市，无公开发售、无 Pool A/B、无回拨机制' : '尚未启动公开发售，Pool 与回拨待招股时公布'}。
        </div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        {ipo.pools.map(p => (
          <div key={p.name} style={{ padding: '14px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{p.name}</span>
              <MBadge tone="neutral" size="sm">{p.desc}</MBadge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <div><Eyebrow>可认购 Lots</Eyebrow><div style={{ marginTop: 2 }}><Mono>{p.lots}</Mono></div></div>
              <div style={{ textAlign: 'right' }}><Eyebrow>有效申请</Eyebrow><div style={{ marginTop: 2 }}><Mono color="var(--text-body)">{p.apps ?? '招股中'}</Mono></div></div>
            </div>
          </div>
        ))}
      </div>
      {ipo.clawback && (
        <>
          <Eyebrow style={{ marginBottom: 8 }}>回拨机制 Clawback</Eyebrow>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {ipo.clawback.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: i ? '1px solid var(--border-subtle)' : 'none', background: c.active ? 'var(--surface-honey)' : 'transparent' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {c.active && <Icon name="arrow-right" size={13} color="var(--honey-700)" />}公开认购 {c.trigger}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mono color={c.active ? 'var(--honey-700)' : 'var(--text-primary)'}>公开占 {c.publicPct}</Mono>
                  {c.active && <MBadge tone="honey" size="sm">已触发</MBadge>}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Allotment result ---------- */
function Allotment({ ipo }) {
  if (!ipo.allotment) {
    const pending = ipo.stage === 'subscribing' || ipo.stage === 'processing';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)' }}>
        <Icon name={pending ? 'clock' : 'minus-circle'} size={18} color="var(--text-muted)" />
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
          {pending ? '分配结果尚未公布 — 招股 / 处理中，结果公布后将显示一手中签率、回拨比例与各档中签率。' : '本次未产生分配结果（介绍上市 / 已撤回）。'}
        </div>
      </div>
    );
  }
  const a = ipo.allotment;
  const kpis = [
    ['一手中签率 One-lot', `${a.oneLotRate}%`, a.oneLotRate >= 50 ? 'var(--green-600)' : 'var(--honey-700)', false],
    ['有效申请 Valid Apps', a.validApps, 'var(--text-primary)', false],
    ['顶头槌 Max Lots', a.headHammer, 'var(--text-primary)', true],
    ['回拨 Clawback', a.clawbackApplied, 'var(--text-primary)', false],
  ];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {kpis.map(([k, v, c, gated]) => (
          <div key={k} style={{ padding: '12px 14px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginBottom: 5 }}>{k}</div>
            {gated ? <LockedValue><Mono size="var(--text-lg)" color={c}>{v}</Mono></LockedValue> : <Mono size="var(--text-lg)" color={c}>{v}</Mono>}
          </div>
        ))}
      </div>
      <Eyebrow style={{ marginBottom: 8 }}>各档中签率 Allotment by Tier</Eyebrow>
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1.6fr', gap: 0, padding: '8px 14px', background: 'var(--surface-muted)' }}>
          {['申请手数', '申请人数', '中签率 Rate'].map(h => <Eyebrow key={h}>{h}</Eyebrow>)}
        </div>
        {a.result.map((r, i) => {
          const rate = parseInt(r.rate);
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1.6fr', gap: 0, padding: '10px 14px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center' }}>
              <Mono>{r.lots} 手</Mono>
              <LockedValue><Mono color="var(--text-body)" weight={600}>{r.applied}</Mono></LockedValue>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 'var(--radius-pill)', background: 'var(--surface-muted)', overflow: 'hidden', maxWidth: 90 }}>
                  <div style={{ width: rate + '%', height: '100%', background: rate >= 100 ? 'var(--green-500)' : 'var(--honey-500)', borderRadius: 'var(--radius-pill)' }} />
                </div>
                <Mono color={rate >= 100 ? 'var(--green-600)' : 'var(--honey-700)'}>{r.rate}</Mono>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Cornerstones ---------- */
function Cornerstones({ ipo }) {
  if (!ipo.cornerstones || !ipo.cornerstones.length) {
    return <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}><Icon name="user-x" size={16} /> 该 IPO 未引入基石投资者，需求支撑较弱。</div>;
  }
  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {ipo.cornerstones.map((c, i) => (
        <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>禁售 Lock-up {c.lockup}</div>
          </div>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            <LockedValue tier="enterprise"><Mono size="var(--text-sm)">{c.amount}</Mono></LockedValue>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{c.pct}% of offer</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Lockup ---------- */
function Lockup({ ipo }) {
  if (!ipo.lockup || !ipo.lockup.length) {
    return <div style={{ padding: '14px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>无适用禁售期信息。</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {ipo.lockup.map((l, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="lock" size={15} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{l.type}</div>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>解禁 Unlock · {l.endDate}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Mono size="var(--text-sm)">{l.pct}</Mono>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{l.shares}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Bottom tabs ---------- */
function ProfileTabs({ ipo }) {
  const [tab, setTab] = React.useState('overview');
  const p = ipo.profile;
  const tabs = [
    ['overview', '业务概览', 'Overview'],
    ['proceeds', '所得款用途', 'Use of Proceeds'],
    ['risks', '风险因素', 'Risks'],
    ['advantages', '竞争优势', 'Advantages'],
    ['company', '公司资料', 'Company'],
    ['tiers', '申请档位', 'App Tiers'],
  ];
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
        {tabs.map(([k, cn, en]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            cursor: 'pointer', border: 'none', background: 'none', padding: '12px 14px',
            fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 600,
            color: tab === k ? 'var(--ink-800)' : 'var(--text-muted)',
            borderBottom: '2px solid ' + (tab === k ? 'var(--honey-500)' : 'transparent'), marginBottom: -1,
          }}>{cn} <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', fontWeight: 500 }}>{en}</span></button>
        ))}
      </div>
      <div style={{ padding: '22px 4px 4px' }}>
        {tab === 'overview' && <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 1.75, color: 'var(--text-body)', maxWidth: 760 }}>{p.overview}</p>}
        {tab === 'proceeds' && (
          <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {p.useOfProceeds.map((u, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 'var(--text-sm)' }}>
                  <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>{u.label}</span>
                  <Mono>{u.pct}%</Mono>
                </div>
                <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--surface-muted)', overflow: 'hidden' }}>
                  <div style={{ width: u.pct + '%', height: '100%', borderRadius: 'var(--radius-pill)', background: `var(--chart-${(i % 6) + 1})` }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'risks' && <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 760 }}>{p.risks.map((r, i) => <li key={i} style={{ display: 'flex', gap: 10, fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text-body)' }}><Icon name="alert-triangle" size={16} color="var(--orange-500)" style={{ flexShrink: 0, marginTop: 2 }} />{r}</li>)}</ul>}
        {tab === 'advantages' && <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 760 }}>{p.advantages.map((r, i) => <li key={i} style={{ display: 'flex', gap: 10, fontSize: 'var(--text-sm)', lineHeight: 1.6, color: 'var(--text-body)' }}><Icon name="check-circle-2" size={16} color="var(--green-600)" style={{ flexShrink: 0, marginTop: 2 }} />{r}</li>)}</ul>}
        {tab === 'company' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, maxWidth: 620, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {p.company.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', borderRight: i % 2 === 0 ? '1px solid var(--border-subtle)' : 'none' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{c.k}</span>
                <Mono size="var(--text-sm)" color="var(--text-body)">{c.v}</Mono>
              </div>
            ))}
          </div>
        )}
        {tab === 'tiers' && (ipo.applicationTiers ? (
          <div style={{ maxWidth: 620, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr', padding: '8px 14px', background: 'var(--surface-muted)' }}>
              {['手数 Lots', '股数 Shares', '入场金额 HK$', ipo.allotment ? '中签率' : ''].map((h, i) => <Eyebrow key={i}>{h}</Eyebrow>)}
            </div>
            {ipo.applicationTiers.map((t, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr', padding: '10px 14px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center', background: t.hot ? 'var(--surface-honey)' : 'transparent' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mono>{t.lots}</Mono>{t.hot && <MBadge tone="honey" size="sm">最热</MBadge>}</span>
                <Mono color="var(--text-body)">{t.shares.toLocaleString()}</Mono>
                <Mono color="var(--text-body)">{t.amount.toLocaleString()}</Mono>
                <Mono color="var(--honey-700)">{t.rate || '—'}</Mono>
              </div>
            ))}
          </div>
        ) : <div style={{ padding: '14px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', maxWidth: 620 }}>申请档位将在招股启动后公布。</div>)}
      </div>
    </div>
  );
}

/* ---------- Narrative section (sanitized prose) ---------- */
function NarrativeSection({ title, en, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
        <Eyebrow>{en}</Eyebrow>
      </div>
      {children}
    </div>
  );
}

/* ---------- Use of proceeds ---------- */
function Proceeds({ ipo }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {ipo.profile.useOfProceeds.map((u, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>{u.label}</span>
            <Mono>{u.pct}%</Mono>
          </div>
          <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--surface-muted)', overflow: 'hidden' }}>
            <div style={{ width: u.pct + '%', height: '100%', borderRadius: 'var(--radius-pill)', background: `var(--chart-${(i % 6) + 1})` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Company info table ---------- */
function CompanyTable({ ipo }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {ipo.profile.company.map((c, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', borderRight: i % 2 === 0 ? '1px solid var(--border-subtle)' : 'none' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{c.k}</span>
          <Mono size="var(--text-sm)" color="var(--text-body)">{c.v}</Mono>
        </div>
      ))}
    </div>
  );
}

/* ---------- Application tiers ---------- */
function AppTiers({ ipo }) {
  if (!ipo.applicationTiers) return <div style={{ padding: '14px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>申请档位将在招股启动后公布。</div>;
  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr', padding: '8px 14px', background: 'var(--surface-muted)' }}>
        {['手数 Lots', '股数 Shares', '入场金额 HK$', ipo.allotment ? '中签率' : ''].map((h, i) => <Eyebrow key={i}>{h}</Eyebrow>)}
      </div>
      {ipo.applicationTiers.map((t, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr', padding: '10px 14px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center', background: t.hot ? 'var(--surface-honey)' : 'transparent' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mono>{t.lots}</Mono>{t.hot && <MBadge tone="honey" size="sm">最热</MBadge>}</span>
          <Mono color="var(--text-body)">{t.shares.toLocaleString()}</Mono>
          <Mono color="var(--text-body)">{t.amount.toLocaleString()}</Mono>
          <Mono color="var(--honey-700)">{t.rate || '—'}</Mono>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Timeline, TermsGrid, PoolClawback, Allotment, Cornerstones, Lockup, ProfileTabs, NarrativeSection, Proceeds, CompanyTable, AppTiers });
