/* ============================================================
   AiphaBee IPO 研究工作台 — Pipeline 首页
   IPO 生命周期看板：处理中 · 招股中 · 暗盘/上市 · 已分配 · 撤回
   ============================================================ */
const _PDS = window.AiphaBeeDesignSystem_599c13;
const { Badge: PBadge, Button: PBtn } = _PDS;

/* offer price range / final */
function offerText(t) {
  if (t.finalPrice) return `HK$${t.finalPrice.toFixed(2)}`;
  if (t.priceLow && t.priceHigh) return `HK$${t.priceLow.toFixed(2)}–${t.priceHigh.toFixed(2)}`;
  return '待定';
}

function StageRail({ active, setActive }) {
  const counts = Object.fromEntries(STAGES.map(s => [s.key, IPOS.filter(i => i.stage === s.key).length]));
  const cell = (key, label, en, count, icon, tone) => {
    const on = active === key;
    const toneColor = { honey: 'var(--honey-600)', bullish: 'var(--green-600)', info: 'var(--blue-500)', bearish: 'var(--red-500)', neutral: 'var(--neutral-500)' }[tone];
    return (
      <button key={key} onClick={() => setActive(on && key !== 'all' ? 'all' : key)} style={{
        flex: 1, textAlign: 'left', cursor: 'pointer', padding: '14px 16px',
        borderRadius: 'var(--radius-lg)', border: '1px solid ' + (on ? 'var(--honey-500)' : 'var(--border-subtle)'),
        background: on ? 'var(--surface-honey)' : 'var(--surface-card)',
        boxShadow: on ? 'var(--shadow-sm)' : 'none', transition: 'all var(--duration-fast) var(--ease-standard)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Icon name={icon} size={15} color={toneColor} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Eyebrow>{en}</Eyebrow>
          <Mono size="var(--text-2xl)" weight={800} color={on ? 'var(--honey-700)' : 'var(--text-primary)'}>{count}</Mono>
        </div>
      </button>
    );
  };
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
      <button onClick={() => setActive('all')} style={{
        cursor: 'pointer', padding: '14px 18px', borderRadius: 'var(--radius-lg)',
        border: '1px solid ' + (active === 'all' ? 'var(--ink-800)' : 'var(--border-subtle)'),
        background: active === 'all' ? 'var(--ink-800)' : 'var(--surface-card)', minWidth: 120,
      }}>
        <Eyebrow style={{ color: active === 'all' ? 'rgba(255,255,255,0.6)' : undefined }}>All Pipeline</Eyebrow>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <Mono size="var(--text-2xl)" weight={800} color={active === 'all' ? '#fff' : 'var(--text-primary)'}>{IPOS.length}</Mono>
          <span style={{ fontSize: 'var(--text-xs)', color: active === 'all' ? 'rgba(255,255,255,0.6)' : 'var(--text-subtle)' }}>个标的</span>
        </div>
      </button>
      {STAGES.map(s => cell(s.key, s.label, s.en, IPOS.filter(i => i.stage === s.key).length, s.icon, s.tone))}
    </div>
  );
}

function FilterBar({ sector, setSector, sort, setSort, q, setQ }) {
  const sectors = [['all', '全部行业'], ...Object.entries(SECTOR_LABEL)];
  const select = (val, set, opts) => (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select value={val} onChange={e => set(e.target.value)} style={{
        appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer',
        padding: '8px 30px 8px 12px', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)', background: 'var(--surface-card)',
        font: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-body)',
      }}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <Icon name="chevron-down" size={14} style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: 'var(--text-subtle)' }} />
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
      <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200, display: 'flex', alignItems: 'center' }}>
        <Icon name="search" size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-subtle)' }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索公司 / 代码 Search ticker or name" style={{
          width: '100%', padding: '9px 12px 9px 34px', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)', background: 'var(--surface-card)',
          font: 'inherit', fontSize: 'var(--text-sm)', color: 'var(--text-body)',
        }} />
      </div>
      {select(sector, setSector, sectors)}
      {select(sort, setSort, [['sub', '按认购倍数 Subscription'], ['score', '按综合评分 Score'], ['date', '按上市日 Date'], ['raise', '按集资额 Raise']])}
    </div>
  );
}

/* dense IPO row */
function IpoRow({ ipo, openIpo, inCompare, toggleCompare }) {
  const st = STAGE_BY[ipo.stage];
  const stToneMap = { honey: 'honey', bullish: 'bullish', info: 'info', bearish: 'bearish', neutral: 'neutral' };
  const t = ipo.terms, live = ipo.live;
  const isAllot = ipo.stage === 'allotted';
  return (
    <div onClick={() => openIpo(ipo)} style={{
      display: 'grid', gridTemplateColumns: '2.4fr 1fr 1fr 1fr 1.1fr 0.7fr 40px', gap: 14, alignItems: 'center',
      padding: '14px 18px', cursor: 'pointer', background: 'var(--surface-card)',
      borderBottom: '1px solid var(--border-subtle)', transition: 'background var(--duration-fast)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-honey)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-card)'}>
      {/* name */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{ipo.name}</span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{ipo.cn}</span>
          <PBadge tone={stToneMap[st.tone]} size="sm" dot dotShape="hex">{st.label}</PBadge>
          {ipo.listingType !== 'normal' && <PBadge tone="navy" variant="outline" size="sm">{LISTING_TYPE[ipo.listingType].split(' ')[0]}</PBadge>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          <Mono size="var(--text-xs)" color="var(--text-body)">{ipo.ticker}</Mono>
          <span>·</span><span>{SECTOR_LABEL[ipo.sector]}</span>
        </div>
      </div>
      {/* offer */}
      <div>
        <Eyebrow>Offer · 入场费</Eyebrow>
        <div style={{ marginTop: 3 }}><Mono>{offerText(t)}</Mono></div>
        <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>{t.entryFee ? `HK$${t.entryFee.toLocaleString()}` : '—'}</div>
      </div>
      {/* listing date */}
      <div>
        <Eyebrow>Listing 上市日</Eyebrow>
        <div style={{ marginTop: 3, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-body)' }}>{ipo.listingDate.replace(', 2026', '')}</div>
        <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>{t.raiseHKD !== '不适用（无新股发行）' ? `集资 ${t.raiseHKD}` : '介绍上市'}</div>
      </div>
      {/* subscription / win rate */}
      <div>
        <Eyebrow>{isAllot ? '一手中签率' : '公开认购'}</Eyebrow>
        <div style={{ marginTop: 3 }}>
          {isAllot
            ? <Mono color={live.oneLotRate >= 50 ? 'var(--green-600)' : 'var(--honey-700)'}>{live.oneLotRate}%</Mono>
            : <SubPill x={live.subPublic} />}
        </div>
        <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>
          {isAllot ? `回拨 ${live.clawbackApplied}` : live.subPublic != null ? '国际 ' + (live.subIntl ?? '—') + '×' : '—'}
        </div>
      </div>
      {/* sentiment + score */}
      <div>
        <Eyebrow>情绪 · 评分</Eyebrow>
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <PBadge tone={SENTIMENT_TONE[ipo.sentiment]} size="sm" dot>{SENTIMENT_LABEL[ipo.sentiment].split(' ')[0]}</PBadge>
          <Mono color="var(--honey-700)">{ipo.score}</Mono>
        </div>
      </div>
      {/* compare toggle */}
      <button onClick={e => { e.stopPropagation(); toggleCompare(ipo.id); }} title="加入对比" style={{
        justifySelf: 'center', width: 30, height: 30, borderRadius: 'var(--radius-md)', cursor: 'pointer',
        border: '1px solid ' + (inCompare ? 'var(--violet-500)' : 'var(--border-default)'),
        background: inCompare ? 'var(--violet-50)' : 'var(--surface-card)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={inCompare ? 'check' : 'git-compare'} size={15} color={inCompare ? 'var(--violet-600)' : 'var(--text-subtle)'} />
      </button>
      <Icon name="chevron-right" size={18} style={{ justifySelf: 'end', color: 'var(--text-subtle)' }} />
    </div>
  );
}

function PipelineView({ openIpo, compareIds, toggleCompare, go }) {
  useLucide();
  const [stage, setStage] = React.useState('all');
  const [sector, setSector] = React.useState('all');
  const [sort, setSort] = React.useState('sub');
  const [q, setQ] = React.useState('');

  let rows = IPOS.filter(i =>
    (stage === 'all' || i.stage === stage) &&
    (sector === 'all' || i.sector === sector) &&
    (!q || (i.name + i.cn + i.ticker).toLowerCase().includes(q.toLowerCase())));
  rows = rows.slice().sort((a, b) => {
    if (sort === 'sub') return (b.live.subPublic ?? -1) - (a.live.subPublic ?? -1);
    if (sort === 'score') return b.score - a.score;
    if (sort === 'raise') return parseFloat(b.terms.raiseHKD) - parseFloat(a.terms.raiseHKD) || 0;
    return 0;
  });

  return (
    <main style={{ ...SHELL, padding: '32px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <Eyebrow style={{ marginBottom: 8 }}>港股 IPO · HKEX Research Pipeline</Eyebrow>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--ink-800)', letterSpacing: 'var(--tracking-tight)' }}>IPO 研究工作台</h1>
          <p style={{ margin: '8px 0 0', fontSize: 'var(--text-base)', color: 'var(--text-muted)', maxWidth: 560, lineHeight: 1.6 }}>按 IPO 生命周期追踪招股、暗盘、分配与禁售；所有数字均带 <Mono size="var(--text-xs)" color="var(--text-body)">as_of</Mono> 与数据版本。</p>
        </div>
        <PBtn variant="ai" icon={<Icon name="git-compare" size={16} />} onClick={() => go('compare')}>横向比较 {compareIds.length}/5</PBtn>
      </div>

      <StageRail active={stage} setActive={setStage} />
      <FilterBar sector={sector} setSector={setSector} sort={sort} setSort={setSort} q={q} setQ={setQ} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>共 <Mono size="var(--text-sm)">{rows.length}</Mono> 个标的{stage !== 'all' ? ` · ${STAGE_BY[stage].label}` : ''}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>点击行查看研究工作台 · <Icon name="git-compare" size={12} /> 加入对比</span>
      </div>

      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {rows.length ? rows.map(ipo => (
          <IpoRow key={ipo.id} ipo={ipo} openIpo={openIpo} inCompare={compareIds.includes(ipo.id)} toggleCompare={toggleCompare} />
        )) : (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface-card)' }}>
            <Icon name="search-x" size={28} color="var(--text-subtle)" />
            <p style={{ margin: '10px 0 0', fontSize: 'var(--text-sm)' }}>该筛选下暂无标的，换个条件试试。</p>
          </div>
        )}
      </div>
    </main>
  );
}

Object.assign(window, { PipelineView, offerText });
