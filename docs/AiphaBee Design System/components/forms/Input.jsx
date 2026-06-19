import React from 'react';

/**
 * AiphaBee Input — labelled text field with honey focus ring.
 * Supports a leading icon, prefix/suffix adornments (e.g. "HKD"),
 * helper text and an error state.
 */

export function Input({
  label,
  icon,
  prefix,
  suffix,
  helper,
  error,
  size = 'md',
  style = {},
  id,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const reactId = React.useId ? React.useId() : undefined;
  const inputId = id || reactId;
  const h = size === 'sm' ? 36 : size === 'lg' ? 48 : 42;

  const borderColor = error
    ? 'var(--red-500)'
    : focus
    ? 'var(--honey-500)'
    : 'var(--border-default)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label ? (
        <label htmlFor={inputId} style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-medium)',
          color: 'var(--text-primary)',
        }}>
          {label}
        </label>
      ) : null}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: h,
        background: 'var(--surface-card)',
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: focus && !error ? 'var(--ring-glow)' : 'none',
        transition: 'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
        paddingLeft: 12,
        paddingRight: 12,
        gap: 8,
      }}>
        {icon ? <span style={{ display: 'inline-flex', color: 'var(--text-muted)', flexShrink: 0 }}>{icon}</span> : null}
        {prefix ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{prefix}</span> : null}
        <input
          id={inputId}
          onFocus={(e) => { setFocus(true); rest.onFocus && rest.onFocus(e); }}
          onBlur={(e) => { setFocus(false); rest.onBlur && rest.onBlur(e); }}
          {...rest}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            height: '100%',
          }}
        />
        {suffix ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{suffix}</span> : null}
      </div>

      {(helper || error) ? (
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-xs)',
          color: error ? 'var(--red-500)' : 'var(--text-muted)',
        }}>
          {error || helper}
        </span>
      ) : null}
    </div>
  );
}
