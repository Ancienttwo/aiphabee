import React from 'react';

/**
 * AiphaBee ForageLoader — the diligent loading state. The bee
 * "forages" while a honey bar fills the comb. `pill` (compact, navy)
 * or `block` (centered, for full-panel loading). Replaces the
 * generic spinner. Set `done` for the "撒蜜收尾" tail frame — the bee
 * swaps to the honey-finish pose, the bar locks full, and the label
 * switches to `doneLabel`. Keep it briefly, then unmount/route on.
 */

export function ForageLoader({
  label = '工蜂正在采集…',
  doneLabel = '采集完成 · 已撒蜜入巢',
  done = false,
  variant = 'pill',
  basePath = 'assets/mascot',
  src,
  style = {},
  ...rest
}) {
  const img = src || `${basePath}/${done ? 'honey-finish' : 'forage'}.png`;
  const text = done ? doneLabel : label;
  // While foraging the bar loops; on done it locks full.
  const barAnim = done ? 'none' : 'aiphabee-honey-fill 2.2s var(--ease-out) infinite';
  const barWidth = done ? '100%' : undefined;
  const beeAnim = done ? 'aiphabee-glow 1.4s var(--ease-out) 1' : 'aiphabee-buzz 1.6s var(--ease-standard) infinite';

  if (variant === 'block') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)',
        padding: 'var(--space-8)', textAlign: 'center', ...style,
      }} {...rest}>
        <img src={img} alt="" style={{ width: 96, height: 96, objectFit: 'contain', animation: beeAnim }} />
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: done ? 'var(--green-600)' : 'var(--text-muted)' }}>{text}</div>
        <div style={{ width: 180, height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--surface-muted)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: barWidth, borderRadius: 'var(--radius-pill)', background: 'linear-gradient(90deg, var(--honey-400), var(--honey-500))', animation: barAnim }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)',
      padding: '8px 16px 8px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--ink-800)', ...style,
    }} {...rest}>
      <img src={img} alt="" style={{ height: 28, width: 'auto', objectFit: 'contain', animation: beeAnim }} />
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: '#fff' }}>{text}</span>
      <span style={{ width: 56, height: 6, borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', width: barWidth, borderRadius: 'var(--radius-pill)', background: 'linear-gradient(90deg, var(--honey-400), var(--honey-500))', animation: barAnim }} />
      </span>
    </div>
  );
}
