/* ============================================================
   Netquity 数据工作台 — shell：权限语法 + AI 阅读原语
   ============================================================ */
const NQDS = window.AiphaBeeDesignSystem_599c13;
const { Badge: NqBadge, Button: NqButton } = NQDS;
const NQ_MASCOT = '../../assets/mascot';

/* ---------- Lucide ---------- */
function NqIcon({ name, size = 18, color, style = {} }) {
  return (
    <span className="luc" style={{ display: 'inline-flex', lineHeight: 0, color, '--ic-size': size + 'px', ...style }}>
      <i data-lucide={name}></i>
    </span>
  );
}
function useNqLucide() {
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });
}

/* ---------- 小原语 ---------- */
function NqEyebrow({ children, style }) {
  return <div style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-subtle)', fontWeight: 600, ...style }}>{children}</div>;
}
function NqMono({ children, size = 'var(--text-sm)', color = 'var(--text-primary)', weight = 700, style }) {
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: size, fontWeight: weight, color, fontVariantNumeric: 'tabular-nums', ...style }}>{children}</span>;
}
const NQ_SHELL = { maxWidth: 'var(--container-max)', margin: '0 auto', width: '100%' };

function NqModule({ icon, title, en, right, children, pad = true, id, style }) {
  return (
    <section id={id} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', ...style }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {icon && <span style={{ display: 'inline-flex', width: 30, height: 30, borderRadius: 'var(--radius-md)', background: 'var(--surface-honey)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><NqIcon name={icon} size={16} color="var(--accent-strong)" /></span>}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{title}</div>
            {en && <NqEyebrow style={{ marginTop: 2 }}>{en}</NqEyebrow>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{right}</div>
      </header>
      <div style={{ padding: pad ? '18px 20px' : 0 }}>{children}</div>
    </section>
  );
}

/* ---------- 权限上下文 ---------- */
const NqRightsCtx = React.createContext({ plan: 'free', setPlan: () => {}, holdSim: true });
function useNqGate(key) {
  const { plan } = React.useContext(NqRightsCtx);
  return nqGate(key, plan);
}

/* ============================================================
   权限语法（一套贯穿全产品的四态视觉）
   available → 正常渲染
   locked    → 蜜色虚线锁扣（数据集 + 所需层级，点按解锁演示）
   denied    → 灰色实心 DATA_NOT_LICENSED，不可交互
   hold      → 橙色 DATA_QUALITY_HOLD，数值扣留 + 原因
   ============================================================ */

/* 行内值锁 */
function NqLockPill({ gateKey, inline }) {
  const g = useNqGate(gateKey);
  const { setPlan } = React.useContext(NqRightsCtx);
  const tierLabel = g.tier === 'enterprise' ? 'Enterprise' : 'Premium';
  return (
    <button onClick={() => setPlan(g.tier)} title={g.group.label + ' · ' + g.group.ds + ' · 需 ' + tierLabel + ' 授权'} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
      padding: inline ? '1px 8px' : '3px 10px', borderRadius: 'var(--radius-pill)',
      border: '1px dashed var(--honey-600)', background: 'var(--honey-50)',
      fontSize: 'var(--text-2xs)', fontWeight: 700, color: 'var(--accent-strong)', whiteSpace: 'nowrap',
    }}>
      <NqIcon name="lock" size={11} /> {tierLabel} 解锁
    </button>
  );
}

/* 行内拒绝（未获授权） */
function NqDeniedPill({ label, inline }) {
  return (
    <span title={(label ? label + ' · ' : '') + 'DATA_NOT_LICENSED：该字段未获分发授权'} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: inline ? '1px 8px' : '3px 10px',
      borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)',
      fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-subtle)', whiteSpace: 'nowrap', cursor: 'default',
    }}>
      <NqIcon name="ban" size={11} /> 未获授权
    </span>
  );
}

/* 行内质量保留 */
function NqHoldPill({ reason, inline }) {
  return (
    <span title={'DATA_QUALITY_HOLD：' + (reason || '供应商数据质量复核中，数值暂缓展示')} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: inline ? '1px 8px' : '3px 10px',
      borderRadius: 'var(--radius-pill)', border: '1px solid var(--orange-500)', background: 'var(--orange-50)',
      fontSize: 'var(--text-2xs)', fontWeight: 700, color: 'var(--orange-500)', whiteSpace: 'nowrap', cursor: 'default',
    }}>
      <NqIcon name="shield-alert" size={11} /> 质量保留
    </span>
  );
}

/* 行内门控值：可用时渲染 children，否则渲染对应态 */
function NqGateValue({ gateKey, children, inline = true }) {
  const g = useNqGate(gateKey);
  if (g.state === 'available') return <>{children}</>;
  if (g.state === 'denied') return <NqDeniedPill inline={inline} label={g.group.label} />;
  return <NqLockPill gateKey={gateKey} inline={inline} />;
}

/* 区块级锁面板：诚实的中间态 —— 说明里面有什么、缺什么授权 */
function NqLockedPanel({ gateKey, preview, style }) {
  const g = useNqGate(gateKey);
  const { setPlan } = React.useContext(NqRightsCtx);
  if (g.state === 'available') return null;
  const denied = g.state === 'denied';
  const tierLabel = g.tier === 'enterprise' ? 'Enterprise' : 'Premium';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
      borderRadius: 'var(--radius-lg)',
      border: denied ? '1px solid var(--border-subtle)' : '1px dashed var(--honey-600)',
      background: denied ? 'var(--surface-muted)' : 'var(--surface-honey)', ...style,
    }}>
      <span style={{ display: 'inline-flex', width: 38, height: 38, clipPath: 'var(--clip-hex)', background: denied ? 'var(--surface-track)' : 'var(--honey-200)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <NqIcon name={denied ? 'ban' : 'lock'} size={16} color={denied ? 'var(--text-subtle)' : 'var(--honey-800)'} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: denied ? 'var(--text-muted)' : 'var(--text-primary)' }}>
          {g.group.label} · {denied ? '未获分发授权' : '需要 ' + tierLabel + ' 授权'}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)', marginTop: 2, lineHeight: 1.5 }}>
          {denied
            ? <>该数据集的 Web 分发权限尚未获批（<NqMono size="var(--text-2xs)" color="var(--text-subtle)" weight={600}>DATA_NOT_LICENSED</NqMono>）。授权状态更新后自动开放，不提供任何替代或合成数值。</>
            : (preview || '字段已就绪，等待您的方案解锁；锁定状态下不展示任何合成占位数值。')}
        </div>
        <div style={{ marginTop: 4 }}>
          <NqMono size="var(--text-2xs)" color="var(--text-subtle)" weight={600}>{ev0(g)}</NqMono>
        </div>
      </div>
      {!denied && (
        <NqButton size="sm" onClick={() => setPlan(g.tier)} icon={<NqIcon name="unlock" size={14} />}>解锁 {tierLabel}</NqButton>
      )}
    </div>
  );
}
function ev0(g) { return g.group.ds + ' · channel=web · ' + (g.state === 'denied' ? 'DATA_NOT_LICENSED' : 'entitlement_required=' + g.tier); }

/* 质量保留：数值扣留行（fail closed，可见且优雅） */
function NqHoldValue({ reason, children }) {
  const { holdSim } = React.useContext(NqRightsCtx);
  if (!holdSim) return <>{children}</>;
  return <NqHoldPill reason={reason} inline />;
}

/* ---------- AI 阅读块（研究蜂：结论 + 证据 + 局限，绝不建议交易） ---------- */
function NqBeeRead({ gateKey, findings = [], limitation, methodology = 'm-nq-read-1', pose = 'insight' }) {
  const g = gateKey ? nqGate(gateKey, React.useContext(NqRightsCtx).plan) : { state: 'available' };
  return (
    <div style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--violet-50)', border: '1px solid var(--border-subtle)' }}>
      <span style={{ width: 44, height: 44, clipPath: 'var(--clip-hex)', background: 'var(--surface-card)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <img src={NQ_MASCOT + '/' + pose + '.png'} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', fontWeight: 700, color: 'var(--violet-600)' }}>AI 阅读 · 研究蜂</span>
          <NqMono size="var(--text-2xs)" color="var(--violet-600)" weight={600}>aiphabee_research · {methodology}</NqMono>
        </div>
        {g.state !== 'available' ? (
          <div style={{ marginTop: 6, fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            AI 阅读基于已授权字段生成；该数据集尚未解锁，研究蜂无可读取的输入。<span style={{ marginLeft: 6 }}>{g.state === 'locked' ? <NqLockPill gateKey={gateKey} inline /> : <NqDeniedPill inline />}</span>
          </div>
        ) : (
          <>
            <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
              {findings.map((f, i) => (
                <li key={i} style={{ display: 'flex', gap: 7, fontSize: 'var(--text-sm)', color: 'var(--text-body)', lineHeight: 1.6 }}>
                  <span style={{ width: 7, height: 7, clipPath: 'var(--clip-hex)', background: 'var(--violet-500)', marginTop: 7, flexShrink: 0 }}></span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 7, fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
              局限：{limitation || '摘要仅覆盖上表已授权字段，未读取任何锁定或保留数据。'} 本内容为研究性说明，不构成任何买卖建议。
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- 设计说明（rationale note，交付物附注） ---------- */
function NqRationale({ children }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-subtle)' }}>
        <NqIcon name="pen-tool" size={13} /> 设计说明 · Rationale
        <span style={{ marginLeft: 'auto', display: 'inline-flex', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--duration-fast) var(--ease-standard)' }}><NqIcon name="chevron-down" size={13} /></span>
      </button>
      {open && <div style={{ padding: '0 14px 12px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.7 }}>{children}</div>}
    </div>
  );
}

/* ---------- 顶部导航 ---------- */
function NqNav({ view, go }) {
  const { plan } = React.useContext(NqRightsCtx);
  const link = (v, label) => (
    <button onClick={() => go(v)} style={{
      background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)', fontWeight: 600, padding: '4px 2px',
      color: view === v ? 'var(--text-primary)' : 'var(--text-muted)',
      borderBottom: view === v ? '2px solid var(--honey-500)' : '2px solid transparent',
    }}>{label}</button>
  );
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 'var(--z-sticky)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-nav)', backdropFilter: 'blur(10px)' }}>
      <div style={{ ...NQ_SHELL, padding: '0 24px', height: 'var(--nav-height)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <button onClick={() => go('search')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
          <img src="../../assets/aiphabee-mascot.png" alt="AiphaBee" style={{ height: 34, width: 'auto', clipPath: 'var(--clip-hex)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)' }}>AiphaBee</span>
          <NqBadge tone="navy" variant="soft" size="sm">港股数据</NqBadge>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          {link('search', '证券搜索')}
          {link('stock', '个股工作台')}
          {link('quotes', '市场行情')}
          {link('market', '全市场披露')}
          {link('specimens', '状态规范')}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-default)', background: 'var(--surface-card)', fontSize: 'var(--text-xs)', fontWeight: 700, color: plan === 'free' ? 'var(--text-muted)' : 'var(--accent-strong)' }}>
            <NqIcon name={plan === 'free' ? 'lock' : 'unlock'} size={13} />
            {plan === 'free' ? 'Free' : plan === 'premium' ? 'Premium' : 'Enterprise'}
          </span>
        </div>
      </div>
    </nav>
  );
}

Object.assign(window, {
  NqIcon, useNqLucide, NqEyebrow, NqMono, NQ_SHELL, NqModule,
  NqRightsCtx, useNqGate,
  NqLockPill, NqDeniedPill, NqHoldPill, NqGateValue, NqLockedPanel, NqHoldValue,
  NqBeeRead, NqRationale, NqNav, NQ_MASCOT, NqBadge, NqButton,
});
