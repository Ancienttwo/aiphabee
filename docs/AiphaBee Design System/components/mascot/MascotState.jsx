import React from 'react';

/**
 * AiphaBee MascotState — full mascot illustration for empty / success
 * / error / onboarding states. Centered pose + title + description +
 * optional action. An optional faint honeycomb backdrop frames the bee.
 */

export function MascotState({
  pose = 'empty',
  basePath = 'assets/mascot',
  src,
  title,
  description,
  size = 150,
  comb = true,
  children,
  style = {},
  ...rest
}) {
  const img = src || `${basePath}/${pose}.png`;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      gap: 'var(--space-3)', padding: 'var(--space-8) var(--space-6)', ...style,
    }} {...rest}>
      <div style={{
        position: 'relative', width: size, height: size, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {comb ? (
          <div style={{
            position: 'absolute', inset: '-8%',
            backgroundImage: 'var(--pattern-honeycomb)', backgroundSize: '26px 45px',
            opacity: 0.5,
            WebkitMaskImage: 'radial-gradient(circle at center, #000 30%, transparent 72%)',
            maskImage: 'radial-gradient(circle at center, #000 30%, transparent 72%)',
            pointerEvents: 'none',
          }} />
        ) : null}
        <img src={img} alt="" style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      {title ? (
        <h3 style={{
          margin: '6px 0 0', fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)',
        }}>{title}</h3>
      ) : null}
      {description ? (
        <p style={{
          margin: 0, maxWidth: 380, fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)',
          lineHeight: 'var(--leading-relaxed)', color: 'var(--text-muted)',
        }}>{description}</p>
      ) : null}
      {children ? <div style={{ marginTop: 'var(--space-3)' }}>{children}</div> : null}
    </div>
  );
}
