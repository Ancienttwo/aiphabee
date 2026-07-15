/* ============================================================
   Netquity 数据工作台 — 根应用：视图路由 + 全局权限 + Tweaks
   ============================================================ */

const NQ_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "plan": "premium",
  "dark": false,
  "holdSim": true,
  "udConv": "hk"
}/*EDITMODE-END*/;

const NQ_TABS = [
  { key: 'quote', label: '行情概览', icon: 'activity', gate: 'price' },
  { key: 'directors', label: '董事高管', icon: 'users', gate: 'dir_bio' },
  { key: 'sdi', label: '权益披露', icon: 'file-search', gate: 'sdi_stock' },
  { key: 'ownership', label: '股权结构', icon: 'network', gate: 'own_summary' },
  { key: 'events', label: '公司事件', icon: 'calendar-days', gate: 'events' },
  { key: 'financials', label: '财务报表', icon: 'table-2', gate: 'fin' },
  { key: 'warrants', label: '轮证', icon: 'candlestick-chart', gate: 'warrants' },
  { key: 'industry', label: '同业比较', icon: 'columns-3', gate: 'price' },
];

function NqStockView({ tab, setTab, go }) {
  const { plan } = React.useContext(NqRightsCtx);
  const [ownDirection, setOwnDirection] = React.useState('hex');
  const total = Object.keys(NQ_GROUPS).length;
  const authorized = Object.keys(NQ_GROUPS).filter(k => nqGate(k, plan).state === 'available').length;

  return (
    <main style={{ ...NQ_SHELL, padding: '28px 24px 72px' }}>
      {/* 公司头部 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ width: 46, height: 46, clipPath: 'var(--clip-hex)', background: 'var(--ink-800)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <NqMono size="var(--text-2xs)" color="var(--honey-500)">00001</NqMono>
        </span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)' }}>{NQ_STOCK.nameZh}</h1>
            <NqMono size="var(--text-base)" weight={600} color="var(--text-muted)">{NQ_STOCK.symbol}</NqMono>
            <NqBadge tone="bullish" variant="soft" size="sm" dot dotShape="hex">上市</NqBadge>
            <NqBadge tone="navy" variant="soft" size="sm">{NQ_STOCK.industry}</NqBadge>
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginTop: 3 }}>
            {NQ_STOCK.nameEn} · 上市 {NQ_STOCK.listedAt} · {NQ_STOCK.exchange}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <span style={{ display: 'inline-flex', gap: 3 }} aria-hidden="true">
              {Object.keys(NQ_GROUPS).map(k => {
                const s = nqGate(k, plan).state;
                return <span key={k} title={NQ_GROUPS[k].label + ' · ' + s} style={{ width: 9, height: 9, clipPath: 'var(--clip-hex)', background: s === 'available' ? 'var(--green-500)' : s === 'denied' ? 'var(--surface-track)' : 'var(--honey-400)' }}></span>;
              })}
            </span>
            <NqMono size="var(--text-xs)" weight={700} color="var(--text-muted)">{authorized}/{total}</NqMono>
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginTop: 3 }}>已授权数据域 · 绿=可用 蜜=可解锁 灰=未授权</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '20px 0 18px' }}>
        {NQ_TABS.map(t => {
          const active = tab === t.key;
          const g = nqGate(t.gate, plan);
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 600, whiteSpace: 'nowrap',
              border: '1px solid ' + (active ? 'var(--honey-500)' : 'var(--border-subtle)'),
              background: active ? 'var(--honey-500)' : 'var(--surface-card)',
              color: active ? 'var(--text-on-honey)' : 'var(--text-body)',
            }}>
              <NqIcon name={t.icon} size={14} />
              {t.label}
              {g.state !== 'available' && <NqIcon name={g.state === 'denied' ? 'ban' : 'lock'} size={11} color={active ? 'var(--text-on-honey)' : 'var(--text-subtle)'} />}
            </button>
          );
        })}
      </div>

      {tab === 'quote' && <NqQuoteView />}
      {tab === 'directors' && <div style={{ display: 'grid', gap: 16 }}><NqProfileCard /><NqDirectorsView /><NqCorpInfoCard /></div>}
      {tab === 'sdi' && <NqSdiStockPanel />}
      {tab === 'ownership' && <NqOwnershipView direction={ownDirection} setDirection={setOwnDirection} />}
      {tab === 'events' && <div style={{ display: 'grid', gap: 16 }}><NqEventsView /><NqEntitlementsModule /><NqBuybackModule /></div>}
      {tab === 'financials' && <NqFinancialsView />}
      {tab === 'warrants' && <NqWarrantsView />}
      {tab === 'industry' && <NqIndustryView />}

      <p style={{ margin: '28px 0 0', fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', lineHeight: 1.6, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
        AiphaBee 为研究工具，输出为发现、证据与局限，不构成任何证券买卖建议或投资意见。页面数值均为设计演示数据，非真实数据。供应商数据不作「已核证 / 实时 / 完整」声明。
      </p>
    </main>
  );
}

function NqApp() {
  const [t, setTweak] = useTweaks(NQ_TWEAK_DEFAULTS);
  const [view, setView] = React.useState('search');
  const [tab, setTab] = React.useState('quote');
  useNqLucide();

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.dark ? 'dark' : 'light');
  }, [t.dark]);

  const go = (v) => { setView(v); window.scrollTo(0, 0); };
  const openStock = (targetTab) => { if (targetTab) setTab(targetTab); go('stock'); };
  const setPlan = (p) => setTweak('plan', p);

  return (
    <NqRightsCtx.Provider value={{ plan: t.plan, setPlan, holdSim: t.holdSim, udConv: t.udConv }}>
      <div style={{ minHeight: '100vh', background: 'var(--surface-page)', fontFamily: 'var(--font-sans)' }}>
        <NqNav view={view} go={go} />
        {view === 'search' && <NqSearchView go={go} openStock={() => openStock('directors')} />}
        {view === 'stock' && <NqStockView tab={tab} setTab={setTab} go={go} />}
        {view === 'market' && <NqSdiMarketView openStock={openStock} />}
        {view === 'quotes' && <NqMarketQuotesView go={go} openStock={openStock} />}
        {view === 'specimens' && <NqSpecimensView />}

        <TweaksPanel>
          <TweakSection label="权限（默认拒绝）" />
          <TweakRadio label="账户方案" value={t.plan} options={['free', 'premium', 'enterprise']} onChange={v => setTweak('plan', v)} />
          <TweakToggle label="质量保留演示" value={t.holdSim} onChange={v => setTweak('holdSim', v)} />
          <TweakSection label="行情" />
          <TweakRadio label="涨跌颜色" value={t.udConv} options={['hk', 'us']} onChange={v => setTweak('udConv', v)} />
          <TweakSection label="主题" />
          <TweakToggle label="深色模式" value={t.dark} onChange={v => setTweak('dark', v)} />
        </TweaksPanel>
      </div>
    </NqRightsCtx.Provider>
  );
}

Object.assign(window, { NqApp, NqStockView });
