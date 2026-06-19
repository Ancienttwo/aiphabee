/* @ds-bundle: {"format":3,"namespace":"AiphaBeeDesignSystem_599c13","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CardHeader","sourcePath":"components/core/Card.jsx"},{"name":"CardTitle","sourcePath":"components/core/Card.jsx"},{"name":"CardDescription","sourcePath":"components/core/Card.jsx"},{"name":"CardContent","sourcePath":"components/core/Card.jsx"},{"name":"CardFooter","sourcePath":"components/core/Card.jsx"},{"name":"RatingStars","sourcePath":"components/data/RatingStars.jsx"},{"name":"ScoreMeter","sourcePath":"components/data/ScoreMeter.jsx"},{"name":"StatCard","sourcePath":"components/data/StatCard.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"BeeNote","sourcePath":"components/mascot/BeeNote.jsx"},{"name":"ComparePanel","sourcePath":"components/mascot/ComparePanel.jsx"},{"name":"ForageLoader","sourcePath":"components/mascot/ForageLoader.jsx"},{"name":"Hexvatar","sourcePath":"components/mascot/Hexvatar.jsx"},{"name":"MascotState","sourcePath":"components/mascot/MascotState.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"e2d7c31531c7","components/core/Button.jsx":"b23df844a0cd","components/core/Card.jsx":"01bb4c714f80","components/data/RatingStars.jsx":"9783276d967f","components/data/ScoreMeter.jsx":"7644e4bc13d8","components/data/StatCard.jsx":"2a44304f05ab","components/forms/Input.jsx":"6304b90ddc18","components/mascot/BeeNote.jsx":"ccc8a18b04f5","components/mascot/ComparePanel.jsx":"0257df0e1c1f","components/mascot/ForageLoader.jsx":"0fdd97a6c9bb","components/mascot/Hexvatar.jsx":"0203298c76ee","components/mascot/MascotState.jsx":"92735921fe51","ui_kits/ipo-agent/app.jsx":"07071f63968e","ui_kits/ipo-agent/home.jsx":"0150a9e07dd3","ui_kits/ipo-agent/research.jsx":"ddce36ee3ffe"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AiphaBeeDesignSystem_599c13 = window.AiphaBeeDesignSystem_599c13 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee Badge — the product's signal pill. Tones map to the
 * data-viz semantic tokens (sentiment, demand, status). `soft`
 * (tinted) by default; `solid` for emphasis, `outline` for quiet.
 */

const TONES = {
  honey: {
    c: 'var(--honey-700)',
    solid: 'var(--honey-500)',
    on: 'var(--ink-800)',
    soft: 'var(--honey-50)'
  },
  navy: {
    c: 'var(--ink-800)',
    solid: 'var(--ink-800)',
    on: 'var(--text-inverse)',
    soft: 'var(--neutral-100)'
  },
  neutral: {
    c: 'var(--neutral-600)',
    solid: 'var(--neutral-500)',
    on: 'var(--text-inverse)',
    soft: 'var(--neutral-100)'
  },
  bullish: {
    c: 'var(--green-600)',
    solid: 'var(--green-500)',
    on: 'var(--text-inverse)',
    soft: 'var(--green-50)'
  },
  bearish: {
    c: 'var(--red-600)',
    solid: 'var(--red-500)',
    on: 'var(--text-inverse)',
    soft: 'var(--red-50)'
  },
  ai: {
    c: 'var(--violet-600)',
    solid: 'var(--violet-500)',
    on: 'var(--text-inverse)',
    soft: 'var(--violet-50)'
  },
  info: {
    c: 'var(--blue-500)',
    solid: 'var(--blue-500)',
    on: 'var(--text-inverse)',
    soft: 'var(--blue-50)'
  },
  warning: {
    c: '#b45309',
    solid: 'var(--orange-500)',
    on: 'var(--ink-800)',
    soft: '#fff7ed'
  }
};
const PAD = {
  sm: {
    padding: '2px 8px',
    fontSize: 'var(--text-2xs)'
  },
  md: {
    padding: '3px 10px',
    fontSize: 'var(--text-xs)'
  }
};
const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
function Badge({
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
    look = {
      background: t.solid,
      color: t.on,
      border: '1px solid transparent'
    };
  } else if (variant === 'outline') {
    look = {
      background: 'transparent',
      color: t.c,
      border: `1px solid ${t.c}`
    };
  } else {
    look = {
      background: t.soft,
      color: t.c,
      border: '1px solid transparent'
    };
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
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
      ...style
    }
  }, rest), dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: dotShape === 'hex' ? 8 : 6,
      height: dotShape === 'hex' ? 9 : 6,
      borderRadius: dotShape === 'hex' ? 0 : '50%',
      clipPath: dotShape === 'hex' ? HEX_CLIP : 'none',
      flexShrink: 0,
      background: variant === 'solid' ? t.on : t.solid
    }
  }) : null, icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex'
    }
  }, icon) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee Button — honey primary, navy ink, soft lift on hover.
 * Self-contained: styling references the design-system CSS variables.
 */

const SIZES = {
  sm: {
    height: 32,
    padding: '0 12px',
    fontSize: 'var(--text-sm)',
    gap: 6
  },
  md: {
    height: 40,
    padding: '0 18px',
    fontSize: 'var(--text-sm)',
    gap: 8
  },
  lg: {
    height: 48,
    padding: '0 26px',
    fontSize: 'var(--text-base)',
    gap: 10
  }
};
function variantStyle(variant, hover) {
  switch (variant) {
    case 'secondary':
      return {
        background: hover ? 'var(--ink-700)' : 'var(--ink-800)',
        color: 'var(--text-inverse)',
        border: '1px solid transparent'
      };
    case 'outline':
      return {
        background: hover ? 'var(--surface-muted)' : 'transparent',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-default)'
      };
    case 'ghost':
      return {
        background: hover ? 'var(--surface-muted)' : 'transparent',
        color: 'var(--text-primary)',
        border: '1px solid transparent'
      };
    case 'ai':
      return {
        background: hover ? 'var(--violet-600)' : 'var(--violet-500)',
        color: 'var(--text-inverse)',
        border: '1px solid transparent'
      };
    case 'danger':
      return {
        background: hover ? 'var(--red-600)' : 'var(--red-500)',
        color: 'var(--text-inverse)',
        border: '1px solid transparent'
      };
    case 'primary':
    default:
      return {
        background: hover ? 'var(--honey-600)' : 'var(--honey-500)',
        color: 'var(--text-on-honey)',
        border: '1px solid transparent',
        boxShadow: hover ? 'var(--shadow-honey)' : 'none'
      };
  }
}
function Button({
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
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
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
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      flexShrink: 0
    }
  }, icon) : null, children, iconRight ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      flexShrink: 0
    }
  }, iconRight) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee Card — the workhorse surface. White, 12px radius, hairline
 * border, soft navy-tinted shadow. Sub-parts mirror the product's
 * ShadCN card (CardHeader / CardTitle / CardDescription / CardContent /
 * CardFooter). `interactive` adds a hover lift for clickable cards.
 */

function Card({
  interactive = false,
  padded = false,
  children,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => interactive && setHover(false),
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      borderColor: hover ? 'var(--honey-300)' : 'var(--border-subtle)',
      transition: 'box-shadow var(--duration-base) var(--ease-standard), border-color var(--duration-base) var(--ease-standard)',
      overflow: 'hidden',
      ...(padded ? {
        padding: 'var(--space-6)'
      } : {}),
      ...style
    }
  }, rest), children);
}
function CardHeader({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      padding: 'var(--space-6) var(--space-6) var(--space-4)',
      ...style
    }
  }, rest), children);
}
function CardTitle({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("h3", _extends({
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-lg)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-primary)',
      letterSpacing: 'var(--tracking-tight)',
      ...style
    }
  }, rest), children);
}
function CardDescription({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("p", _extends({
    style: {
      margin: '4px 0 0',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      lineHeight: 'var(--leading-normal)',
      ...style
    }
  }, rest), children);
}
function CardContent({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      padding: '0 var(--space-6) var(--space-6)',
      ...style
    }
  }, rest), children);
}
function CardFooter({
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-4) var(--space-6)',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--surface-sunken)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/data/RatingStars.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee RatingStars — institution / quality rating on a 5-star
 * scale. Honey-filled stars with fractional support, optional
 * numeric value and count.
 */

function RatingStars({
  value = 0,
  count = 5,
  size = 16,
  showValue = false,
  reviews,
  color = 'var(--honey-500)',
  emptyColor = 'var(--neutral-300)',
  style = {},
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / count * 100));
  const stars = '★'.repeat(count);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'inline-block',
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size,
      letterSpacing: 2,
      color: emptyColor,
      fontFamily: 'var(--font-sans)'
    }
  }, stars), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: `${pct}%`,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      fontSize: size,
      letterSpacing: 2,
      color,
      fontFamily: 'var(--font-sans)'
    }
  }, stars)), showValue ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-primary)'
    }
  }, value.toFixed(1)) : null, reviews != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, "(", reviews, ")") : null);
}
Object.assign(__ds_scope, { RatingStars });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/RatingStars.jsx", error: String((e && e.message) || e) }); }

// components/data/ScoreMeter.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee ScoreMeter — the signature 0–100 signal gauge used for
 * market sentiment & analysis scores. Big number, a filled track
 * coloured by `tone`, and optional end labels.
 */

const TONE_COLOR = {
  bullish: 'var(--sentiment-bullish)',
  cautious: 'var(--sentiment-cautious)',
  neutral: 'var(--sentiment-neutral)',
  bearish: 'var(--sentiment-bearish)',
  honey: 'var(--honey-500)',
  ai: 'var(--violet-500)'
};
function ScoreMeter({
  value = 0,
  max = 100,
  label,
  tone = 'honey',
  labels,
  showValue = true,
  style = {},
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const color = TONE_COLOR[tone] || TONE_COLOR.honey;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      ...style
    }
  }, rest), label || showValue ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between'
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-muted)'
    }
  }, label) : /*#__PURE__*/React.createElement("span", null), showValue ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-3xl)',
      fontWeight: 'var(--weight-bold)',
      color,
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-subtle)'
    }
  }, "/ ", max)) : null) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: 8,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-muted)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: '100%',
      borderRadius: 'var(--radius-pill)',
      background: color,
      transition: 'width var(--duration-slow) var(--ease-out)'
    }
  })), labels && labels.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)'
    }
  }, labels.map((l, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, l))) : null);
}
Object.assign(__ds_scope, { ScoreMeter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ScoreMeter.jsx", error: String((e && e.message) || e) }); }

// components/data/StatCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee StatCard — the dashboard quick-stat tile. Big number,
 * caption, an icon chip tinted by `tone`, and an optional delta.
 */

const TONE_BG = {
  honey: 'var(--honey-50)',
  navy: 'var(--neutral-100)',
  green: 'var(--green-50)',
  violet: 'var(--violet-50)',
  blue: 'var(--blue-50)',
  red: 'var(--red-50)'
};
const TONE_FG = {
  honey: 'var(--honey-700)',
  navy: 'var(--ink-800)',
  green: 'var(--green-600)',
  violet: 'var(--violet-600)',
  blue: 'var(--blue-500)',
  red: 'var(--red-500)'
};
function StatCard({
  label,
  value,
  icon,
  tone = 'honey',
  delta,
  deltaDirection = 'up',
  style = {},
  ...rest
}) {
  const deltaColor = deltaDirection === 'up' ? 'var(--green-600)' : deltaDirection === 'down' ? 'var(--red-500)' : 'var(--text-muted)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      padding: 'var(--space-5)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-4xl)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-primary)',
      letterSpacing: 'var(--tracking-tight)',
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1
    }
  }, value), delta != null ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-semibold)',
      color: deltaColor
    }
  }, deltaDirection === 'up' ? '▲' : deltaDirection === 'down' ? '▼' : '', " ", delta) : null), icon ? /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      flexShrink: 0,
      borderRadius: 'var(--radius-md)',
      background: TONE_BG[tone] || TONE_BG.honey,
      color: TONE_FG[tone] || TONE_FG.honey,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, icon) : null);
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee Input — labelled text field with honey focus ring.
 * Supports a leading icon, prefix/suffix adornments (e.g. "HKD"),
 * helper text and an error state.
 */

function Input({
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
  const borderColor = error ? 'var(--red-500)' : focus ? 'var(--honey-500)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-primary)'
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
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
      gap: 8
    }
  }, icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: 'var(--text-muted)',
      flexShrink: 0
    }
  }, icon) : null, prefix ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, prefix) : null, /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    onFocus: e => {
      setFocus(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur && rest.onBlur(e);
    }
  }, rest, {
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-primary)',
      height: '100%'
    }
  })), suffix ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, suffix) : null), helper || error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      color: error ? 'var(--red-500)' : 'var(--text-muted)'
    }
  }, error || helper) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/mascot/BeeNote.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee BeeNote — the worker-bee insight block. The mascot
 * (in a honeycomb hexagon) delivers an AI finding in a diligent,
 * hard-working voice. `honey` (light) or `navy` (dark) surface.
 * Replaces the generic "AI" avatar circle.
 */

const HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
function HexMascot({
  src,
  size = 56
}) {
  const border = 3;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--honey-500)',
      clipPath: HEX
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: border,
      background: 'var(--honey-100)',
      clipPath: HEX,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "AiphaBee",
    style: {
      width: '92%',
      height: '92%',
      objectFit: 'contain',
      marginBottom: '-4%'
    }
  })));
}
function BeeNote({
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
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 'var(--space-4)',
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-md)',
      background: dark ? 'var(--ink-800)' : 'var(--honey-50)',
      border: dark ? '1px solid transparent' : '1px solid var(--honey-200)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(HexMascot, {
    src: img,
    size: mascotSize
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginBottom: 5,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-wide)',
      color: dark ? 'var(--honey-400)' : 'var(--honey-800)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\uD83D\uDC1D"), title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-relaxed)',
      color: dark ? 'rgba(255,255,255,0.86)' : 'var(--ink-700)'
    }
  }, children), action ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-3)'
    }
  }, action) : null));
}
Object.assign(__ds_scope, { BeeNote });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/mascot/BeeNote.jsx", error: String((e && e.message) || e) }); }

// components/mascot/ComparePanel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee ComparePanel — the head-to-head "PK" view. The compare
 * worker-bee presides over a hexagon honeycomb header while two
 * candidates (IPOs, tickers, funds) are weighed metric-by-metric.
 * Winning cells get a honey-green highlight; the bee delivers the
 * verdict in the navy footer. Hero-scale mascot — one per screen.
 */

const HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
function Side({
  side
}) {
  if (!side) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 13,
      height: 14,
      clipPath: HEX,
      flexShrink: 0,
      background: side.color || 'var(--honey-500)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-bold)',
      fontSize: 'var(--text-lg)',
      color: 'var(--ink-800)'
    }
  }, side.name), side.ticker ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, side.ticker) : null);
}
function ComparePanel({
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
  const cell = (node, win) => /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-semibold)',
      color: win ? 'var(--green-600)' : 'var(--ink-800)'
    }
  }, node);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-5)',
      padding: 'var(--space-5) var(--space-6)',
      background: 'var(--surface-honey)',
      borderBottom: '1px solid var(--honey-200)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      inset: 0,
      backgroundImage: 'var(--pattern-honeycomb)',
      backgroundSize: '120px auto',
      opacity: 0.4,
      WebkitMaskImage: 'linear-gradient(90deg, transparent, #000)',
      maskImage: 'linear-gradient(90deg, transparent, #000)'
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: img,
    alt: "",
    style: {
      position: 'relative',
      width: mascotSize,
      height: 'auto',
      flexShrink: 0,
      filter: 'drop-shadow(0 8px 16px rgba(26,34,66,0.14))'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 5px',
      fontSize: 'var(--text-2xs)',
      fontWeight: 'var(--weight-bold)',
      letterSpacing: 'var(--tracking-caps)',
      textTransform: 'uppercase',
      color: 'var(--honey-800)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 4px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-2xl)',
      fontWeight: 'var(--weight-extrabold)',
      letterSpacing: 'var(--tracking-tight)',
      color: 'var(--ink-800)'
    }
  }, title), subtitle ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-body)'
    }
  }, subtitle) : null)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-5) var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement(Side, {
    side: left
  }), metrics.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '9px 0',
      borderBottom: i === metrics.length - 1 ? 'none' : '1px dashed var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, m.label), cell(m.left, m.winner === 'left')))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
      padding: '0 var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 42,
      background: 'var(--ink-800)',
      color: '#fff',
      clipPath: HEX,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 'var(--weight-extrabold)',
      fontSize: 'var(--text-sm)'
    }
  }, "VS")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-5) var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement(Side, {
    side: right
  }), metrics.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '9px 0',
      borderBottom: i === metrics.length - 1 ? 'none' : '1px dashed var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, m.label), cell(m.right, m.winner === 'right'))))), verdict ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-4) var(--space-6)',
      background: 'var(--ink-800)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 16,
      height: 18,
      background: 'var(--honey-500)',
      clipPath: HEX,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-sm)'
    }
  }, verdict)) : null);
}
Object.assign(__ds_scope, { ComparePanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/mascot/ComparePanel.jsx", error: String((e && e.message) || e) }); }

// components/mascot/ForageLoader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee ForageLoader — the diligent loading state. The bee
 * "forages" while a honey bar fills the comb. `pill` (compact, navy)
 * or `block` (centered, for full-panel loading). Replaces the
 * generic spinner. Set `done` for the "撒蜜收尾" tail frame — the bee
 * swaps to the honey-finish pose, the bar locks full, and the label
 * switches to `doneLabel`. Keep it briefly, then unmount/route on.
 */

function ForageLoader({
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
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-8)',
        textAlign: 'center',
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("img", {
      src: img,
      alt: "",
      style: {
        width: 96,
        height: 96,
        objectFit: 'contain',
        animation: beeAnim
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
        color: done ? 'var(--green-600)' : 'var(--text-muted)'
      }
    }, text), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 180,
        height: 8,
        borderRadius: 'var(--radius-pill)',
        background: 'var(--surface-muted)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        width: barWidth,
        borderRadius: 'var(--radius-pill)',
        background: 'linear-gradient(90deg, var(--honey-400), var(--honey-500))',
        animation: barAnim
      }
    })));
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: '8px 16px 8px 10px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--ink-800)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("img", {
    src: img,
    alt: "",
    style: {
      height: 28,
      width: 'auto',
      objectFit: 'contain',
      animation: beeAnim
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-semibold)',
      color: '#fff'
    }
  }, text), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 56,
      height: 6,
      borderRadius: 'var(--radius-pill)',
      background: 'rgba(255,255,255,0.18)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      height: '100%',
      width: barWidth,
      borderRadius: 'var(--radius-pill)',
      background: 'linear-gradient(90deg, var(--honey-400), var(--honey-500))',
      animation: barAnim
    }
  })));
}
Object.assign(__ds_scope, { ForageLoader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/mascot/ForageLoader.jsx", error: String((e && e.message) || e) }); }

// components/mascot/Hexvatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee Hexvatar — the signature honeycomb-hexagon container for
 * avatars and icon chips. Layers a hex "border" behind a hex "fill"
 * (clip-path can't stroke), then centers an image or icon on top.
 */

const TONE = {
  honey: {
    solid: 'var(--honey-500)',
    soft: 'var(--honey-100)',
    line: 'var(--honey-500)',
    on: 'var(--ink-800)'
  },
  navy: {
    solid: 'var(--ink-800)',
    soft: 'var(--neutral-100)',
    line: 'var(--ink-800)',
    on: 'var(--honey-400)'
  },
  green: {
    solid: 'var(--green-500)',
    soft: 'var(--green-50)',
    line: 'var(--green-500)',
    on: '#fff'
  },
  violet: {
    solid: 'var(--violet-500)',
    soft: 'var(--violet-50)',
    line: 'var(--violet-500)',
    on: '#fff'
  },
  red: {
    solid: 'var(--red-500)',
    soft: 'var(--red-50)',
    line: 'var(--red-500)',
    on: '#fff'
  },
  neutral: {
    solid: 'var(--neutral-200)',
    soft: 'var(--neutral-100)',
    line: 'var(--neutral-300)',
    on: 'var(--ink-800)'
  }
};
const HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
function Hexvatar({
  imgSrc,
  alt = '',
  icon,
  size = 56,
  tone = 'honey',
  variant = 'soft',
  clip = false,
  children,
  style = {},
  ...rest
}) {
  const t = TONE[tone] || TONE.honey;
  const border = Math.max(2, Math.round(size * 0.045));
  let fill, lineColor, content;
  if (variant === 'fill') {
    fill = t.solid;
    lineColor = t.solid;
    content = t.on;
  } else if (variant === 'outline') {
    fill = 'var(--surface-card)';
    lineColor = t.line;
    content = t.line;
  } else {
    fill = t.soft;
    lineColor = t.line;
    content = t.on === '#fff' ? t.solid : t.on;
  }
  const inner = size - border * 2;
  const media = imgSrc ? /*#__PURE__*/React.createElement("img", {
    src: imgSrc,
    alt: alt,
    style: {
      width: clip ? '100%' : '74%',
      height: clip ? '100%' : '74%',
      objectFit: clip ? 'cover' : 'contain',
      clipPath: clip ? HEX : 'none'
    }
  }) : icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      color: content
    }
  }, icon) : children;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: lineColor,
      clipPath: HEX
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: border,
      background: fill,
      clipPath: HEX,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, media));
}
Object.assign(__ds_scope, { Hexvatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/mascot/Hexvatar.jsx", error: String((e && e.message) || e) }); }

// components/mascot/MascotState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AiphaBee MascotState — full mascot illustration for empty / success
 * / error / onboarding states. Centered pose + title + description +
 * optional action. An optional faint honeycomb backdrop frames the bee.
 */

function MascotState({
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
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-8) var(--space-6)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, comb ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: '-8%',
      backgroundImage: 'var(--pattern-honeycomb)',
      backgroundSize: '26px 45px',
      opacity: 0.5,
      WebkitMaskImage: 'radial-gradient(circle at center, #000 30%, transparent 72%)',
      maskImage: 'radial-gradient(circle at center, #000 30%, transparent 72%)',
      pointerEvents: 'none'
    }
  }) : null, /*#__PURE__*/React.createElement("img", {
    src: img,
    alt: "",
    style: {
      position: 'relative',
      width: '100%',
      height: '100%',
      objectFit: 'contain'
    }
  })), title ? /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '6px 0 0',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-xl)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--text-primary)',
      letterSpacing: 'var(--tracking-tight)'
    }
  }, title) : null, description ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 380,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--leading-relaxed)',
      color: 'var(--text-muted)'
    }
  }, description) : null, children ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-3)'
    }
  }, children) : null);
}
Object.assign(__ds_scope, { MascotState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/mascot/MascotState.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ipo-agent/app.jsx
try { (() => {
/* ============================================================
   AiphaBee IPO Agent — UI kit shell
   App router state, nav bar, Lucide icon helper, and mock HK IPO
   data. Views live in home.jsx and research.jsx.
   ============================================================ */

const DS = window.AiphaBeeDesignSystem_599c13;
const {
  Button,
  Badge
} = DS;

/* ---------- Lucide icon helper ---------- */
function Icon({
  name,
  size = 18,
  color,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "luc",
    style: {
      display: 'inline-flex',
      lineHeight: 0,
      color,
      '--ic-size': size + 'px',
      ...style
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": name
  }));
}
function useLucide(dep) {
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
}
const LOGO = '../../assets/aiphabee-mascot.png';
const MASCOT_BP = '../../assets/mascot';

/* ---------- Mock HK IPO data ---------- */
const SECTOR_LABEL = {
  tech: '科技 Technology',
  health: '生物医药 Healthcare',
  fintech: '金融科技 Fintech',
  industrial: '工业 Industrials',
  energy: '能源 Energy'
};
const IPOS = [{
  id: 'honeycomb',
  name: 'Honeycomb Intelligence',
  cn: '蜂巢智能',
  ticker: '2769.HK',
  exchange: 'HKEX',
  sector: 'tech',
  status: 'pending',
  sentiment: 'bullish',
  score: 78,
  tier: 'medium',
  tierLabel: '中盘股',
  offer: 24.80,
  raiseHKD: '4.2B',
  mcapHKD: '38.6B',
  listing: 'Jun 24, 2026',
  sub: 128.4,
  rating: 4.5,
  ratingCount: 21,
  recommendation: 'strong_buy',
  confidence: 86,
  desc: 'AI 投研基础设施服务商，为机构提供多模型估值与尽调自动化。Cornerstone 阵容强劲，超额认购火爆。',
  dims: [{
    k: 'Chip',
    label: '筹码分布',
    score: 82
  }, {
    k: 'Sponsor',
    label: '保荐质量',
    score: 88
  }, {
    k: 'Underwriter',
    label: '承销实力',
    score: 74
  }, {
    k: 'Sector',
    label: '板块动能',
    score: 90
  }, {
    k: 'Fundamentals',
    label: '基本面',
    score: 68
  }, {
    k: 'Cornerstone',
    label: '基石质量',
    score: 84
  }],
  institutions: [{
    name: 'Morgan Stanley',
    role: '联席保荐人',
    rating: 5
  }, {
    name: 'CICC 中金公司',
    role: '联席保荐人',
    rating: 4.5
  }, {
    name: 'Goldman Sachs',
    role: '账簿管理人',
    rating: 4
  }],
  cornerstones: [{
    name: 'Hillhouse 高瓴',
    amount: 'HKD 600M',
    pct: 14.3
  }, {
    name: 'GIC Singapore',
    amount: 'HKD 420M',
    pct: 10.0
  }, {
    name: 'Tencent 腾讯',
    amount: 'HKD 380M',
    pct: 9.0
  }],
  aiNote: '科技板块情绪向好叠加优质基石阵容，128× 超额认购显示散户与机构需求旺盛。建议关注首日开盘价，回调至招股价上沿可逢低布局。'
}, {
  id: 'lotus',
  name: 'Lotus Digital Pay',
  cn: '莲花数科',
  ticker: '2611.HK',
  exchange: 'HKEX',
  sector: 'fintech',
  status: 'pending',
  sentiment: 'bullish',
  score: 71,
  tier: 'large',
  tierLabel: '大盘股',
  offer: 18.20,
  raiseHKD: '6.8B',
  mcapHKD: '92.1B',
  listing: 'Jun 27, 2026',
  sub: 64.2,
  rating: 4,
  ratingCount: 18,
  recommendation: 'buy',
  confidence: 74,
  desc: '东南亚跨境支付与数字钱包龙头，盈利稳健，监管护城河深厚。',
  dims: [{
    k: 'Chip',
    label: '筹码分布',
    score: 70
  }, {
    k: 'Sponsor',
    label: '保荐质量',
    score: 80
  }, {
    k: 'Underwriter',
    label: '承销实力',
    score: 78
  }, {
    k: 'Sector',
    label: '板块动能',
    score: 66
  }, {
    k: 'Fundamentals',
    label: '基本面',
    score: 82
  }, {
    k: 'Cornerstone',
    label: '基石质量',
    score: 72
  }],
  institutions: [{
    name: 'JPMorgan',
    role: '联席保荐人',
    rating: 4.5
  }, {
    name: 'UBS',
    role: '账簿管理人',
    rating: 4
  }, {
    name: 'Huatai 华泰',
    role: '账簿管理人',
    rating: 3.5
  }],
  cornerstones: [{
    name: 'Temasek 淡马锡',
    amount: 'HKD 800M',
    pct: 11.8
  }, {
    name: 'BlackRock',
    amount: 'HKD 500M',
    pct: 7.4
  }],
  aiNote: '基本面扎实但板块动能一般，64× 认购属健康区间。适合稳健型投资者中长期持有。'
}, {
  id: 'pearl',
  name: 'Pearl River Biotech',
  cn: '珠江生物',
  ticker: '2197.HK',
  exchange: 'HKEX',
  sector: 'health',
  status: 'priced',
  sentiment: 'cautious',
  score: 54,
  tier: 'small',
  tierLabel: '小盘股',
  offer: 9.60,
  raiseHKD: '1.1B',
  mcapHKD: '8.4B',
  listing: 'Jun 20, 2026',
  sub: 12.6,
  rating: 3.5,
  ratingCount: 11,
  recommendation: 'hold',
  confidence: 61,
  desc: '创新药企，核心管线处于 II 期临床。未盈利，估值依赖里程碑预期。',
  dims: [{
    k: 'Chip',
    label: '筹码分布',
    score: 58
  }, {
    k: 'Sponsor',
    label: '保荐质量',
    score: 62
  }, {
    k: 'Underwriter',
    label: '承销实力',
    score: 55
  }, {
    k: 'Sector',
    label: '板块动能',
    score: 48
  }, {
    k: 'Fundamentals',
    label: '基本面',
    score: 40
  }, {
    k: 'Cornerstone',
    label: '基石质量',
    score: 60
  }],
  institutions: [{
    name: 'CICC 中金公司',
    role: '独家保荐人',
    rating: 4
  }, {
    name: 'CMB Intl 招银国际',
    role: '账簿管理人',
    rating: 3.5
  }],
  cornerstones: [{
    name: 'Qiming 启明创投',
    amount: 'HKD 220M',
    pct: 20.0
  }],
  aiNote: '18A 未盈利生物科技，波动较大。基本面评分偏低，建议小仓位参与并严设止损。'
}, {
  id: 'apex',
  name: 'Apex Logistics',
  cn: '顶峰物流',
  ticker: '9699.HK',
  exchange: 'HKEX',
  sector: 'industrial',
  status: 'pending',
  sentiment: 'neutral',
  score: 49,
  tier: 'medium',
  tierLabel: '中盘股',
  offer: 13.40,
  raiseHKD: '2.4B',
  mcapHKD: '21.0B',
  listing: 'Jun 30, 2026',
  sub: 6.8,
  rating: 3,
  ratingCount: 9,
  recommendation: 'hold',
  confidence: 55,
  desc: '区域智能仓储与冷链物流运营商，现金流稳定，成长性中性。',
  dims: [{
    k: 'Chip',
    label: '筹码分布',
    score: 50
  }, {
    k: 'Sponsor',
    label: '保荐质量',
    score: 58
  }, {
    k: 'Underwriter',
    label: '承销实力',
    score: 52
  }, {
    k: 'Sector',
    label: '板块动能',
    score: 44
  }, {
    k: 'Fundamentals',
    label: '基本面',
    score: 60
  }, {
    k: 'Cornerstone',
    label: '基石质量',
    score: 38
  }],
  institutions: [{
    name: 'Haitong 海通国际',
    role: '联席保荐人',
    rating: 3.5
  }, {
    name: 'BOCI 中银国际',
    role: '账簿管理人',
    rating: 3
  }],
  cornerstones: [],
  aiNote: '需求平淡，6.8× 认购偏冷，缺乏基石支撑。建议观望，待二级市场企稳后再评估。'
}, {
  id: 'greenfield',
  name: 'GreenField Energy',
  cn: '绿野能源',
  ticker: '0586.HK',
  exchange: 'HKEX',
  sector: 'energy',
  status: 'listed',
  sentiment: 'bearish',
  score: 31,
  tier: 'small',
  tierLabel: '小盘股',
  offer: 6.20,
  raiseHKD: '0.9B',
  mcapHKD: '5.6B',
  listing: 'Jun 12, 2026',
  sub: 2.1,
  rating: 2.5,
  ratingCount: 7,
  recommendation: 'sell',
  confidence: 64,
  desc: '光伏组件制造商，行业产能过剩、毛利承压。上市首日破发。',
  dims: [{
    k: 'Chip',
    label: '筹码分布',
    score: 28
  }, {
    k: 'Sponsor',
    label: '保荐质量',
    score: 40
  }, {
    k: 'Underwriter',
    label: '承销实力',
    score: 35
  }, {
    k: 'Sector',
    label: '板块动能',
    score: 22
  }, {
    k: 'Fundamentals',
    label: '基本面',
    score: 30
  }, {
    k: 'Cornerstone',
    label: '基石质量',
    score: 18
  }],
  institutions: [{
    name: 'Guotai Junan 国泰君安',
    role: '独家保荐人',
    rating: 2.5
  }],
  cornerstones: [],
  aiNote: '行业景气度低、认购冷淡且已破发，多维评分全面偏弱。建议规避，等待行业出清信号。'
}];
const SENTIMENT_TONE = {
  bullish: 'bullish',
  cautious: 'warning',
  neutral: 'neutral',
  bearish: 'bearish'
};
const SENTIMENT_LABEL = {
  bullish: '牛市 Bullish',
  cautious: '谨慎乐观',
  neutral: '中性 Neutral',
  bearish: '熊市 Bearish'
};
const STATUS = {
  pending: {
    tone: 'honey',
    label: 'Upcoming 招股中'
  },
  priced: {
    tone: 'info',
    label: 'Priced 已定价'
  },
  listed: {
    tone: 'bullish',
    label: 'Listed 已上市'
  },
  withdrawn: {
    tone: 'neutral',
    label: 'Withdrawn'
  }
};
const RATING_CFG = {
  strong_buy: {
    tone: 'bullish',
    label: '强力买入 Strong Buy'
  },
  buy: {
    tone: 'warning',
    label: '买入 Buy'
  },
  hold: {
    tone: 'neutral',
    label: '持有 Hold'
  },
  sell: {
    tone: 'bearish',
    label: '卖出 Sell'
  }
};

/* ---------- Top navigation ---------- */
function NavBar({
  view,
  go
}) {
  const link = (v, label) => /*#__PURE__*/React.createElement("button", {
    onClick: () => go(v),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-medium)',
      color: view === v ? 'var(--ink-800)' : 'var(--text-muted)',
      borderBottom: view === v ? '2px solid var(--honey-500)' : '2px solid transparent',
      padding: '4px 2px'
    }
  }, label);
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 'var(--z-sticky)',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(10px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 24px',
      height: 'var(--nav-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('home'),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'none',
      border: 'none',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: LOGO,
    alt: "AiphaBee",
    style: {
      height: 38,
      width: 'auto'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-xl)',
      fontWeight: 'var(--weight-bold)',
      color: 'var(--ink-800)',
      letterSpacing: 'var(--tracking-tight)'
    }
  }, "IPO\xA0Agent")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 22
    }
  }, link('dashboard', 'Dashboard'), link('listings', 'Browse IPOs'), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => go('dashboard')
  }, "Get Started"))));
}

/* ---------- Root app ---------- */
function App() {
  const [view, setView] = React.useState('home');
  const [selected, setSelected] = React.useState(IPOS[0]);
  useLucide(view);
  const go = v => {
    setView(v);
    window.scrollTo(0, 0);
  };
  const openIpo = ipo => {
    setSelected(ipo);
    go('detail');
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--surface-page)',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement(NavBar, {
    view: view,
    go: go
  }), view === 'home' && /*#__PURE__*/React.createElement(HomeView, {
    go: go,
    openIpo: openIpo
  }), view === 'dashboard' && /*#__PURE__*/React.createElement(DashboardView, {
    go: go,
    openIpo: openIpo
  }), view === 'listings' && /*#__PURE__*/React.createElement(ListingsView, {
    openIpo: openIpo
  }), view === 'detail' && /*#__PURE__*/React.createElement(DetailView, {
    ipo: selected,
    go: go
  }));
}
Object.assign(window, {
  Icon,
  useLucide,
  App,
  NavBar,
  IPOS,
  SECTOR_LABEL,
  SENTIMENT_TONE,
  SENTIMENT_LABEL,
  STATUS,
  RATING_CFG,
  LOGO,
  MASCOT_BP
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ipo-agent/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ipo-agent/home.jsx
try { (() => {
/* ============================================================
   AiphaBee IPO Agent — Home & Dashboard views
   ============================================================ */
const _DS = window.AiphaBeeDesignSystem_599c13;
const {
  Button: HBtn,
  Badge: HBadge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  ScoreMeter,
  RatingStars,
  BeeNote,
  Hexvatar,
  ForageLoader
} = _DS;
const SHELL = {
  maxWidth: 'var(--container-max)',
  margin: '0 auto',
  padding: '0 24px'
};

/* ---------- Market sentiment panel (recreates MarketSentimentCard) ---------- */
function MarketSentimentPanel() {
  return /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(CardTitle, null, "\u5E02\u573A\u60C5\u7EEA\u6307\u6807 \xB7 HKEX"), /*#__PURE__*/React.createElement(CardDescription, null, "\u6700\u540E\u66F4\u65B0 5 \u5206\u949F\u524D \xB7 30 \u65E5\u7A97\u53E3")), /*#__PURE__*/React.createElement(HBadge, {
    tone: "bullish",
    dot: true
  }, "\u8C28\u614E\u4E50\u89C2 \u2192 \u725B\u5E02"))), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(ScoreMeter, {
    label: "\u60C5\u7EEA\u6307\u6570 Sentiment Index",
    value: 72,
    tone: "bullish",
    labels: ['极度悲观', '中性', '极度乐观']
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(BeeNote, {
    basePath: MASCOT_BP,
    pose: "insight",
    title: "\u5DE5\u8702\u6D1E\u5BDF \xB7 \u5DF2\u4E3A\u60A8\u52E4\u52B3\u641C\u7F57"
  }, "\u6E2F\u7F8E\u80A1 IPO \u5E02\u573A\u60C5\u7EEA\u56DE\u6696\uFF0C\u79D1\u6280\u4E0E\u91D1\u878D\u79D1\u6280\u677F\u5757\u8BA4\u8D2D\u706B\u7206\u3002\u5EFA\u8BAE\u4F18\u5148\u5173\u6CE8\u57FA\u77F3\u9635\u5BB9\u5F3A\u52B2\u3001\u8D85\u989D\u8BA4\u8D2D 50\xD7 \u4EE5\u4E0A\u7684\u6807\u7684\u3002"))));
}
function FeatureCard({
  icon,
  tone,
  title,
  body
}) {
  return /*#__PURE__*/React.createElement(Card, {
    padded: true
  }, /*#__PURE__*/React.createElement(Hexvatar, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: icon,
      size: 22
    }),
    tone: tone,
    variant: "soft",
    size: 52
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '16px 0 6px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-xl)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-sm)',
      lineHeight: 1.65,
      color: 'var(--text-body)'
    }
  }, body));
}
function HomeView({
  go,
  openIpo
}) {
  useLucide();
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("section", {
    style: {
      ...SHELL,
      paddingTop: 64,
      paddingBottom: 56,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: MASCOT_BP + '/greeting.png',
    alt: "AiphaBee",
    style: {
      width: 132,
      height: 132,
      objectFit: 'contain',
      marginBottom: 8
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 14px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--honey-50)',
      border: '1px solid var(--honey-200)',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 15,
    color: "var(--honey-700)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      color: 'var(--honey-800)'
    }
  }, "\u6E2F\u80A1 IPO \u6295\u7814 Agent \xB7 Powered by Claude")), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-6xl)',
      fontWeight: 800,
      lineHeight: 1.05,
      letterSpacing: 'var(--tracking-tight)',
      color: 'var(--ink-800)'
    }
  }, "Find the alpha.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--honey-500)'
    }
  }, "Let the bee do the digging.")), /*#__PURE__*/React.createElement("p", {
    style: {
      maxWidth: 640,
      margin: '24px auto 0',
      fontSize: 'var(--text-lg)',
      lineHeight: 1.6,
      color: 'var(--text-body)'
    }
  }, "\u6570\u636E\u9A71\u52A8\u7684\u6E2F\u80A1 IPO \u6295\u7814\u5E73\u53F0\uFF1A\u591A\u6A21\u578B\u4F30\u503C\u3001AI \u62DB\u80A1\u4E66\u89E3\u8BFB\u3001\u57FA\u77F3\u6295\u8D44\u8005\u8BC4\u5206\u4E0E\u5168\u7EF4\u5EA6\u98CE\u9669\u6253\u5206\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'center',
      marginTop: 36
    }
  }, /*#__PURE__*/React.createElement(HBtn, {
    size: "lg",
    onClick: () => go('dashboard'),
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 18
    })
  }, "Start Analysis"), /*#__PURE__*/React.createElement(HBtn, {
    size: "lg",
    variant: "outline",
    onClick: () => go('listings')
  }, "Browse IPOs"))), /*#__PURE__*/React.createElement("section", {
    style: {
      ...SHELL,
      paddingBottom: 56
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 22,
    color: "var(--violet-500)"
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-3xl)',
      fontWeight: 700,
      color: 'var(--ink-800)'
    }
  }, "\u5B9E\u65F6\u5E02\u573A\u6982\u89C8")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--text-muted)'
    }
  }, "AI \u9A71\u52A8\u7684\u5E02\u573A\u60C5\u7EEA\u5206\u6790\uFF0C\u5E2E\u52A9\u60A8\u628A\u63E1 IPO \u6295\u8D44\u65F6\u673A")), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 680,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(MarketSentimentPanel, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('listings'),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      color: 'var(--ink-700)',
      fontWeight: 600,
      fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-sans)'
    }
  }, "\u67E5\u770B\u6240\u6709 IPO \u5206\u6790 ", /*#__PURE__*/React.createElement(Icon, {
    name: "trending-up",
    size: 16
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      ...SHELL,
      paddingBottom: 80
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(FeatureCard, {
    icon: "trending-up",
    tone: "honey",
    title: "Multi-Model Valuation",
    body: "DCF\u3001\u53EF\u6BD4\u516C\u53F8\u4E0E\u5148\u4F8B\u4EA4\u6613\u4E09\u6CD5\u5408\u4E00\uFF0C\u7ED3\u5408 6 \u7EF4\u5206\u5C42\u6A21\u578B\u7ED9\u51FA\u516C\u5141\u4EF7\u503C\u533A\u95F4\u3002"
  }), /*#__PURE__*/React.createElement(FeatureCard, {
    icon: "shield",
    tone: "green",
    title: "Risk Scoring Engine",
    body: "15+ \u8D22\u52A1\u5065\u5EB7\u4E0E\u5E02\u573A\u73AF\u5883\u6307\u6807\uFF0C\u91CF\u5316\u7B79\u7801\u3001\u4FDD\u8350\u3001\u627F\u9500\u4E0E\u57FA\u77F3\u8D28\u91CF\u3002"
  }), /*#__PURE__*/React.createElement(FeatureCard, {
    icon: "sparkles",
    tone: "violet",
    title: "AI Prospectus Analysis",
    body: "Claude \u89E3\u8BFB\u5197\u957F\u62DB\u80A1\u4E66\uFF0C\u79D2\u7EA7\u63D0\u70BC\u5173\u952E\u98CE\u9669\u3001\u4EAE\u70B9\u4E0E\u8BA4\u8D2D\u60C5\u7EEA\u3002"
  }))), /*#__PURE__*/React.createElement(Footer, null));
}
function DashboardView({
  go,
  openIpo
}) {
  useLucide();
  const upcoming = IPOS.filter(i => i.status === 'pending');
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("div", {
    style: {
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...SHELL,
      padding: '32px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "rocket",
    size: 30,
    color: "var(--honey-500)"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-3xl)',
      fontWeight: 700,
      color: 'var(--ink-800)'
    }
  }, "IPO Agent Dashboard"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u6B22\u8FCE\u56DE\u6765\uFF01\u8FD9\u662F\u60A8\u7684\u6E2F\u80A1 IPO \u5E02\u573A\u6982\u89C8\u3002"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...SHELL,
      padding: '32px 24px 80px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Active IPOs \u62DB\u80A1\u4E2D",
    value: "12",
    tone: "honey",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "calendar",
      size: 20
    })
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "\u672C\u5468\u4E0A\u5E02 This week",
    value: "5",
    tone: "green",
    delta: "2 vs \u4E0A\u5468",
    deltaDirection: "up",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "trending-up",
      size: 20
    })
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "\u5E73\u5747\u8D85\u989D\u8BA4\u8D2D",
    value: "42.8\xD7",
    tone: "violet",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "layers",
      size: 20
    })
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Watchlist \u5173\u6CE8",
    value: "7",
    tone: "blue",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "star",
      size: 20
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 24,
      marginTop: 24,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(CardTitle, null, "\u672C\u5468\u62DB\u80A1 Upcoming this week"), /*#__PURE__*/React.createElement("button", {
    onClick: () => go('listings'),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--ink-700)',
      fontWeight: 600,
      fontSize: 'var(--text-xs)',
      fontFamily: 'var(--font-sans)'
    }
  }, "View all \u2192"))), /*#__PURE__*/React.createElement(CardContent, {
    style: {
      padding: 0
    }
  }, upcoming.map((ipo, i) => /*#__PURE__*/React.createElement("button", {
    key: ipo.id,
    onClick: () => openIpo(ipo),
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: '14px 24px',
      background: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      border: 'none',
      borderTop: i ? '1px solid var(--border-subtle)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-primary)'
    }
  }, ipo.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, ipo.ticker)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, ipo.listing, " \xB7 ", SECTOR_LABEL[ipo.sector])), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(HBadge, {
    tone: SENTIMENT_TONE[ipo.sentiment],
    size: "sm",
    dot: true
  }, SENTIMENT_LABEL[ipo.sentiment]), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, ipo.sub, "\xD7")))))), /*#__PURE__*/React.createElement(MarketSentimentPanel, null))), /*#__PURE__*/React.createElement(Footer, null));
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...SHELL,
      padding: '40px 24px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: LOGO,
    alt: "AiphaBee",
    style: {
      height: 44,
      marginBottom: 12
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\xA9 2026 AiphaBee \xB7 IPO Agent. \u6E2F\u80A1 IPO \u6295\u7814 \xB7 Insight \u5E73\u53F0."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '6px 0 0',
      fontSize: 'var(--text-xs)',
      color: 'var(--text-subtle)'
    }
  }, "Data shown is illustrative mock data for design purposes.")));
}
Object.assign(window, {
  HomeView,
  DashboardView,
  MarketSentimentPanel,
  Footer,
  SHELL
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ipo-agent/home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ipo-agent/research.jsx
try { (() => {
/* ============================================================
   AiphaBee IPO Agent — Listings & Detail (research) views
   ============================================================ */
const _RDS = window.AiphaBeeDesignSystem_599c13;
const {
  Button: RBtn,
  Badge: RBadge,
  Card: RCard,
  CardHeader: RCH,
  CardTitle: RCT,
  CardDescription: RCD,
  CardContent: RCC,
  ScoreMeter: RScore,
  RatingStars: RStars,
  BeeNote: RBeeNote,
  MascotState: RMascotState
} = _RDS;

/* ---------- 6-dimension radar chart (SVG) ---------- */
function Radar({
  dims,
  size = 260,
  color = 'var(--chart-1)'
}) {
  const cx = size / 2,
    cy = size / 2,
    r = size / 2 - 34;
  const n = dims.length;
  const pt = (i, rad) => {
    const a = Math.PI * 2 * i / n - Math.PI / 2;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  };
  const rings = [0.25, 0.5, 0.75, 1];
  const gridPoly = f => dims.map((_, i) => pt(i, r * f).join(',')).join(' ');
  const dataPoly = dims.map((d, i) => pt(i, r * (d.score / 100)).join(',')).join(' ');
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    style: {
      display: 'block',
      margin: '0 auto'
    }
  }, rings.map((f, i) => /*#__PURE__*/React.createElement("polygon", {
    key: i,
    points: gridPoly(f),
    fill: "none",
    stroke: "var(--border-subtle)",
    strokeWidth: "1"
  })), dims.map((_, i) => {
    const [x, y] = pt(i, r);
    return /*#__PURE__*/React.createElement("line", {
      key: i,
      x1: cx,
      y1: cy,
      x2: x,
      y2: y,
      stroke: "var(--border-subtle)",
      strokeWidth: "1"
    });
  }), /*#__PURE__*/React.createElement("polygon", {
    points: dataPoly,
    fill: color,
    fillOpacity: "0.28",
    stroke: color,
    strokeWidth: "2",
    strokeLinejoin: "round"
  }), dims.map((d, i) => {
    const [x, y] = pt(i, r * (d.score / 100));
    return /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: x,
      cy: y,
      r: "3.5",
      fill: color
    });
  }), dims.map((d, i) => {
    const [x, y] = pt(i, r + 18);
    return /*#__PURE__*/React.createElement("text", {
      key: i,
      x: x,
      y: y,
      textAnchor: "middle",
      dominantBaseline: "middle",
      fontFamily: "var(--font-sans)",
      fontSize: "11",
      fontWeight: "600",
      fill: "var(--text-muted)"
    }, d.label);
  }));
}

/* ---------- Listings ---------- */
function IpoListCard({
  ipo,
  openIpo
}) {
  const st = STATUS[ipo.status];
  return /*#__PURE__*/React.createElement(RCard, {
    interactive: true,
    onClick: () => openIpo(ipo),
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-lg)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, ipo.name), /*#__PURE__*/React.createElement(RBadge, {
    tone: st.tone,
    size: "sm"
  }, st.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600
    }
  }, ipo.ticker), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, ipo.exchange), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, SECTOR_LABEL[ipo.sector]))), /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-up-right",
    size: 20,
    color: "var(--text-subtle)"
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '12px 0 16px',
      fontSize: 'var(--text-sm)',
      lineHeight: 1.6,
      color: 'var(--text-body)',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    }
  }, ipo.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
      paddingTop: 14,
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Metric, {
    label: "Listing",
    value: ipo.listing.replace(', 2026', '')
  }), /*#__PURE__*/React.createElement(Metric, {
    label: "Offer",
    value: `HK$${ipo.offer.toFixed(2)}`,
    mono: true
  }), /*#__PURE__*/React.createElement(Metric, {
    label: "\u8D85\u989D\u8BA4\u8D2D",
    value: `${ipo.sub}×`,
    mono: true,
    tone: ipo.sub >= 50 ? 'var(--green-600)' : ipo.sub < 5 ? 'var(--neutral-500)' : undefined
  }), /*#__PURE__*/React.createElement(Metric, {
    label: "Sentiment",
    value: /*#__PURE__*/React.createElement(RBadge, {
      tone: SENTIMENT_TONE[ipo.sentiment],
      size: "sm",
      dot: true
    }, ipo.sentiment)
  }))));
}
function Metric({
  label,
  value,
  mono,
  tone
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)',
      marginBottom: 3
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: tone || 'var(--text-primary)'
    }
  }, value));
}
function ListingsView({
  openIpo
}) {
  useLucide();
  const [filter, setFilter] = React.useState('All');
  const chips = ['All', 'Upcoming', 'Priced', 'Listed', 'HKEX'];
  const shown = IPOS.filter(i => filter === 'All' || filter === 'HKEX' ? true : filter === 'Upcoming' ? i.status === 'pending' : filter === 'Priced' ? i.status === 'priced' : filter === 'Listed' ? i.status === 'listed' : true);
  return /*#__PURE__*/React.createElement("main", {
    style: {
      ...SHELL,
      padding: '40px 24px 80px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: '0 0 6px',
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-4xl)',
      fontWeight: 700,
      color: 'var(--ink-800)'
    }
  }, "IPO Listings"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 24px',
      fontSize: 'var(--text-lg)',
      color: 'var(--text-muted)'
    }
  }, "\u6E2F\u80A1 IPO \u5168\u7EF4\u5EA6 AI \u4F30\u503C\u4E0E\u98CE\u9669\u5206\u6790"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      marginBottom: 28
    }
  }, chips.map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setFilter(c),
    style: {
      padding: '8px 16px',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      border: '1px solid ' + (filter === c ? 'var(--honey-500)' : 'var(--border-default)'),
      background: filter === c ? 'var(--honey-500)' : 'var(--surface-card)',
      color: filter === c ? 'var(--ink-800)' : 'var(--text-body)'
    }
  }, c))), shown.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20
    }
  }, shown.map(ipo => /*#__PURE__*/React.createElement(IpoListCard, {
    key: ipo.id,
    ipo: ipo,
    openIpo: openIpo
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)'
    }
  }, /*#__PURE__*/React.createElement(RMascotState, {
    basePath: MASCOT_BP,
    pose: "empty",
    title: "\u8FD9\u4E2A\u7B5B\u9009\u4E0B\u8FD8\u6CA1\u6709\u6807\u7684",
    description: "\u6362\u4E2A\u7B5B\u9009\u6761\u4EF6\uFF0C\u5DE5\u8702\u7EE7\u7EED\u4E3A\u4F60\u91C7\u96C6\u6E2F\u7F8E\u80A1\u7684\u65B0\u673A\u4F1A\u3002"
  })), /*#__PURE__*/React.createElement(Footer, null));
}

/* ---------- Detail (research view) ---------- */
function DetailView({
  ipo,
  go
}) {
  useLucide();
  const rcfg = RATING_CFG[ipo.recommendation];
  const scoreTone = ipo.sentiment === 'bullish' ? 'bullish' : ipo.sentiment === 'bearish' ? 'bearish' : ipo.sentiment === 'cautious' ? 'cautious' : 'neutral';
  return /*#__PURE__*/React.createElement("main", {
    style: {
      ...SHELL,
      padding: '24px 24px 80px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('listings'),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-sans)',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 16
  }), " Back to listings"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 20,
      flexWrap: 'wrap',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-4xl)',
      fontWeight: 700,
      color: 'var(--ink-800)'
    }
  }, ipo.name), /*#__PURE__*/React.createElement(RBadge, {
    tone: STATUS[ipo.status].tone
  }, STATUS[ipo.status].label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 'var(--text-base)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      color: 'var(--text-body)'
    }
  }, ipo.ticker), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, ipo.cn), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, SECTOR_LABEL[ipo.sector]))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(RBadge, {
    tone: SENTIMENT_TONE[ipo.sentiment],
    variant: "solid",
    dot: true
  }, SENTIMENT_LABEL[ipo.sentiment]), /*#__PURE__*/React.createElement(RBtn, {
    variant: "ai",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "sparkles",
      size: 16
    })
  }, "Ask the Bee"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 14,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(KV, {
    label: "Offer Price",
    value: `HK$${ipo.offer.toFixed(2)}`
  }), /*#__PURE__*/React.createElement(KV, {
    label: "Total Raise",
    value: `HK$${ipo.raiseHKD}`
  }), /*#__PURE__*/React.createElement(KV, {
    label: "Market Cap",
    value: `HK$${ipo.mcapHKD}`
  }), /*#__PURE__*/React.createElement(KV, {
    label: "\u8D85\u989D\u8BA4\u8D2D",
    value: `${ipo.sub}×`,
    tone: ipo.sub >= 50 ? 'var(--green-600)' : ipo.sub < 5 ? 'var(--neutral-500)' : 'var(--text-primary)'
  }), /*#__PURE__*/React.createElement(KV, {
    label: "Listing Date",
    value: ipo.listing.replace(', 2026', '')
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.3fr 1fr',
      gap: 24,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(RCard, null, /*#__PURE__*/React.createElement(RCH, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(RCT, null, "\u5206\u5C42\u5206\u6790 Tier Analysis"), /*#__PURE__*/React.createElement(RCD, null, "6 \u7EF4\u667A\u80FD\u8BC4\u4F30 \xB7 ", ipo.tierLabel)), /*#__PURE__*/React.createElement(RBadge, {
    tone: rcfg.tone,
    variant: "solid"
  }, rcfg.label))), /*#__PURE__*/React.createElement(RCC, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      background: 'var(--surface-muted)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u7EFC\u5408\u8BC4\u5206 Overall"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--text-5xl)',
      fontWeight: 800,
      color: 'var(--honey-500)',
      lineHeight: 1
    }
  }, ipo.score), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-subtle)'
    }
  }, "/ 100"))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      marginBottom: 4
    }
  }, "\u7F6E\u4FE1\u5EA6 Confidence"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-2xl)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, ipo.confidence, "%"))), /*#__PURE__*/React.createElement(Radar, {
    dims: ipo.dims
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      marginTop: 8
    }
  }, ipo.dims.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: d.k
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 'var(--text-sm)',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-body)',
      fontWeight: 500
    }
  }, d.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      color: 'var(--text-primary)'
    }
  }, d.score)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--surface-muted)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${d.score}%`,
      height: '100%',
      borderRadius: 'var(--radius-pill)',
      background: `var(--chart-${i + 1})`
    }
  }))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(RCard, null, /*#__PURE__*/React.createElement(RCH, null, /*#__PURE__*/React.createElement(RCT, null, "\u5E02\u573A\u60C5\u7EEA Sentiment"), /*#__PURE__*/React.createElement(RCD, null, "\u8BE5\u6807\u7684 30 \u65E5\u60C5\u7EEA\u6307\u6570")), /*#__PURE__*/React.createElement(RCC, null, /*#__PURE__*/React.createElement(RScore, {
    value: ipo.score,
    tone: scoreTone,
    labels: ['极度悲观', '中性', '极度乐观']
  }))), /*#__PURE__*/React.createElement(RCard, null, /*#__PURE__*/React.createElement(RCH, null, /*#__PURE__*/React.createElement(RCT, null, "\u673A\u6784\u8BC4\u7EA7 Institutions"), /*#__PURE__*/React.createElement(RCD, null, "\u4FDD\u8350\u4EBA\u4E0E\u627F\u9500\u56E2\u8D28\u91CF")), /*#__PURE__*/React.createElement(RCC, {
    style: {
      padding: 0
    }
  }, ipo.institutions.map((ins, i) => /*#__PURE__*/React.createElement("div", {
    key: ins.name,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      borderTop: i ? '1px solid var(--border-subtle)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, ins.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)'
    }
  }, ins.role)), /*#__PURE__*/React.createElement(RStars, {
    value: ins.rating,
    size: 15
  }))))), /*#__PURE__*/React.createElement(RCard, null, /*#__PURE__*/React.createElement(RCH, null, /*#__PURE__*/React.createElement(RCT, null, "\u57FA\u77F3\u6295\u8D44\u8005 Cornerstone"), /*#__PURE__*/React.createElement(RCD, null, ipo.cornerstones.length ? `${ipo.cornerstones.length} 名基石` : '暂无基石投资者')), /*#__PURE__*/React.createElement(RCC, {
    style: {
      padding: ipo.cornerstones.length ? 0 : '0 24px 24px'
    }
  }, ipo.cornerstones.length ? ipo.cornerstones.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c.name,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      borderTop: i ? '1px solid var(--border-subtle)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, c.name), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, c.amount), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-muted)'
    }
  }, c.pct, "% of offer")))) : /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)'
    }
  }, "\u8BE5 IPO \u672A\u5F15\u5165\u57FA\u77F3\u6295\u8D44\u8005\uFF0C\u9700\u6C42\u652F\u6491\u8F83\u5F31\u3002"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(RBeeNote, {
    basePath: MASCOT_BP,
    pose: ipo.recommendation === 'sell' ? 'risk' : ipo.recommendation === 'strong_buy' ? 'success' : 'insight',
    tone: "navy",
    title: "AiphaBee \u6295\u8D44\u5EFA\u8BAE",
    action: /*#__PURE__*/React.createElement(RBadge, {
      tone: rcfg.tone,
      variant: "solid",
      size: "sm"
    }, rcfg.label, " \xB7 \u7F6E\u4FE1\u5EA6 ", ipo.confidence, "%")
  }, ipo.aiNote)), /*#__PURE__*/React.createElement(Footer, null));
}
function KV({
  label,
  value,
  tone
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xs)',
      color: 'var(--text-subtle)',
      marginBottom: 5
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--text-lg)',
      fontWeight: 700,
      color: tone || 'var(--text-primary)'
    }
  }, value));
}
Object.assign(window, {
  ListingsView,
  DetailView,
  Radar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ipo-agent/research.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardHeader = __ds_scope.CardHeader;

__ds_ns.CardTitle = __ds_scope.CardTitle;

__ds_ns.CardDescription = __ds_scope.CardDescription;

__ds_ns.CardContent = __ds_scope.CardContent;

__ds_ns.CardFooter = __ds_scope.CardFooter;

__ds_ns.RatingStars = __ds_scope.RatingStars;

__ds_ns.ScoreMeter = __ds_scope.ScoreMeter;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.BeeNote = __ds_scope.BeeNote;

__ds_ns.ComparePanel = __ds_scope.ComparePanel;

__ds_ns.ForageLoader = __ds_scope.ForageLoader;

__ds_ns.Hexvatar = __ds_scope.Hexvatar;

__ds_ns.MascotState = __ds_scope.MascotState;

})();
