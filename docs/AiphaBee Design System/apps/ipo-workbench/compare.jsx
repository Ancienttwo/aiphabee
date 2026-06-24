/* ============================================================
   AiphaBee IPO 研究工作台 — Compare 横向比较 (2–5 个 IPO)
   ============================================================ */
const _CDS = window.AiphaBeeDesignSystem_599c13;
const { Badge: CBadge, Button: CBtn, ComparePanel: CComparePanel } = _CDS;

const COMPARE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-4)', 'var(--chart-3)', 'var(--chart-5)'];

/* metric definitions: value extractor + which direction wins */
const METRICS = [
  { label: '综合评分 Score', get: i => i.score, fmt: v => v, best: 'max', mono: true },
  { label: '置信度 Confidence', get: i => i.confidence, fmt: v => v + '%', best: 'max', mono: true },
  { label: '公开认购 Subscription', get: i => i.live.subPublic, fmt: v => v == null ? '—' : v + '×', best: 'max', mono: true },
  { label: '招股价 Offer', get: i => i.terms.finalPrice || i.terms.priceHigh, fmt: (v, i) => offerText(i.terms), best: null, mono: true },
  { label: '入场费 Entry Fee', get: i => i.terms.entryFee, fmt: v => v ? 'HK$' + v.toLocaleString() : '—', best: 'min', mono: true },
  { label: '集资额 Raise', get: i => parseFloat(i.terms.raiseHKD) || null, fmt: (v, i) => i.terms.raiseHKD, best: 'max', mono: true },
  { label: '市值 Market Cap', get: i => parseFloat(i.terms.mcapHKD) || null, fmt: (v, i) => i.terms.mcapHKD, best: null, mono: true },
  { label: '市盈率 P/E', get: i => parseFloat(i.terms.pe) || null, fmt: (v, i) => i.terms.pe, best: 'min', mono: true },
  { label: '基石数量 Cornerstones', get: i => (i.cornerstones || []).length, fmt: v => v + ' 名', best: 'max', mono: true },
  { label: '基石合计占比 CS %', get: i => (i.cornerstones || []).reduce((s, c) => s + (c.pct || 0), 0), fmt: v => v ? v.toFixed(1) + '%' : '—', best: 'max', mono: true },
  { label: '一手中签率 One-lot', get: i => i.live.oneLotRate, fmt: v => v == null ? '待公布' : v + '%', best: null, mono: true },
  { label: '上市板 Board', get: i => i.board, fmt: (v, i) => i.board, best: null, mono: false },
  { label: '行业 Sector', get: i => i.sector, fmt: (v, i) => SECTOR_LABEL[i.sector], best: null, mono: false },
  { label: '上市方式 Type', get: i => i.listingType, fmt: (v, i) => LISTING_TYPE[i.listingType].split(' ')[0], best: null, mono: false },
  { label: '回拨 Clawback', get: i => i.clawback ? 1 : 0, fmt: (v, i) => i.clawback ? '标准回拨' : '无 / NA', best: null, mono: false },
  { label: '市场情绪 Sentiment', get: i => i.sentiment, fmt: (v, i) => i, best: null, sentiment: true },
  { label: '研究信号 Signal', get: i => i.recommendation, fmt: (v, i) => i, best: null, rec: true },
];

function bestIndex(metric, ipos) {
  if (!metric.best) return -1;
  const vals = ipos.map(i => metric.get(i));
  let bi = -1, bv = metric.best === 'max' ? -Infinity : Infinity;
  vals.forEach((v, idx) => {
    if (v == null || isNaN(v)) return;
    if (metric.best === 'max' ? v > bv : v < bv) { bv = v; bi = idx; }
  });
  return bi;
}

function CompareView({ compareIds, setCompareIds, toggleCompare, openIpo, go }) {
  useLucide();
  const selected = compareIds.map(id => IPO_BY[id]).filter(Boolean);
  const cols = selected.length;

  return (
    <main style={{ ...SHELL, padding: '32px 24px 80px' }}>
      <button onClick={() => go('pipeline')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)', marginBottom: 16 }}>
        <Icon name="arrow-left" size={16} /> 返回 Pipeline
      </button>

      <Eyebrow style={{ marginBottom: 8 }}>横向比较 · Head-to-head</Eyebrow>
      <h1 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--ink-800)', letterSpacing: 'var(--tracking-tight)' }}>IPO 横向比较</h1>
      <p style={{ margin: '0 0 22px', fontSize: 'var(--text-base)', color: 'var(--text-muted)' }}>选择 2–5 个标的，逐指标对比；获胜单元格高亮，工蜂给出描述性裁决（非投资建议）。</p>

      {/* selector chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {IPOS.map(i => {
          const on = compareIds.includes(i.id);
          const full = !on && cols >= 5;
          return (
            <button key={i.id} disabled={full} onClick={() => toggleCompare(i.id)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px',
              borderRadius: 'var(--radius-pill)', cursor: full ? 'not-allowed' : 'pointer',
              border: '1px solid ' + (on ? 'var(--violet-500)' : 'var(--border-default)'),
              background: on ? 'var(--violet-50)' : 'var(--surface-card)', opacity: full ? 0.45 : 1,
              fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 600,
              color: on ? 'var(--violet-600)' : 'var(--text-body)',
            }}>
              <Icon name={on ? 'check' : 'plus'} size={14} />
              {i.name} <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)' }}>{i.ticker}</span>
            </button>
          );
        })}
      </div>

      {cols < 2 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
          <Icon name="git-compare" size={30} color="var(--text-subtle)" />
          <p style={{ margin: '12px 0 0', fontSize: 'var(--text-sm)' }}>请至少选择 2 个标的进行比较。</p>
        </div>
      ) : (
        <>
          {/* comparison table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', background: 'var(--surface-card)', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 120 + cols * 180 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '16px 18px', position: 'sticky', left: 0, background: 'var(--surface-card)', minWidth: 150 }}>
                    <Eyebrow>指标 Metric</Eyebrow>
                  </th>
                  {selected.map((i, idx) => (
                    <th key={i.id} style={{ padding: '16px 18px', textAlign: 'left', borderLeft: '1px solid var(--border-subtle)', minWidth: 170 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <span style={{ width: 10, height: 10, background: COMPARE_COLORS[idx], clipPath: 'var(--clip-hex)', flexShrink: 0 }} />
                        <button onClick={() => openIpo(i)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--ink-800)' }}>{i.name}</button>
                        <button onClick={() => toggleCompare(i.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', lineHeight: 0 }}><Icon name="x" size={14} /></button>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{i.ticker} · {i.cn}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m, ri) => {
                  const bi = bestIndex(m, selected);
                  return (
                    <tr key={ri} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 18px', position: 'sticky', left: 0, background: 'var(--surface-card)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 500 }}>{m.label}</td>
                      {selected.map((i, idx) => {
                        const win = idx === bi;
                        let content;
                        if (m.sentiment) content = <CBadge tone={SENTIMENT_TONE[i.sentiment]} size="sm" dot>{SENTIMENT_LABEL[i.sentiment].split(' ')[0]}</CBadge>;
                        else if (m.rec) content = <CBadge tone={REC_CFG[i.recommendation].tone} variant="solid" size="sm">{REC_CFG[i.recommendation].label.split(' ')[0]}</CBadge>;
                        else content = <Mono size="var(--text-sm)" color={win ? 'var(--green-700)' : 'var(--text-primary)'}>{m.fmt(m.get(i), i)}</Mono>;
                        return (
                          <td key={i.id} style={{ padding: '12px 18px', borderLeft: '1px solid var(--border-subtle)', background: win ? 'var(--green-50)' : 'transparent' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              {content}
                              {win && <Icon name="crown" size={13} color="var(--green-600)" />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bee verdict — ComparePanel works head-to-head; show for first two */}
          {cols >= 2 && (() => {
            const [a, b] = selected;
            const mk = [
              { label: '综合评分 Score', left: `${a.score}`, right: `${b.score}`, winner: a.score === b.score ? null : a.score > b.score ? 'left' : 'right' },
              { label: '公开认购 Sub', left: a.live.subPublic != null ? a.live.subPublic + '×' : '—', right: b.live.subPublic != null ? b.live.subPublic + '×' : '—', winner: (a.live.subPublic ?? -1) === (b.live.subPublic ?? -1) ? null : (a.live.subPublic ?? -1) > (b.live.subPublic ?? -1) ? 'left' : 'right' },
              { label: '估值 P/E', left: a.terms.pe, right: b.terms.pe, winner: null },
              { label: '基石 Cornerstones', left: (a.cornerstones || []).length + ' 名', right: (b.cornerstones || []).length + ' 名', winner: (a.cornerstones || []).length === (b.cornerstones || []).length ? null : (a.cornerstones || []).length > (b.cornerstones || []).length ? 'left' : 'right' },
              { label: 'AI 建议 Rec', left: REC_CFG[a.recommendation].label.split(' ')[0], right: REC_CFG[b.recommendation].label.split(' ')[0], winner: null },
            ];
            const winner = a.score >= b.score ? a : b;
            return (
              <CComparePanel basePath={MASCOT_BP} eyebrow="工蜂裁决 · Bee Verdict"
                title="头对头 PK" subtitle={cols > 2 ? `先比较前两名（共选 ${cols} 个）` : '逐指标权衡'}
                left={{ name: a.name, ticker: a.ticker, color: COMPARE_COLORS[0] }}
                right={{ name: b.name, ticker: b.ticker, color: COMPARE_COLORS[1] }}
                metrics={mk}
                verdict={`从研究评分与需求强度看，${winner.name}（${winner.ticker}）的综合信号更强（评分 ${winner.score} · 信号 ${REC_CFG[winner.recommendation].label.split(' ')[0]}）。以上为描述性研究信号，非投资建议；请结合各自风险摘要与数据版本独立判断。`} />
            );
          })()}
        </>
      )}
    </main>
  );
}

Object.assign(window, { CompareView });
