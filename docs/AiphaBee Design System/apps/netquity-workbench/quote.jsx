/* ============================================================
   (新) 行情概览 tab — 报价头 + 价格图(MA) + KPI + AI 阅读
   涨跌颜色跟随惯例 Tweak（hk 红涨绿跌 / us 绿涨红跌）
   ============================================================ */

function useNqUpDown() {
  const { udConv } = React.useContext(NqRightsCtx);
  return udConv === 'us'
    ? { up: 'var(--green-600)', down: 'var(--red-600)' }
    : { up: 'var(--red-600)', down: 'var(--green-600)' };
}

function NqQuoteView() {
  useNqLucide();
  const g = useNqGate('price');
  const ud = useNqUpDown();
  const q = NQ_QUOTE;
  const neg = q.chg < 0;
  const c = neg ? ud.down : ud.up;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {g.state !== 'available' && (
        <NqLockedPanel gateKey="price" preview="日终报价、250 日价格序列（含 MA10/50/250）、估值与交易指标已就绪。" />
      )}

      {/* 报价头 */}
      <NqModule icon="activity" title="行情快照" en="Quote · EOD"
        right={<><NqBadge tone="info" variant="soft" size="sm">{q.kind}</NqBadge></>}>
        {g.state === 'available' ? (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <NqMono size="var(--text-4xl)" weight={700}>{q.last.toFixed(2)}</NqMono>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>HKD</span>
              </div>
              <div style={{ marginTop: 6 }}>
                <NqMono size="var(--text-base)" weight={700} color={c}>{neg ? '' : '+'}{q.chg.toFixed(2)} ({neg ? '' : '+'}{q.chgPct.toFixed(2)}%)</NqMono>
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginLeft: 8 }}>截至 {q.asOf}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <NqBadge tone="neutral" variant="soft" size="sm">每手 {q.boardLot} 股</NqBadge>
                <NqBadge tone="neutral" variant="soft" size="sm">52 周 <NqMono size="var(--text-2xs)" weight={600}>{q.w52Low.toFixed(2)}–{q.w52High.toFixed(2)}</NqMono></NqBadge>
                <NqBadge tone="neutral" variant="soft" size="sm">历史波幅 <NqMono size="var(--text-2xs)" weight={600}>{q.histVol}%</NqMono></NqBadge>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {NQ_INDEXES.map(ix => (
                  <span key={ix} style={{ padding: '2px 9px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)', background: 'var(--surface-sunken)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{ix}</span>
                ))}
              </div>
            </div>
            <div className="ab-grid-4" style={{ gap: 10, flex: 1, minWidth: 300 }}>
              {[['开市', q.open.toFixed(2)], ['前收市', q.prevClose.toFixed(2)], ['全日波幅', q.dayLow.toFixed(2) + '–' + q.dayHigh.toFixed(2)], ['成交额', q.turnover]].map(([k, v]) => (
                <div key={k} style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginBottom: 4 }}>{k}</div>
                  <NqMono weight={600}>{v}</NqMono>
                </div>
              ))}
            </div>
          </div>
        ) : <NqSdiGhostRows n={2} />}
      </NqModule>

      {/* 价格图 */}
      {g.state === 'available' && <NqPriceChart />}

      {/* 相对表现 + 主要财务比率 */}
      <div className="ab-split" style={{ gap: 16, alignItems: 'stretch' }}>
        <NqModule icon="bar-chart-3" title="相对表现" en="Relative performance">
          {g.state === 'available' ? <NqPerfChart /> : <NqSdiGhostRows n={3} />}
        </NqModule>
        <NqModule icon="percent" title="主要财务比率" en="Key ratios · FY 12/2025">
          <div style={{ display: 'grid', gap: 0 }}>
            {NQ_RATIOS.map(([k, v], i) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, padding: '8px 2px', borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>{k}</span>
                <NqGateValue gateKey="fin"><NqMono weight={700}>{v}</NqMono></NqGateValue>
              </div>
            ))}
          </div>
        </NqModule>
      </div>

      {/* KPI */}
      <NqModule icon="gauge" title="估值与交易指标" en="Valuation & trading">
        <div className="ab-grid-4" style={{ gap: 10 }}>
          {NQ_KPIS.map(kpi => (
            <div key={kpi.k} style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginBottom: 4 }}>{kpi.k}</div>
              <div><NqGateValue gateKey={kpi.gate}><NqMono size="var(--text-base)" weight={700}>{kpi.v}</NqMono></NqGateValue></div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
          估值比率 = 收盘价 ÷ 最新披露每股数（方法 m-nq-val-1，确定性计算，可复算）。
        </div>
      </NqModule>

      <NqBeeRead
        gateKey="price"
        methodology="m-nq-quote-1"
        findings={[
          '现价 65.00 低于 MA10（67.58）与 MA50（68.66），但仍高于 MA250（57.91）约 12%——短线走弱、年线趋势未破。',
          '市帐率 0.44× 显著低于 1，配合 3.56% 股息率与 74.78% 派息比率，估值画像偏「深折让 + 高派息」。',
          '52 周区间 47.20–74.35，现价处于区间约 66% 分位。',
        ]}
        limitation="仅基于日终价与最新披露财务数；不含盘中数据，不构成走势判断。"
        pose="thinking"
      />

      <NqRationale>
        <strong>行情概览。</strong>modern 终端的报价头（大号等宽价格 + 涨跌 + as-of）、MA 图与 KPI 网格移植进 AiphaBee 语法：报价永远标注「收盘价 · 非实时」口径徽章；涨跌颜色由用户惯例 Tweak 决定（港式红涨绿跌默认，可切西式），颜色仅表达方向事实。KPI 逐格挂各自的 gate（估值属 price 域、EPS/派息属 fin 域），一格锁定不影响邻格。
      </NqRationale>
    </div>
  );
}

/* ---------- 相对表现：分组柱图（1M/3M/1Y × 股价/行业/大市） ---------- */
function NqPerfChart() {
  const ud = useNqUpDown();
  const colors = ['var(--honey-500)', 'var(--neutral-400)', 'var(--blue-500)'];
  const W = 640, H = 210, padT = 24, padB = 30, min = -12, max = 42;
  const Y = v => padT + (max - v) / (max - min) * (H - padT - padB);
  const zeroY = Y(0);
  const gw = W / NQ_PERF.groups.length, barW = gw * 0.16, gap = gw * 0.05;
  const startOff = (gw - (barW * 3 + gap * 2)) / 2;
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
        {NQ_PERF.series.map((s, i) => (
          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: colors[i] }}></span>{s}
          </span>
        ))}
      </div>
      <svg viewBox={'0 0 ' + W + ' ' + H} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="相对表现">
        <line x1="0" x2={W} y1={zeroY} y2={zeroY} stroke="var(--border-default)" strokeWidth="1" />
        {NQ_PERF.groups.map((grp, gi) => (
          <g key={grp.label}>
            {grp.v.map((v, i) => {
              const bx = gi * gw + startOff + i * (barW + gap);
              const by = Y(v), top = Math.min(by, zeroY), h = Math.max(1, Math.abs(by - zeroY));
              const pos = v >= 0;
              return (
                <g key={i}>
                  <rect x={bx.toFixed(1)} y={top.toFixed(1)} width={barW.toFixed(1)} height={h.toFixed(1)} rx="2" fill={colors[i]} />
                  <text x={(bx + barW / 2).toFixed(1)} y={(pos ? by - 5 : by + 13).toFixed(1)} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fontWeight="700" fill={pos ? ud.up : ud.down}>{(pos ? '+' : '−') + Math.abs(v).toFixed(1)}%</text>
                </g>
              );
            })}
            <text x={(gi * gw + gw / 2).toFixed(1)} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--text-subtle)">{grp.label}</text>
          </g>
        ))}
      </svg>
      <div style={{ marginTop: 8, fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>平均成交 — {NQ_PERF.avgVol}</div>
    </div>
  );
}

/* ---------- SVG 价格图（250日 + MA + 时间框） ---------- */
function NqPriceChart() {
  const ud = useNqUpDown();
  const [win, setWin] = React.useState(65);
  const q = NQ_QUOTE;
  const series = NQ_PRICE_SERIES.slice(-win);
  const ma10 = nqMA(NQ_PRICE_SERIES, 10).slice(-win);
  const ma50 = nqMA(NQ_PRICE_SERIES, 50).slice(-win);
  const ma250 = nqMA(NQ_PRICE_SERIES, 250).slice(-win);
  const all = series.concat(ma10, ma50, ma250).filter(v => v != null);
  const lo = Math.min(...all) - 1, hi = Math.max(...all) + 1;
  const W = 900, H = 280;
  const X = i => (i / (win - 1)) * W;
  const Y = v => H - ((v - lo) / (hi - lo)) * (H - 20) - 10;
  const path = (arr) => arr.map((v, i) => v == null ? null : (arr[i - 1] == null ? 'M' : 'L') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).filter(Boolean).join(' ');
  const up = series[series.length - 1] >= series[0];
  const lineColor = up ? ud.up : ud.down;
  const tfs = [[22, '1M'], [65, '3M'], [130, '6M'], [250, '1Y']];
  const gridYs = [0.25, 0.5, 0.75].map(f => lo + (hi - lo) * f);

  return (
    <NqModule icon="line-chart" title="价格走势" en="Price · 收盘序列" pad={false}
      right={
        <>
          <span style={{ display: 'inline-flex', gap: 4 }}>
            {tfs.map(([d, label]) => (
              <button key={d} onClick={() => setWin(d)} style={{
                padding: '3px 11px', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 700,
                border: '1px solid ' + (win === d ? 'var(--honey-500)' : 'var(--border-subtle)'),
                background: win === d ? 'var(--honey-500)' : 'var(--surface-card)',
                color: win === d ? 'var(--text-on-honey)' : 'var(--text-muted)',
              }}>{label}</button>
            ))}
          </span>
        </>
      }>
      <div style={{ padding: '12px 20px 4px', display: 'flex', gap: 16, flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
        <span><span style={{ display: 'inline-block', width: 14, height: 2, background: 'var(--blue-500)', verticalAlign: 'middle', marginRight: 5, borderRadius: 2 }}></span>MA10 {q.ma10}</span>
        <span><span style={{ display: 'inline-block', width: 14, height: 2, background: 'var(--honey-600)', verticalAlign: 'middle', marginRight: 5, borderRadius: 2 }}></span>MA50 {q.ma50}</span>
        <span><span style={{ display: 'inline-block', width: 14, height: 2, background: 'var(--neutral-400)', verticalAlign: 'middle', marginRight: 5, borderRadius: 2 }}></span>MA250 {q.ma250}</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-sans)' }}>展示口径：不复权 · 日终</span>
      </div>
      <div style={{ padding: '4px 20px 14px' }}>
        <svg viewBox={'0 0 ' + W + ' ' + H} preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 280 }} role="img" aria-label="价格走势图">
          {gridYs.map(v => (
            <g key={v}>
              <line x1="0" y1={Y(v)} x2={W} y2={Y(v)} stroke="var(--border-subtle)" strokeWidth="1" />
              <text x={W - 4} y={Y(v) - 4} textAnchor="end" fontFamily="var(--font-mono)" fontSize="11" fill="var(--text-subtle)">{v.toFixed(1)}</text>
            </g>
          ))}
          <path d={path(series) + ' L' + W + ' ' + H + ' L0 ' + H + ' Z'} fill={lineColor} opacity="0.07" />
          <path d={path(ma250)} fill="none" stroke="var(--neutral-400)" strokeWidth="1.4" />
          <path d={path(ma50)} fill="none" stroke="var(--honey-600)" strokeWidth="1.4" />
          <path d={path(ma10)} fill="none" stroke="var(--blue-500)" strokeWidth="1.4" />
          <path d={path(series)} fill="none" stroke={lineColor} strokeWidth="2.2" strokeLinejoin="round" />
          <circle cx={X(win - 1)} cy={Y(series[series.length - 1])} r="4" fill={lineColor} />
        </svg>
      </div>
    </NqModule>
  );
}

/* ---------- (新) 轮证 tab ---------- */
function NqWarrantsView() {
  useNqLucide();
  const g = useNqGate('warrants');
  const ud = useNqUpDown();
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {g.state !== 'available' && (
        <NqLockedPanel gateKey="warrants" preview={NQ_WARRANTS.length + ' 只相关轮证（认购/认沽/牛熊证）已就绪，含行使价、到期日与可复算的溢价/杠杆。'} />
      )}
      <NqModule icon="candlestick-chart" title="相关轮证" en={'Linked warrants · 正股 HKD ' + NQ_QUOTE.last.toFixed(2) + ' · 历史波幅 ' + NQ_QUOTE.histVol + '%'}
        pad={false}>
        {g.state !== 'available' ? <div style={{ padding: '18px 20px' }}><NqSdiGhostRows n={5} /></div> : (
          <div className="ab-table-scroll">
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 760 }}>
              <thead>
                <tr>
                  {['代号', '名称', '类型', '最新价', '1日 %', '到期', '行使价', '收回价', '溢价 %', '实际杠杆'].map((h, i) => (
                    <th key={h} style={{ textAlign: i < 3 ? 'left' : 'right', padding: '10px ' + (i === 0 ? '20px' : '14px'), fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-subtle)', fontWeight: 600, borderBottom: '1px solid var(--border-default)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NQ_WARRANTS.map((w, ri) => {
                  const isCall = w.type.includes('购') || w.type.includes('牛');
                  const chgC = w.chgPct >= 0 ? ud.up : ud.down;
                  return (
                    <tr key={w.code} style={{ background: ri % 2 ? 'var(--surface-sunken)' : 'transparent' }}>
                      <td style={{ padding: '9px 20px' }}><NqMono weight={700}>{w.code}</NqMono></td>
                      <td style={{ padding: '9px 14px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{w.name}<span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginLeft: 6 }}>{w.issuer}</span></td>
                      <td style={{ padding: '9px 14px' }}><NqBadge tone={isCall ? 'bullish' : 'bearish'} variant="soft" size="sm">{w.type}</NqBadge></td>
                      <td style={{ padding: '9px 14px', textAlign: 'right' }}><NqMono weight={600}>{w.last.toFixed(3)}</NqMono></td>
                      <td style={{ padding: '9px 14px', textAlign: 'right' }}><NqMono weight={700} color={chgC}>{w.chgPct >= 0 ? '+' : ''}{w.chgPct.toFixed(1)}%</NqMono></td>
                      <td style={{ padding: '9px 14px', textAlign: 'right' }}><NqMono weight={600} color="var(--text-muted)">{w.expiry}</NqMono></td>
                      <td style={{ padding: '9px 14px', textAlign: 'right' }}><NqMono weight={600}>{w.strike.toFixed(2)}</NqMono></td>
                      <td style={{ padding: '9px 14px', textAlign: 'right' }}>{w.callLevel ? <NqMono weight={600}>{w.callLevel.toFixed(2)}</NqMono> : <span style={{ color: 'var(--text-subtle)' }}>—</span>}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right' }}><NqMono weight={600}>{w.premium.toFixed(1)}</NqMono></td>
                      <td style={{ padding: '9px 14px', textAlign: 'right' }}><NqMono weight={600}>{w.gearing.toFixed(1)}×</NqMono></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>
              溢价 / 实际杠杆为确定性派生（m-nq-wts-1）· 街货量字段供应商复核中，暂不展示（fail closed）· 演示数据
            </div>
          </div>
        )}
      </NqModule>

      <NqBeeRead
        gateKey="warrants"
        methodology="m-nq-wts-2"
        findings={[
          '5 只轮证覆盖 58.88–75.00 行使价带；正股 65.00 处于带内中位，认购证均为价外（溢价 13–17%）。',
          '两只牛熊证收回价（61.50 / 68.80）距现价分别约 −5.4% / +5.8%——正股波幅 24.4% 下收回风险不可忽略，已在行内并列收回价。',
          '认沽与熊证今日逆市上涨，与正股 −1.90% 方向一致，无异常定价信号。',
        ]}
        limitation="仅列示与正股关联的轮证事实；不评估任何轮证的适合性，不构成买卖建议。"
      />

      <NqRationale>
        <strong>轮证。</strong>modern 终端的 warrants 表移植为完整轮证面：牛熊证与认购认沽同表，「收回价」单列（牛熊证的核心风险事实），溢价/杠杆标注派生方法号。类型徽章用多空色仅表达工具方向（Call/牛 vs Put/熊），涨跌列颜色跟随用户惯例 Tweak。街货量字段演示 fail closed：整列不出现，脚注说明原因。
      </NqRationale>
    </div>
  );
}

/* ---------- 公司简介模块（挂在董事 tab 顶部或独立使用） ---------- */
function NqProfileCard() {
  const g = useNqGate('sm');
  return (
    <NqModule icon="building-2" title="公司简介" en="Profile">
      <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-body)', lineHeight: 1.7 }}>{NQ_PROFILE.activities}</p>
      <p style={{ margin: '8px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.7 }}>{NQ_PROFILE.latest}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        <NqEyebrow>收入分部</NqEyebrow>
        <div style={{ display: 'flex', height: 12, borderRadius: 'var(--radius-pill)', overflow: 'hidden', border: '1px solid var(--border-subtle)', flex: 1, minWidth: 220 }} aria-hidden="true">
          {NQ_PROFILE.segments.map((s, i) => (
            <span key={s.name} title={s.name + ' · ' + s.pct + '%'} style={{ width: s.pct + '%', background: ['var(--ink-700)', 'var(--honey-500)', 'var(--blue-500)', 'var(--violet-500)', 'var(--neutral-300)'][i] }}></span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
        {NQ_PROFILE.segments.map((s, i) => (
          <span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, clipPath: 'var(--clip-hex)', background: ['var(--ink-700)', 'var(--honey-500)', 'var(--blue-500)', 'var(--violet-500)', 'var(--neutral-300)'][i] }}></span>
            {s.name} <NqMono size="var(--text-2xs)" weight={600}>{s.pct}%</NqMono>
          </span>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>核数师意见：<strong style={{ color: 'var(--text-body)' }}>{NQ_PROFILE.auditor}</strong> · 主要股东：<strong style={{ color: 'var(--text-body)' }}>{NQ_INFO.shareholders}</strong></div>
      <div style={{ display: 'grid', gap: 6, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <NqEyebrow>相关股份</NqEyebrow>
          {NQ_INFO.related.map(c => (
            <span key={c} style={{ padding: '2px 9px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)', background: 'var(--surface-sunken)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 600, color: 'var(--text-body)' }}>{c}</span>
          ))}
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>· 相关轮证 {NQ_INFO.warrantCount} 只（见轮证 tab）</span>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
          <span>网站 <a href={'https://' + NQ_INFO.website}>{NQ_INFO.website}</a></span>
          <span>电邮 <a href={'mailto:' + NQ_INFO.email}>{NQ_INFO.email}</a></span>
          <span>电话 <NqMono size="var(--text-2xs)" weight={600} color="var(--text-muted)">{NQ_INFO.tel}</NqMono></span>
          <span>传真 <NqMono size="var(--text-2xs)" weight={600} color="var(--text-muted)">{NQ_INFO.fax}</NqMono></span>
        </div>
      </div>
    </NqModule>
  );
}

Object.assign(window, { NqQuoteView, NqPriceChart, NqPerfChart, NqWarrantsView, NqProfileCard, useNqUpDown });
