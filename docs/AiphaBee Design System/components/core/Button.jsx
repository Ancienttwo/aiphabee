import React from 'react';

/**
 * AiphaBee Button — honey primary, navy ink, soft lift on hover.
 * Self-contained: styling references the design-system CSS variables.
 */

const SIZES = {
  sm: { height: 32, padding: '0 12px', fontSize: 'var(--text-sm)', gap: 6 },
  md: { height: 40, padding: '0 18px', fontSize: 'var(--text-sm)', gap: 8 },
  lg: { height: 48, padding: '0 26px', fontSize: 'var(--text-base)', gap: 10 },
};

function variantStyle(variant, hover) {
  switch (variant) {
    case 'secondary':
      return {
        background: hover ? 'var(--ink-700)' : 'var(--ink-800)',
        color: 'var(--text-inverse)',
        border: '1px solid transparent',
      };
    case 'outline':
      return {
        background: hover ? 'var(--surface-muted)' : 'transparent',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-default)',
      };
    case 'ghost':
      return {
        background: hover ? 'var(--surface-muted)' : 'transparent',
        color: 'var(--text-primary)',
        border: '1px solid transparent',
      };
    case 'ai':
      return {
        background: hover ? 'var(--violet-600)' : 'var(--violet-500)',
        color: 'var(--text-inverse)',
        border: '1px solid transparent',
      };
    case 'danger':
      return {
        background: hover ? 'var(--red-600)' : 'var(--red-500)',
        color: 'var(--text-inverse)',
        border: '1px solid transparent',
      };
    case 'primary':
    default:
      return {
        background: hover ? 'var(--honey-600)' : 'var(--honey-500)',
        color: 'var(--text-on-honey)',
        border: '1px solid transparent',
        boxShadow: hover ? 'var(--shadow-honey)' : 'none',
      };
  }
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth = false,
  disabled = false,
  children,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const sz = SIZES[size] || SIZES.md;
  const v = variantStyle(variant, hover && !disabled);

  return (
    <button
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: fullWidth ? 'flex' : 'inline-flex',
        width: fullWidth ? '100%' : undefined,
        alignItems: 'center',
        justifyContent: 'center',
        gap: sz.gap,
        height: sz.height,
        padding: sz.padding,
        fontFamily: 'var(--font-sans)',
        fontSize: sz.fontSize,
        fontWeight: 'var(--weight-semibold)',
        lineHeight: 1,
        borderRadius: 'var(--radius-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        transition: 'background var(--duration-fast) var(--ease-standard), box-shadow var(--duration-base) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)',
        transform: hover && !disabled ? 'translateY(-1px)' : 'translateY(0)',
        ...v,
        ...style,
      }}
      {...rest}
    >
      {icon ? <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span> : null}
      {children}
      {iconRight ? <span style={{ display: 'inline-flex', flexShrink: 0 }}>{iconRight}</span> : null}
    </button>
  );
}
