import React from 'react';

/**
 * AiphaBee ComparePanel — the head-to-head "PK" view. The compare
 * worker-bee presides over a hexagon honeycomb header while two
 * candidates (IPOs, tickers, funds) are weighed metric-by-metric.
 * Winning cells get a honey-green highlight; the bee delivers the
 * verdict in the navy footer. Hero-scale mascot — one per screen.
 */

const HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

function Side({ side }) {
  if (!side) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
      <span style={{ width: 13, height: 14, clipPath: HEX, flexShrink: 0, background: side.color || 'var(--honey-500)' }} />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)', color: 'var(--ink-800)' }}>{side.name}</span>
      {side.ticker ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{side.ticker}</span> : null}
    </div>
  );
}

export function ComparePanel({
  pose = 'compare',
  basePath = 'assets/mascot',
  src,
  eyebrow = '蜂巢对比 · Compare',
  title = '工蜂帮你称一称',
  subtitle,
  left,
  right,
  metrics = [],
  verdict,
  mascotSize = 120,
  style = {},
  ...rest
}) {
  const img = src || `${basePath}/${pose}.png`;

  const cell = (node, win) => (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
      color: win ? 'var(--green-600)' : 'var(--ink-800)',
    }}>{node}</span>
  );

  return (
    <div style={{
      background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', overflow: 'hidden', ...style,
    }} {...rest}>
      {/* Hero header */}
      <div style={{
        position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 'var(--space-5)',
        padding: 'var(--space-5) var(--space-6)', background: 'var(--surface-honey)', borderBottom: '1px solid var(--honey-200)',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, backgroundImage: 'var(--pattern-honeycomb)', backgroundSize: '120px auto',
          opacity: 0.4, WebkitMaskImage: 'linear-gradient(90deg, transparent, #000)', maskImage: 'linear-gradient(90deg, transparent, #000)',
        }} />
        <img src={img} alt="" style={{ position: 'relative', width: mascotSize, height: 'auto', flexShrink: 0, filter: 'drop-shadow(0 8px 16px rgba(26,34,66,0.14))' }} />
        <div style={{ position: 'relative' }}>
          <p style={{ margin: '0 0 5px', fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--honey-800)' }}>{eyebrow}</p>
          <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-extrabold)', letterSpacing: 'var(--tracking-tight)', color: 'var(--ink-800)' }}>{title}</h3>
          {subtitle ? <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>{subtitle}</p> : null}
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'start' }}>
        <div style={{ padding: 'var(--space-5) var(--space-6)' }}>
          <Side side={left} />
          {metrics.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0', borderBottom: i === metrics.length - 1 ? 'none' : '1px dashed var(--border-subtle)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{m.label}</span>
              {cell(m.left, m.winner === 'left')}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', padding: '0 var(--space-2)' }}>
          <span style={{
            width: 38, height: 42, background: 'var(--ink-800)', color: '#fff', clipPath: HEX,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-extrabold)', fontSize: 'var(--text-sm)',
          }}>VS</span>
        </div>
        <div style={{ padding: 'var(--space-5) var(--space-6)' }}>
          <Side side={right} />
          {metrics.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0', borderBottom: i === metrics.length - 1 ? 'none' : '1px dashed var(--border-subtle)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{m.label}</span>
              {cell(m.right, m.winner === 'right')}
            </div>
          ))}
        </div>
      </div>

      {/* Verdict */}
      {verdict ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4) var(--space-6)', background: 'var(--ink-800)', color: '#fff' }}>
          <span aria-hidden="true" style={{ width: 16, height: 18, background: 'var(--honey-500)', clipPath: HEX, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>{verdict}</p>
        </div>
      ) : null}
    </div>
  );
}
