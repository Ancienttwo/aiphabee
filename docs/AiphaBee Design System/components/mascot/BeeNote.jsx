import React from 'react';

/**
 * AiphaBee BeeNote — the worker-bee insight block. The mascot
 * (in a honeycomb hexagon) delivers an AI finding in a diligent,
 * hard-working voice. `honey` (light) or `navy` (dark) surface.
 * Replaces the generic "AI" avatar circle.
 */

const HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

function HexMascot({ src, size = 56 }) {
  const border = 3;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--honey-500)', clipPath: HEX }} />
      <div style={{ position: 'absolute', inset: border, background: 'var(--honey-100)', clipPath: HEX, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
        <img src={src} alt="AiphaBee" style={{ width: '92%', height: '92%', objectFit: 'contain', marginBottom: '-4%' }} />
      </div>
    </div>
  );
}

export function BeeNote({
  pose = 'insight',
  basePath = 'assets/mascot',
  src,
  title = '工蜂洞察 · Bee Insight',
  tone = 'honey',
  mascotSize = 56,
  children,
  action,
  style = {},
  ...rest
}) {
  const img = src || `${basePath}/${pose}.png`;
  const dark = tone === 'navy';

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        background: dark ? 'var(--ink-800)' : 'var(--honey-50)',
        border: dark ? '1px solid transparent' : '1px solid var(--honey-200)',
        ...style,
      }}
      {...rest}
    >
      <HexMascot src={img} size={mascotSize} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5,
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)',
          letterSpacing: 'var(--tracking-wide)',
          color: dark ? 'var(--honey-400)' : 'var(--honey-800)',
        }}>
          <span aria-hidden="true">🐝</span>{title}
        </div>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)',
          color: dark ? 'rgba(255,255,255,0.86)' : 'var(--ink-700)',
        }}>
          {children}
        </div>
        {action ? <div style={{ marginTop: 'var(--space-3)' }}>{action}</div> : null}
      </div>
    </div>
  );
}
