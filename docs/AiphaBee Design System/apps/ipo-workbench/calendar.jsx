/* ============================================================
   AiphaBee IPO 研究工作台 — IPO 日历 /calendar
   跨所有活跃 IPO 的招股时间表里程碑（event-timeline）按日 agenda
   ============================================================ */
const _CalDS = window.AiphaBeeDesignSystem_599c13;
const { Badge: CalBadge } = _CalDS;

const EVENT_CFG = {
  open:     { label: '公开发售开始', en: 'Offer Opens', icon: 'play', tone: 'honey' },
  close:    { label: '公开发售截止', en: 'Offer Closes', icon: 'flag', tone: 'honey' },
  price:    { label: '定价', en: 'Pricing', icon: 'tag', tone: 'info' },
  allot:    { label: '公布分配', en: 'Allotment', icon: 'check-check', tone: 'bullish' },
  grey:     { label: '暗盘交易', en: 'Grey Market', icon: 'activity', tone: 'info' },
  list:     { label: '上市', en: 'Listing', icon: 'rocket', tone: 'bullish' },
  file:     { label: '递交申请', en: 'Filing', icon: 'file-text', tone: 'neutral' },
  hearing:  { label: '通过聆讯', en: 'Hearing', icon: 'gavel', tone: 'neutral' },
  roadshow: { label: '路演', en: 'Roadshow', icon: 'presentation', tone: 'neutral' },
  ref:      { label: '参考价', en: 'Ref Price', icon: 'tag', tone: 'info' },
  withdraw: { label: '撤回上市', en: 'Withdrawn', icon: 'x-circle', tone: 'bearish' },
};
const TONE_COLOR = { honey: 'var(--honey-600)', info: 'var(--blue-500)', bullish: 'var(--green-600)', bearish: 'var(--red-500)', neutral: 'var(--neutral-500)' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* parse "Jun 18 09:00" → { key:'Jun 18', sort: 618, day:'18', mon:'Jun', time:'09:00' } */
function parseAt(at) {
  const m = /^([A-Z][a-z]{2})\s+(\d{1,2})(?:\s+(\d{1,2}:\d{2}))?/.exec(at);
  if (!m) return null;
  const mi = MONTHS.indexOf(m[1]);
  return { key: `${m[1]} ${m[2]}`, sort: (mi + 1) * 100 + parseInt(m[2]), day: m[2], mon: m[1], time: m[3] || null };
}

function CalendarView({ openIpo, go }) {
  useLucide();
  const [filter, setFilter] = React.useState('all');

  // collect dated events
  const all = [];
  IPOS.forEach(ipo => (ipo.timetable || []).forEach(e => {
    const d = parseAt(e.at);
    if (d) all.push({ ipo, e, d });
  }));
  const shown = all.filter(x => filter === 'all' || x.e.type === filter);
  // group by date key
  const groups = {};
  shown.forEach(x => { (groups[x.d.key] ||= { sort: x.d.sort, items: [] }).items.push(x); });
  const orderedKeys = Object.keys(groups).sort((a, b) => groups[a].sort - groups[b].sort);

  const types = ['all', ...Array.from(new Set(all.map(x => x.e.type)))];

  return (
    <main style={{ ...SHELL, padding: '32px 24px 80px' }}>
      <Eyebrow style={{ marginBottom: 8 }}>招股时间表 · IPO Calendar</Eyebrow>
      <h1 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--ink-800)', letterSpacing: 'var(--tracking-tight)' }}>IPO 日历</h1>
      <p style={{ margin: '0 0 22px', fontSize: 'var(--text-base)', color: 'var(--text-muted)' }}>跨全部活跃 IPO 的关键里程碑：招股、定价、分配、暗盘、上市、撤回。数据源 <Mono size="var(--text-xs)" color="var(--text-body)">ipo_timetable_event</Mono>。</p>

      {/* type filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 26 }}>
        {types.map(ty => {
          const on = filter === ty;
          const cfg = ty === 'all' ? null : EVENT_CFG[ty];
          return (
            <button key={ty} onClick={() => setFilter(ty)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
              border: '1px solid ' + (on ? 'var(--honey-500)' : 'var(--border-default)'),
              background: on ? 'var(--honey-500)' : 'var(--surface-card)',
              fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 600,
              color: on ? 'var(--ink-800)' : 'var(--text-body)',
            }}>
              {cfg && <Icon name={cfg.icon} size={13} color={on ? 'var(--ink-800)' : TONE_COLOR[cfg.tone]} />}
              {ty === 'all' ? '全部里程碑' : cfg.label}
            </button>
          );
        })}
      </div>

      {/* agenda */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {orderedKeys.map(key => {
          const g = groups[key];
          const [mon, day] = key.split(' ');
          return (
            <div key={key} style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: 18, alignItems: 'start' }}>
              {/* date rail */}
              <div style={{ position: 'sticky', top: 80, textAlign: 'center', padding: '12px 0', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--honey-700)', fontWeight: 700 }}>{mon}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--ink-800)', lineHeight: 1.1 }}>{day}</div>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>{g.items.length} 事件</div>
              </div>
              {/* events */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {g.items.sort((a, b) => (a.d.time || '').localeCompare(b.d.time || '')).map((x, i) => {
                  const cfg = EVENT_CFG[x.e.type];
                  return (
                    <button key={i} onClick={() => openIpo(x.ipo)} style={{
                      display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', cursor: 'pointer',
                      padding: '14px 18px', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
                      borderLeft: '3px solid ' + TONE_COLOR[cfg.tone], borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
                    }}>
                      <span style={{ display: 'inline-flex', width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--surface-muted)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name={cfg.icon} size={17} color={TONE_COLOR[cfg.tone]} />
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{cfg.label}</span>
                          <Eyebrow>{cfg.en}</Eyebrow>
                          {x.e.active && <CalBadge tone="honey" size="sm">进行中</CalBadge>}
                        </div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
                          {x.ipo.name} <span style={{ color: 'var(--text-subtle)' }}>{x.ipo.cn}</span> · <Mono size="var(--text-xs)" color="var(--text-body)">{x.ipo.ticker}</Mono>
                        </div>
                      </div>
                      {x.d.time && <Mono size="var(--text-sm)" color="var(--text-body)">{x.d.time}</Mono>}
                      <Icon name="chevron-right" size={16} style={{ color: 'var(--text-subtle)' }} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

Object.assign(window, { CalendarView });
