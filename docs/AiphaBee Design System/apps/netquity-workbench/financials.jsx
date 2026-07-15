/* ============================================================
   (f) 财务报表 — 多期年报/中报表格 + 上市前财务（Enterprise）
   ============================================================ */

function nqFinFmt(v, decimals = 0) {
  const fixed = v.toFixed(decimals);
  const [int, dec] = fixed.split('.');
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (dec ? '.' + dec : '');
}

function NqFinancialsView() {
  useNqLucide();
  const g = useNqGate('fin');
  const ipo = useNqGate('fin_ipo');

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {g.state !== 'available' && (
        <NqLockedPanel gateKey="fin" preview="FY2022–FY2025 年报及 1H2026 中报共 5 期报表已就绪，含重述口径标注。" />
      )}

      <NqModule icon="table-2" title="多期财务报表" en={'Financial statements · ' + NQ_FIN.standard + ' · ' + NQ_FIN.currency}
        pad={false}>
        {g.state !== 'available' ? (
          <div style={{ padding: '18px 20px' }}><NqSdiGhostRows n={5} /></div>
        ) : (
          <div className="ab-table-scroll">
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 20px', fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-subtle)', fontWeight: 600, borderBottom: '1px solid var(--border-default)', position: 'sticky', left: 0, background: 'var(--surface-card)' }}>科目</th>
                  {NQ_FIN.periods.map((p, i) => (
                    <th key={p} style={{ textAlign: 'right', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-default)', whiteSpace: 'nowrap' }}>
                      {p}{i === NQ_FIN.interimIdx && <span style={{ display: 'block', fontSize: 9, fontWeight: 600, color: 'var(--orange-500)', letterSpacing: 'var(--tracking-wide)' }}>未经审核</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NQ_FIN.rows.map((row, ri) => (
                  <tr key={row.label} style={{ background: ri % 2 ? 'var(--surface-sunken)' : 'transparent' }}>
                    <td style={{ padding: '9px 20px', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: ri % 2 ? 'var(--surface-sunken)' : 'var(--surface-card)' }}>{row.label}</td>
                    {row.values.map((v, ci) => {
                      const isInterim = ci === NQ_FIN.interimIdx;
                      const held = isInterim && row.holdTarget;
                      return (
                        <td key={ci} style={{ padding: '9px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {held
                            ? <NqHoldValue reason={row.holdReason}><NqMono weight={600}>{nqFinFmt(v, row.decimals || 0)}{row.pct ? '%' : ''}</NqMono></NqHoldValue>
                            : <NqMono weight={600} color={isInterim ? 'var(--text-muted)' : 'var(--text-primary)'}>{nqFinFmt(v, row.decimals || 0)}{row.pct ? '%' : ''}</NqMono>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 20px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>货币 {NQ_FIN.currency} · 准则 {NQ_FIN.standard} · 重述期以最新披露口径为准 · 演示数值</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>{NQ_FIN.ipoEra.label}</span>
                {ipo.state === 'available'
                  ? <NqBadge tone="honey" variant="soft" size="sm" icon={<NqIcon name="unlock" size={11} />}>已解锁 · {NQ_FIN.ipoEra.note}</NqBadge>
                  : <NqGateValue gateKey="fin_ipo"><span></span></NqGateValue>}
              </span>
            </div>
          </div>
        )}
      </NqModule>

      {/* 十年财务摘要 */}
      <NqModule icon="history" title="十年财务摘要" en="10-Year summary · HKDmn" pad={false}>
        {g.state !== 'available' ? (
          <div style={{ padding: '18px 20px' }}><NqSdiGhostRows n={4} /></div>
        ) : (
          <div>
            <NqFin10Spark />
            <div className="ab-table-scroll">
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 780 }}>
                <thead>
                  <tr>
                    {['年度', '盈利 (mn)', '每股盈利', '每股派息', '市盈率#', '息率%#', '派息比率%', '每股帐面净值'].map((h, i) => (
                      <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '10px ' + (i === 0 ? '20px' : '14px'), fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-subtle)', fontWeight: 600, borderBottom: '1px solid var(--border-default)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NQ_FIN10.map((r, ri) => <NqFin10Row key={r[0]} r={r} zebra={ri % 2 === 1} />)}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>
              # 按当年末收盘价计 · 盈利/每股盈利下方 Δ = 按年变动 · 演示数据
            </div>
          </div>
        )}
      </NqModule>

      <NqBeeRead
        gateKey="fin"
        methodology="m-nq-fin-1"
        findings={[
          '营业额四年温和爬升（2,715 亿 → 2,891 亿港元）；FY2023 股东应占溢利骤降主因一次性出售收益基数，之后逐年修复。',
          '1H2026 每股盈利当前处于质量保留：中期股数口径与回购注销纪录不一致，供应商复核中——该格不展示数值。',
          '净负债比率连续四年下行至 15% 区间，与集资事件（2026-03 票据）的再融资性质相互印证。',
        ]}
        limitation="AI 阅读不含 1H2026 被保留的字段；一次性项目拆分依赖年报附注粒度。"
        pose="thinking"
      />

      <NqRationale>
        <strong>(f) 财务报表。</strong>经典 terminal 的多期横表保留下来（专业用户的心智模型），但三处升级：① 中报列全列灰化 + 「未经审核」上标，口径差异先于数字被看见；② 质量保留直接占据发生问题的那一格——fail closed 发生在字段级而非整表级，其余 39 格照常可用，这就是「混合状态仍然可信」；③ 上市前财务（IPO-era 备考口径）作为独立 Enterprise 数据域挂在表尾，不与常规期并列，避免口径混排。AI 阅读显式声明未读取被保留字段。
      </NqRationale>
    </div>
  );
}

Object.assign(window, { NqFinancialsView, NqFin10Spark, NqFin10Row });

/* ---------- 十年纯利柱状 spark ---------- */
function NqFin10Spark() {
  const vals = [...NQ_FIN10].reverse().map(r => parseFloat(r[1].replace(/,/g, '')));
  const years = [...NQ_FIN10].reverse().map(r => '’' + r[0].split('/')[0].slice(2) + r[0].split('/')[1].slice(2));
  const W = 900, H = 120, padB = 24, padT = 20;
  const max = Math.max(...vals), base = H - padB;
  const gw = W / vals.length, bw = gw * 0.56;
  return (
    <div style={{ padding: '14px 20px 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginBottom: 6 }}>
        <span>股东应占溢利 · HKD mn</span>
        <NqMono size="var(--text-2xs)" weight={600} color="var(--text-subtle)">2016 → 2025</NqMono>
      </div>
      <svg viewBox={'0 0 ' + W + ' ' + H} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="十年纯利柱状图">
        <line x1="0" x2={W} y1={base} y2={base} stroke="var(--border-default)" strokeWidth="1" />
        {vals.map((v, i) => {
          const h = (v / max) * (H - padB - padT);
          const x = i * gw + (gw - bw) / 2, y = base - h;
          const last = i === vals.length - 1;
          return (
            <g key={i}>
              <rect x={x.toFixed(1)} y={y.toFixed(1)} width={bw.toFixed(1)} height={h.toFixed(1)} rx="2" fill="var(--honey-500)" opacity={last ? 1 : 0.4} />
              <text x={(i * gw + gw / 2).toFixed(1)} y={H - 7} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fill="var(--text-subtle)">{'’' + NQ_FIN10[NQ_FIN10.length - 1 - i][0].split('/')[1].slice(2)}</text>
              {last && <text x={(i * gw + gw / 2).toFixed(1)} y={(y - 6).toFixed(1)} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="13" fontWeight="700" fill="var(--text-primary)">{v.toLocaleString()}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- 十年表行（盈利/EPS 带 YoY Δ 副行） ---------- */
function NqFin10Row({ r, zebra }) {
  const ud = useNqUpDown();
  const dc = d => d.startsWith('−') || d.startsWith('-') ? ud.down : ud.up;
  const cellNum = (main, delta) => (
    <td style={{ padding: '7px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
      <NqMono weight={600}>{main}</NqMono>
      <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', color: dc(delta), marginTop: 1 }}>{delta}%</div>
    </td>
  );
  const cell = v => <td style={{ padding: '7px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}><NqMono weight={600} color="var(--text-muted)">{v}</NqMono></td>;
  return (
    <tr style={{ background: zebra ? 'var(--surface-sunken)' : 'transparent' }}>
      <td style={{ padding: '7px 20px', whiteSpace: 'nowrap' }}><NqMono weight={700}>{r[0]}</NqMono></td>
      {cellNum(r[1], r[2])}
      {cellNum(r[3], r[4])}
      {cell(r[5])}{cell(r[6])}{cell(r[7])}{cell(r[8])}{cell(r[9])}
    </tr>
  );
}
