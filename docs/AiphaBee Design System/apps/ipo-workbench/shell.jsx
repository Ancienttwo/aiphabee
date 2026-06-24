/* ============================================================
   AiphaBee IPO 研究工作台 — app shell + shared atoms
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
function useLucide() {
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });
}

/* ---------- Evidence / data-version chip (recurring) ---------- */
function EvidenceChip({ ev, compact }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button onClick={() => setOpen(o => !o)} onBlur={() => setTimeout(() => setOpen(false), 120)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        padding: compact ? '3px 8px' : '5px 10px', borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--border-subtle)', background: 'var(--surface-card)',
        fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap',
      }}>
        <Icon name="shield-check" size={12} color="var(--green-600)" />
        as of {ev.asOf.split(' ').slice(0, 3).join(' ')}
        <Icon name="chevron-down" size={11} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 'var(--z-dropdown)',
          width: 280, padding: 14, borderRadius: 'var(--radius-lg)', background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)', textAlign: 'left',
        }}>
          <div style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-subtle)', marginBottom: 10 }}>证据与数据版本 Evidence</div>
          {[
            ['as_of', ev.asOf], ['data_version', ev.dataVersion],
            ['methodology', ev.methodology], ['source', ev.source],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0', borderTop: '1px solid var(--surface-muted)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>{k}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-body)', textAlign: 'right', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
            所有数字均带来源与版本，default-deny；未授权字段不展示。
          </div>
        </div>
      )}
    </span>
  );
}

/* ---------- Module card with header (left-column workbench blocks) ---------- */
function Module({ icon, title, en, right, children, pad = true, id }) {
  return (
    <section id={id} style={{
      background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
    }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {icon && <span style={{ display: 'inline-flex', width: 30, height: 30, borderRadius: 'var(--radius-md)', background: 'var(--surface-honey)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={16} color="var(--honey-700)" /></span>}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{title}</div>
            {en && <div style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-subtle)', marginTop: 2 }}>{en}</div>}
          </div>
        </div>
        {right}
      </header>
      <div style={{ padding: pad ? '18px 20px' : 0 }}>{children}</div>
    </section>
  );
}

/* small uppercase eyebrow */
function Eyebrow({ children, style }) {
  return <div style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-subtle)', fontWeight: 600, ...style }}>{children}</div>;
}

/* mono stat */
function Mono({ children, size = 'var(--text-sm)', color = 'var(--text-primary)', weight = 700 }) {
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: size, fontWeight: weight, color, fontVariantNumeric: 'tabular-nums' }}>{children}</span>;
}

/* sub-multiple pill colored by demand */
function SubPill({ x, suffix = '×', label }) {
  if (x == null) return <span style={{ color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>—</span>;
  const tone = demandTone(x);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
      <Mono color={tone} weight={700}>{x.toLocaleString()}{suffix}</Mono>
      {label && <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>{label}</span>}
    </span>
  );
}

const SHELL = { maxWidth: 'var(--container-max)', margin: '0 auto', width: '100%' };

/* ---------- Plan context (field authorization / default-deny demo) ---------- */
const PlanCtx = React.createContext({ plan: 'free', setPlan: () => {} });
const VENDOR_PROVENANCE = 'netquity_hk_ipo';
const RESEARCH_SOURCE = 'aiphabee_research';

/* Gated value — sensitive vendor field, blocked unless plan authorizes. */
function LockedValue({ children, tier = 'premium', inline }) {
  const { plan, setPlan } = React.useContext(PlanCtx);
  const ok = plan === 'premium';
  if (ok) return <>{children}</>;
  return (
    <button onClick={() => setPlan('premium')} title={`${tier} 解锁`} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
      padding: inline ? '1px 7px' : '3px 9px', borderRadius: 'var(--radius-pill)',
      border: '1px dashed var(--violet-500)', background: 'var(--violet-50)',
      fontFamily: 'var(--font-sans)', fontSize: 'var(--text-2xs)', fontWeight: 700, color: 'var(--violet-600)', whiteSpace: 'nowrap',
    }}>
      <Icon name="lock" size={11} color="var(--violet-600)" /> {tier === 'enterprise' ? 'Enterprise' : 'Premium'} 解锁
    </button>
  );
}

/* ---------- Top navigation ---------- */
function NavBar({ view, go, compareCount, plan, setPlan }) {
  const link = (v, label) => (
    <button onClick={() => go(v)} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 600,
      color: view === v ? 'var(--ink-800)' : 'var(--text-muted)',
      borderBottom: view === v ? '2px solid var(--honey-500)' : '2px solid transparent',
      padding: '4px 2px',
    }}>{label}</button>
  );
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 'var(--z-sticky)', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(10px)' }}>
      <div style={{ ...SHELL, padding: '0 24px', height: 'var(--nav-height)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => go('pipeline')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
          <img src={LOGO} alt="AiphaBee" style={{ height: 38, width: 'auto' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--ink-800)', letterSpacing: 'var(--tracking-tight)' }}>IPO&nbsp;Workbench</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {link('pipeline', 'Pipeline')}
          {link('calendar', 'Calendar')}
          {link('compare', 'Compare')}
          <button onClick={() => setPlan(plan === 'premium' ? 'free' : 'premium')} title="切换权限等级（演示字段默认拒绝）" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '5px 11px',
            borderRadius: 'var(--radius-pill)', border: '1px solid ' + (plan === 'premium' ? 'var(--violet-500)' : 'var(--border-default)'),
            background: plan === 'premium' ? 'var(--violet-50)' : 'var(--surface-card)',
            fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: 700, color: plan === 'premium' ? 'var(--violet-600)' : 'var(--text-muted)',
          }}>
            <Icon name={plan === 'premium' ? 'unlock' : 'lock'} size={13} /> {plan === 'premium' ? 'Premium' : 'Free'} plan
          </button>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <Button size="sm" variant="ai" icon={<Icon name="git-compare" size={15} />} onClick={() => go('compare')}>对比清单</Button>
            {compareCount > 0 && <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 'var(--radius-pill)', background: 'var(--honey-500)', color: 'var(--ink-800)', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>{compareCount}</span>}
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ---------- Root app ---------- */
function App() {
  const [view, setView] = React.useState('pipeline');
  const [selected, setSelected] = React.useState(IPOS[0]);
  const [compareIds, setCompareIds] = React.useState(['honeycomb', 'lotus', 'apex']);
  const [plan, setPlan] = React.useState('free');
  useLucide();

  const go = (v) => { setView(v); window.scrollTo(0, 0); };
  const openIpo = (ipo) => { setSelected(ipo); go('detail'); };
  const toggleCompare = (id) => setCompareIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : ids.length >= 5 ? ids : [...ids, id]);

  return (
    <PlanCtx.Provider value={{ plan, setPlan }}>
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)', fontFamily: 'var(--font-sans)' }}>
      <NavBar view={view} go={go} compareCount={compareIds.length} plan={plan} setPlan={setPlan} />
      {view === 'pipeline' && <PipelineView openIpo={openIpo} compareIds={compareIds} toggleCompare={toggleCompare} go={go} />}
      {view === 'calendar' && <CalendarView openIpo={openIpo} go={go} />}
      {view === 'detail' && <DetailView ipo={selected} go={go} openIpo={openIpo} compareIds={compareIds} toggleCompare={toggleCompare} />}
      {view === 'compare' && <CompareView compareIds={compareIds} setCompareIds={setCompareIds} toggleCompare={toggleCompare} openIpo={openIpo} go={go} />}
    </div>
    </PlanCtx.Provider>
  );
}

Object.assign(window, { Icon, useLucide, EvidenceChip, Module, Eyebrow, Mono, SubPill, SHELL, NavBar, App, PlanCtx, LockedValue, VENDOR_PROVENANCE, RESEARCH_SOURCE });
