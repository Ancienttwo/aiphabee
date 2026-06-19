import React from 'react';

/**
 * AiphaBee Badge — the product's signal pill. Tones map to the
 * data-viz semantic tokens (sentiment, demand, status). `soft`
 * (tinted) by default; `solid` for emphasis, `outline` for quiet.
 */

const TONES = {
  honey:    { c: 'var(--honey-700)',   solid: 'var(--honey-500)',  on: 'var(--ink-800)',      soft: 'var(--honey-50)' },
  navy:     { c: 'var(--ink-800)',     solid: 'var(--ink-800)',    on: 'var(--text-inverse)', soft: 'var(--neutral-100)' },
  neutral:  { c: 'var(--neutral-600)', solid: 'var(--neutral-500)', on: 'var(--text-inverse)', soft: 'var(--neutral-100)' },
  bullish:  { c: 'var(--green-600)',   solid: 'var(--green-500)',  on: 'var(--text-inverse)', soft: 'var(--green-50)' },
  bearish:  { c: 'var(--red-600)',     solid: 'var(--red-500)',    on: 'var(--text-inverse)', soft: 'var(--red-50)' },
  ai:       { c: 'var(--violet-600)',  solid: 'var(--violet-500)', on: 'var(--text-inverse)', soft: 'var(--violet-50)' },
  info:     { c: 'var(--blue-500)',    solid: 'var(--blue-500)',   on: 'var(--text-inverse)', soft: 'var(--blue-50)' },
  warning:  { c: '#b45309',            solid: 'var(--orange-500)', on: 'var(--ink-800)',      soft: '#fff7ed' },
};

const PAD = {
  sm: { padding: '2px 8px',  fontSize: 'var(--text-2xs)' },
  md: { padding: '3px 10px', fontSize: 'var(--text-xs)' },
};

const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

export function Badge({
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  dot = false,
  dotShape = 'hex',
  icon,
  children,
  style = {},
  ...rest
}) {
  const t = TONES[tone] || TONES.neutral;
  const p = PAD[size] || PAD.md;

  let look;
  if (variant === 'solid') {
    look = { background: t.solid, color: t.on, border: '1px solid transparent' };
  } else if (variant === 'outline') {
    look = { background: 'transparent', color: t.c, border: `1px solid ${t.c}` };
  } else {
    look = { background: t.soft, color: t.c, border: '1px solid transparent' };
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        ...p,
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--weight-semibold)',
        lineHeight: 1.4,
        borderRadius: 'var(--radius-pill)',
        whiteSpace: 'nowrap',
        ...look,
        ...style,
      }}
      {...rest}
    >
      {dot ? (
        <span style={{
          width: dotShape === 'hex' ? 8 : 6,
          height: dotShape === 'hex' ? 9 : 6,
          borderRadius: dotShape === 'hex' ? 0 : '50%',
          clipPath: dotShape === 'hex' ? HEX_CLIP : 'none',
          flexShrink: 0,
          background: variant === 'solid' ? t.on : t.solid,
        }} />
      ) : null}
      {icon ? <span style={{ display: 'inline-flex' }}>{icon}</span> : null}
      {children}
    </span>
  );
}
