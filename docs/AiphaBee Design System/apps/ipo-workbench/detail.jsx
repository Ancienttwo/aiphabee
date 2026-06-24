/* ============================================================
   AiphaBee IPO 研究工作台 — Detail 分 Tab 工作台
   顶栏(持续) + 8 Tab：概览/时间表/发售详情/认购回拨/配售结果/基石/公司资料/解禁
   事实层(provenance=netquity) 与分析层(aiphabee_research, 描述性非建议) 分离
   ============================================================ */
const _DDS = window.AiphaBeeDesignSystem_599c13;
const { Badge: DBadge, Button: DBtn, RatingStars: DStars, BeeNote: DBeeNote } = _DDS;

function TopKpi({ label, value, sub, tone }) {
  return (
    <div style={{ minWidth: 0 }}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ marginTop: 4 }}><Mono size="var(--text-lg)" color={tone || 'var(--text-primary)'}>{value}</Mono></div>
      {sub && <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function RiskRow({ r }) {
  const cfg = { high: ['var(--red-500)', 'var(--red-50)', '高 High'], mid: ['var(--orange-500)', 'rgba(245,158,11,0.1)', '中 Mid'], low: ['var(--green-600)', 'var(--green-50)', '低 Low'] }[r.level];
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: '1px solid var(--surface-muted)' }}>
      <span style={{ flexShrink: 0, alignSelf: 'flex-start', marginTop: 1, padding: '1px 8px', borderRadius: 'var(--radius-pill)', background: cfg[1], color: cfg[0], fontSize: 'var(--text-2xs)', fontWeight: 700 }}>{cfg[2]}</span>
      <span style={{ fontSize: 'var(--text-sm)', lineHeight: 1.5, color: 'var(--text-body)' }}>{r.text}</span>
    </div>
  );
}

function Panel({ icon, title, en, right, children, accent }) {
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
        {icon && <Icon name={icon} size={15} color={accent || 'var(--honey-700)'} />}
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
        {en && <span style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-subtle)' }}>{en}</span>}
        {right && <span style={{ marginLeft: 'auto' }}>{right}</span>}
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  );
}

/* provenance tag — distinguishes vendor fact vs AiphaBee analysis */
function Provenance({ source = 'vendor', methodology }) {
  const vendor = source === 'vendor';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: vendor ? 'var(--green-50)' : 'var(--violet-50)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 600, color: vendor ? 'var(--green-700)' : 'var(--violet-600)' }}>
      <Icon name={vendor ? 'database' : 'sparkles'} size={11} />
      {vendor ? `provenance · ${VENDOR_PROVENANCE}` : `${RESEARCH_SOURCE} · ${methodology}`}
    </span>
  );
}

const DETAIL_TABS = [
  ['overview', '概览', 'Overview'],
  ['timetable', '时间表', 'Timetable'],
  ['offering', '发售详情', 'Offering'],
  ['pool', '认购与回拨', 'Pool & Clawback'],
  ['allotment', '配售结果', 'Allotment'],
  ['cornerstone', '基石', 'Cornerstone'],
  ['corporate', '公司资料', 'Corporate'],
  ['lockup', '解禁', 'Lock-up'],
];

function DetailView({ ipo, go, openIpo, compareIds, toggleCompare }) {
  useLucide();
  const [tab, setTab] = React.useState('overview');
  React.useEffect(() => { setTab('overview'); }, [ipo.id]);
  const st = STAGE_BY[ipo.stage];
  const stToneMap = { honey: 'honey', bullish: 'bullish', info: 'info', bearish: 'bearish', neutral: 'neutral' };
  const rec = REC_CFG[ipo.recommendation];
  const t = ipo.terms, live = ipo.live;
  const isAllot = ipo.stage === 'allotted';
  const inCompare = compareIds.includes(ipo.id);
  const p = ipo.profile;

  return (
    <main style={{ ...SHELL, padding: '20px 24px 80px' }}>
      <button onClick={() => go('pipeline')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)', marginBottom: 16 }}>
        <Icon name="arrow-left" size={16} /> 返回 Pipeline
      </button>

      {/* ============ Top bar (persistent) ============ */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', padding: '22px 24px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--ink-800)', letterSpacing: 'var(--tracking-tight)' }}>{ipo.name}</h1>
              <span style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>{ipo.cn}</span>
              <DBadge tone={stToneMap[st.tone]} variant="solid" dot dotShape="hex">{st.label} {st.en}</DBadge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--text-sm)', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <Mono size="var(--text-sm)" color="var(--text-body)">{ipo.ticker}</Mono>
              <span>·</span><span>{ipo.board}</span>
              <span>·</span><span>{SECTOR_LABEL[ipo.sector]}</span>
              <span>·</span><DBadge tone="navy" variant="outline" size="sm">{LISTING_TYPE[ipo.listingType]}</DBadge>
              <DBadge tone={SENTIMENT_TONE[ipo.sentiment]} size="sm" dot>{SENTIMENT_LABEL[ipo.sentiment]}</DBadge>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <EvidenceChip ev={ipo.evidence} />
            <div style={{ display: 'flex', gap: 10 }}>
              <DBtn size="sm" variant={inCompare ? 'secondary' : 'outline'} icon={<Icon name={inCompare ? 'check' : 'git-compare'} size={15} />} onClick={() => toggleCompare(ipo.id)}>{inCompare ? '已加入对比' : '加入对比'}</DBtn>
              <DBtn size="sm" variant="ai" icon={<Icon name="sparkles" size={15} />}>问问工蜂</DBtn>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 18, paddingTop: 18, borderTop: '1px solid var(--border-subtle)' }}>
          <TopKpi label="招股价 Offer" value={offerText(t)} sub={t.finalPrice ? '最终定价' : t.priceLow ? '区间' : ''} />
          <TopKpi label="入场费 Entry" value={t.entryFee ? `HK$${t.entryFee.toLocaleString()}` : '—'} sub={`每手 ${t.lotSize.toLocaleString()} 股`} />
          <TopKpi label="招股期 Period" value={ipo.subPeriod.start} sub={`至 ${ipo.subPeriod.end}`} />
          <TopKpi label="上市日 Listing" value={ipo.listingDate.replace(', 2026', '')} />
          <TopKpi label={isAllot ? '一手中签率' : '公开认购 Sub'} value={isAllot ? `${live.oneLotRate}%` : (live.subPublic != null ? `${live.subPublic}×` : '—')} tone={isAllot ? (live.oneLotRate >= 50 ? 'var(--green-600)' : 'var(--honey-700)') : demandTone(live.subPublic)} sub={isAllot ? `回拨 ${live.clawbackApplied}` : (live.subPublic != null ? '实时 Live' : '')} />
          <TopKpi label="研究评分 Score" value={`${ipo.score}`} tone="var(--honey-700)" sub={`置信度 ${ipo.confidence}%`} />
        </div>
      </div>

      {/* ============ Tab strip ============ */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border-subtle)', marginBottom: 22, overflowX: 'auto' }}>
        {DETAIL_TABS.map(([k, cn, en]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            cursor: 'pointer', border: 'none', background: 'none', padding: '12px 16px', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 600,
            color: tab === k ? 'var(--ink-800)' : 'var(--text-muted)',
            borderBottom: '2px solid ' + (tab === k ? 'var(--honey-500)' : 'transparent'), marginBottom: -1,
          }}>{cn} <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', fontWeight: 500 }}>{en}</span></button>
        ))}
      </div>

      {/* ============ Tab content ============ */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(290px, 1fr)', gap: 22, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <Panel icon="building-2" title="业务概览" en="Business" right={<Provenance source="vendor" />}>
              <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 1.75, color: 'var(--text-body)' }}>{p.overview}</p>
            </Panel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
              <Panel icon="trophy" title="竞争优势" en="Advantages" accent="var(--green-600)">
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11 }}>{p.advantages.map((r, i) => <li key={i} style={{ display: 'flex', gap: 9, fontSize: 'var(--text-sm)', lineHeight: 1.55, color: 'var(--text-body)' }}><Icon name="check-circle-2" size={15} color="var(--green-600)" style={{ flexShrink: 0, marginTop: 2 }} />{r}</li>)}</ul>
              </Panel>
              <Panel icon="alert-triangle" title="风险因素" en="Risks" accent="var(--orange-500)">
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11 }}>{p.risks.map((r, i) => <li key={i} style={{ display: 'flex', gap: 9, fontSize: 'var(--text-sm)', lineHeight: 1.55, color: 'var(--text-body)' }}><Icon name="alert-triangle" size={15} color="var(--orange-500)" style={{ flexShrink: 0, marginTop: 2 }} />{r}</li>)}</ul>
              </Panel>
            </div>
            <Panel icon="pie-chart" title="所得款项用途" en="Use of Proceeds" right={<Provenance source="vendor" />}>
              <div style={{ maxWidth: 560 }}><Proceeds ipo={ipo} /></div>
            </Panel>
          </div>

          {/* Right: analysis layer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, position: 'sticky', top: 80 }}>
            <DBeeNote basePath={MASCOT_BP} pose={ipo.recommendation === 'avoid' ? 'risk' : ipo.recommendation === 'strong_buy' ? 'success' : 'insight'}
              tone="navy" title="AiphaBee 研究信号"
              action={<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}><DBadge tone={rec.tone} variant="solid" size="sm">{rec.label}</DBadge><DBadge tone="navy" variant="outline" size="sm">置信度 {ipo.confidence}%</DBadge></div>}>
              {ipo.aiNote}
            </DBeeNote>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '11px 14px', background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <Icon name="shield" size={15} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 'var(--text-2xs)', lineHeight: 1.55, color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-body)' }}>研究信号 · 非投资建议</strong> Research signal, not advice. 描述性信号由 AiphaBee 模型基于已披露事实生成，不构成买卖或持有建议。<Provenance source="research" methodology={ipo.evidence.methodology} />
              </div>
            </div>
            <Panel icon="shield-alert" title="风险摘要" en="Risk" accent="var(--red-500)">
              {ipo.riskSummary.map((r, i) => <RiskRow key={i} r={r} />)}
            </Panel>
          </div>
        </div>
      )}

      {tab === 'timetable' && <Panel icon="route" title="时间表" en="Timetable" right={<Provenance source="vendor" />}><Timeline events={ipo.timetable} /></Panel>}

      {tab === 'offering' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Panel icon="file-text" title="发行条款" en="Offer Terms" right={<Provenance source="vendor" />}><TermsGrid ipo={ipo} /></Panel>
          <Panel icon="list-ordered" title="申请档位" en="Application Tiers"><AppTiers ipo={ipo} /></Panel>
        </div>
      )}

      {tab === 'pool' && <Panel icon="layers" title="公开发售 Pool 与回拨" en="Pool & Clawback" right={<Provenance source="vendor" />}><PoolClawback ipo={ipo} /></Panel>}

      {tab === 'allotment' && <Panel icon="check-check" title="配售结果" en="Allotment Result" right={isAllot ? <DBadge tone="bullish" size="sm">已公布</DBadge> : <DBadge tone="neutral" size="sm">待公布</DBadge>}><Allotment ipo={ipo} /></Panel>}

      {tab === 'cornerstone' && <Panel icon="gem" title="基石投资者" en="Cornerstone" right={ipo.cornerstones && ipo.cornerstones.length ? <DBadge tone="neutral" size="sm">敏感字段 · 金额受权限保护</DBadge> : null}><Cornerstones ipo={ipo} /></Panel>}

      {tab === 'corporate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, alignItems: 'start' }}>
          <Panel icon="building" title="公司资料" en="Company Info"><CompanyTable ipo={ipo} /></Panel>
          <Panel icon="users" title="保荐人 / 主要参与方" en="Parties">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {ipo.sponsors.map((s, i) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderTop: i ? '1px solid var(--surface-muted)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                    <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>{s.role}</div>
                  </div>
                  <DStars value={s.rating} size={14} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'lockup' && <Panel icon="lock" title="禁售期" en="Lock-up" right={<Provenance source="vendor" />}><Lockup ipo={ipo} /></Panel>}
    </main>
  );
}

Object.assign(window, { DetailView });
