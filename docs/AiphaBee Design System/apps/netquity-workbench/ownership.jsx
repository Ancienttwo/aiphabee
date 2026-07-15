/* ============================================================
   (d) 股权与流通结构 — 两个方向：A 蜂巢结构图 / B 分层持股表
   ============================================================ */

const NQ_HOLDER_COLOR = { insider: 'var(--honey-500)', institution: 'var(--blue-500)', public: 'var(--neutral-300)' };
const NQ_HOLDER_KIND = { insider: '内部人/信托', institution: '机构', public: '公众' };

function NqOwnershipView({ direction, setDirection }) {
  useNqLucide();
  const sum = useNqGate('own_summary');
  const graph = useNqGate('own_graph');

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {sum.state !== 'available' && <NqLockedPanel gateKey="own_summary" preview="已发行股本、库存股、自由流通比例与 5% 以上持有人构成已就绪。" />}

      <div className="ab-split" style={{ gap: 16, alignItems: 'start' }}>
        {/* 左：股本与持有人 */}
        <div style={{ display: 'grid', gap: 16 }}>
          <NqModule icon="pie-chart" title="股本与流通" en="Share capital & float">
            <div className="ab-grid-2" style={{ gap: 10 }}>
              {[
                ['已发行股份', <NqGateValue gateKey="own_summary" key="1"><NqMono>{NQ_OWNERSHIP.issuedShares}</NqMono></NqGateValue>],
                ['库存股', <NqGateValue gateKey="own_summary" key="2"><NqMono>{NQ_OWNERSHIP.treasuryShares}</NqMono></NqGateValue>],
                ['面值', <NqGateValue gateKey="own_summary" key="3"><span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>{NQ_OWNERSHIP.parValue}</span></NqGateValue>],
                ['自由流通比例', <NqGateValue gateKey="own_summary" key="4"><NqMono color="var(--accent-strong)">{NQ_OWNERSHIP.freeFloatPct}%</NqMono></NqGateValue>],
              ].map(([k, v], i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 'var(--text-base)' }}>{v}</div>
                </div>
              ))}
            </div>

            {sum.state === 'available' && (
              <div style={{ marginTop: 16 }}>
                <NqEyebrow style={{ marginBottom: 8 }}>持有人构成（好仓申报口径）</NqEyebrow>
                <div style={{ display: 'flex', height: 14, borderRadius: 'var(--radius-pill)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }} aria-hidden="true">
                  {NQ_OWNERSHIP.holders.map(h => (
                    <span key={h.name} title={h.name + ' · ' + h.pct + '%'} style={{ width: h.pct + '%', background: NQ_HOLDER_COLOR[h.kind] }}></span>
                  ))}
                </div>
                <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                  {NQ_OWNERSHIP.holders.map(h => (
                    <div key={h.name} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ width: 9, height: 9, clipPath: 'var(--clip-hex)', background: NQ_HOLDER_COLOR[h.kind], flexShrink: 0, alignSelf: 'center' }}></span>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)', minWidth: 0, flex: 1 }}>{h.name}</span>
                      <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>{NQ_HOLDER_KIND[h.kind]}</span>
                      <NqMono weight={700}>{h.pct.toFixed(2)}%</NqMono>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </NqModule>

          <NqBeeRead
            gateKey="own_summary"
            methodology="m-nq-own-1"
            findings={[
              '控股家族信托合计 30.17%，叠加机构披露持仓后，自由流通比例约 64.2%——处于恒指成分股常见区间。',
              '库存股 1,250 万股来自近期回购未注销部分；若全部注销，各持有人比例将被动上移约 0.3 个百分点。',
            ]}
            limitation="持有人构成基于 SDI 申报口径，低于 5% 的未申报机构归入汇总项。"
          />
        </div>

        {/* 右：结构视图（两个方向） */}
        <div style={{ display: 'grid', gap: 16 }}>
          <NqModule
            icon="network" title="上市公司交叉持股" en="Cross-holdings structure"
            right={
              <>
                <span style={{ display: 'inline-flex', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                  {[['hex', '方案 A · 蜂巢图'], ['ladder', '方案 B · 分层表']].map(([k, label]) => (
                    <button key={k} onClick={() => setDirection(k)} style={{
                      padding: '4px 12px', border: 'none', cursor: 'pointer', fontSize: 'var(--text-2xs)', fontWeight: 700,
                      background: direction === k ? 'var(--honey-500)' : 'var(--surface-card)',
                      color: direction === k ? 'var(--text-on-honey)' : 'var(--text-muted)',
                    }}>{label}</button>
                  ))}
                </span>
              </>
            }>
            {graph.state !== 'available'
              ? <NqLockedPanel gateKey="own_graph" preview="长和系 4 层上市公司持股链（00001 → 01038 → 00006 → 02638）已就绪。交叉持股结构属 Enterprise 数据域。" style={{ border: 'none', background: 'var(--surface-sunken)' }} />
              : direction === 'hex' ? <NqOwnHexGraph /> : <NqOwnLadder />}
          </NqModule>

          <NqRationale>
            <strong>(d) 股权结构 · 两个方向。</strong>方案 A（蜂巢图）把品牌的六边形语言变成信息载体：每家上市公司一枚蜂巢节点，持股比例标注在连线上；顶部的信托层以灰色虚线幽灵节点呈现——它真实存在但不在授权数据集内，图上直接写明缺口，而不是假装结构完整。方案 B（分层表）服务惯用 terminal 的用户：缩进阶梯 + 单调等宽数字，可扫读、可复制。两案共用同一门控（Enterprise），切换只改表现层。选择建议：A 作默认讲解视图，B 作专业密度视图。
          </NqRationale>
        </div>
      </div>
    </div>
  );
}

/* ---------- 方案 A：蜂巢结构图（SVG） ---------- */
function NqOwnHexGraph() {
  const nodes = [
    { id: 'trust', x: 300, y: 46, name: '家族信托层', sub: '非上市 · 数据集外', ghost: true },
    { id: 'a', x: 300, y: 150, symbol: '00001', name: '长和' },
    { id: 'b', x: 300, y: 260, symbol: '01038', name: '长江基建' },
    { id: 'c', x: 140, y: 370, symbol: '00006', name: '电能实业' },
    { id: 'd', x: 460, y: 370, symbol: '02638', name: '港灯-SS' },
  ];
  const hex = (cx, cy, r) => {
    const pts = [];
    for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 90); pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); }
    return pts.join(' ');
  };
  const edge = (x1, y1, x2, y2, label, dashed) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return (
      <g key={label + x2}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={dashed ? 'var(--border-strong)' : 'var(--ink-600)'} strokeWidth="1.5" strokeDasharray={dashed ? '5 5' : 'none'} />
        <rect x={mx - 34} y={my - 11} width="68" height="22" rx="11" fill="var(--surface-card)" stroke="var(--border-subtle)" />
        <text x={mx} y={my + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight="700" fill={dashed ? 'var(--text-subtle)' : 'var(--text-primary)'}>{label}</text>
      </g>
    );
  };
  return (
    <div>
      <svg viewBox="0 0 600 440" style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="长和系交叉持股结构图">
        {edge(300, 78, 300, 118, '未获授权', true)}
        {edge(300, 182, 300, 228, '75.67%')}
        {edge(272, 288, 168, 340, '35.96%')}
        {NQ_OWNERSHIP.chain[2] && edge(428, 340, 188, 384, '33.37%', false)}
        {nodes.map(n => (
          <g key={n.id}>
            <polygon points={hex(n.x, n.y, n.ghost ? 30 : 34)}
              fill={n.ghost ? 'var(--surface-muted)' : n.id === 'a' ? 'var(--ink-800)' : 'var(--surface-honey)'}
              stroke={n.ghost ? 'var(--border-strong)' : n.id === 'a' ? 'var(--ink-800)' : 'var(--honey-600)'}
              strokeWidth="1.5" strokeDasharray={n.ghost ? '4 4' : 'none'} />
            {n.symbol && <text x={n.x} y={n.y - 1} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fontWeight="700" fill={n.id === 'a' ? 'var(--honey-500)' : 'var(--honey-800)'}>{n.symbol}</text>}
            {n.ghost && <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text-subtle)">信托</text>}
            <text x={n.x} y={n.y + (n.ghost ? 48 : 52)} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--text-primary)">{n.name}</text>
            {n.sub && <text x={n.x} y={n.y + 62} textAnchor="middle" fontSize="10" fill="var(--text-subtle)">{n.sub}</text>}
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, clipPath: 'var(--clip-hex)', background: 'var(--ink-800)' }}></span> 当前证券</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, clipPath: 'var(--clip-hex)', background: 'var(--surface-honey)', border: '1px solid var(--honey-600)' }}></span> 上市公司（数据集内）</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, clipPath: 'var(--clip-hex)', background: 'var(--surface-muted)', border: '1px dashed var(--border-strong)' }}></span> 非上市层 · 已知缺口</span>
      </div>
    </div>
  );
}

/* ---------- 方案 B：分层持股表 ---------- */
function NqOwnLadder() {
  const rows = [
    { depth: 0, name: '家族信托层（非上市）', symbol: null, pct: null, ghost: true },
    { depth: 1, name: '长和', symbol: '00001.HK', pct: null, self: true },
    { depth: 2, name: '长江基建集团', symbol: '01038.HK', pct: 75.67 },
    { depth: 3, name: '电能实业', symbol: '00006.HK', pct: 35.96 },
    { depth: 4, name: '港灯-SS', symbol: '02638.HK', pct: 33.37 },
  ];
  return (
    <div>
      <div style={{ display: 'flex', padding: '6px 4px', borderBottom: '1px solid var(--border-default)' }}>
        <NqEyebrow style={{ flex: 1 }}>层级 · 公司</NqEyebrow>
        <NqEyebrow>上层直接持股</NqEyebrow>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', borderBottom: '1px solid var(--border-subtle)', opacity: r.ghost ? 0.65 : 1 }}>
          <span style={{ width: r.depth * 22, flexShrink: 0, display: 'inline-flex', justifyContent: 'flex-end' }} aria-hidden="true">
            {r.depth > 0 && <span style={{ width: 14, height: 14, borderLeft: '1.5px solid var(--border-strong)', borderBottom: '1.5px solid var(--border-strong)', borderBottomLeftRadius: 6, marginBottom: 6 }}></span>}
          </span>
          <span style={{ width: 12, height: 12, clipPath: 'var(--clip-hex)', flexShrink: 0, background: r.ghost ? 'var(--surface-track)' : r.self ? 'var(--ink-800)' : 'var(--honey-500)' }}></span>
          <span style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: r.ghost ? 'var(--text-subtle)' : 'var(--text-primary)' }}>{r.name}</span>
            {r.symbol && <NqMono size="var(--text-2xs)" weight={600} color="var(--text-subtle)">{r.symbol}</NqMono>}
          </span>
          {r.ghost ? <NqDeniedPill label="非上市层" inline />
            : r.pct == null ? <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>当前证券</span>
            : <NqMono weight={700}>{r.pct.toFixed(2)}%</NqMono>}
        </div>
      ))}
      <div style={{ marginTop: 8, fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
        仅覆盖上市公司之间的直接持股边；间接合计持股为派生数，另行标注方法后才展示。
      </div>
    </div>
  );
}

Object.assign(window, { NqOwnershipView, NqOwnHexGraph, NqOwnLadder });
