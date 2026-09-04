/* @ds-bundle: {"format":3,"namespace":"GoroutineGoConcurrencyTrainerDesignSystem_634a70","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Callout","sourcePath":"components/core/Callout.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CodeBlock","sourcePath":"components/core/CodeBlock.jsx"},{"name":"Kbd","sourcePath":"components/core/Kbd.jsx"},{"name":"Logo","sourcePath":"components/core/Logo.jsx"},{"name":"ProgressBar","sourcePath":"components/core/ProgressBar.jsx"},{"name":"SegmentedControl","sourcePath":"components/core/SegmentedControl.jsx"},{"name":"TaskListItem","sourcePath":"components/core/TaskListItem.jsx"},{"name":"Terminal","sourcePath":"components/core/Terminal.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"9a73360bd017","components/core/Button.jsx":"a90b7ac9406a","components/core/Callout.jsx":"9506f0203bd8","components/core/Card.jsx":"880dae40ae9f","components/core/CodeBlock.jsx":"b90f7145d67b","components/core/Kbd.jsx":"da7f51c76d38","components/core/Logo.jsx":"eac23405ab73","components/core/ProgressBar.jsx":"89cd41c7534f","components/core/SegmentedControl.jsx":"077f881c7055","components/core/TaskListItem.jsx":"ea23dfe0248a","components/core/Terminal.jsx":"4ee718883e26","ui_kits/trainer/trainer.jsx":"d15f6a3d26ac"},"inlinedExternals":[],"unexposedExports":[{"name":"highlightGo","sourcePath":"components/core/CodeBlock.jsx"}]} */

(() => {

const __ds_ns = (window.GoroutineGoConcurrencyTrainerDesignSystem_634a70 = window.GoroutineGoConcurrencyTrainerDesignSystem_634a70 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Badge — compact status / difficulty / meta pill.
 * variant: 'status' (with dot) | 'difficulty' | 'neutral' | 'count'
 * tone:   'pass' | 'fail' | 'timeout' | 'info' | 'neutral' | 'easy' | 'medium' | 'hard'
 */
function Badge({
  children,
  variant = 'neutral',
  tone = 'neutral',
  dot,
  size = 'md',
  style,
  ...rest
}) {
  const toneMap = {
    pass: {
      fg: 'var(--success-fg)',
      bg: 'var(--success-bg)',
      bd: 'var(--success-border)',
      dot: 'var(--success)'
    },
    fail: {
      fg: 'var(--error-fg)',
      bg: 'var(--error-bg)',
      bd: 'var(--error-border)',
      dot: 'var(--error)'
    },
    timeout: {
      fg: 'var(--warning-fg)',
      bg: 'var(--warning-bg)',
      bd: 'var(--warning-border)',
      dot: 'var(--warning)'
    },
    info: {
      fg: 'var(--accent-text)',
      bg: 'var(--info-bg)',
      bd: 'var(--info-border)',
      dot: 'var(--accent)'
    },
    easy: {
      fg: 'var(--diff-easy)',
      bg: 'var(--success-bg)',
      bd: 'var(--success-border)',
      dot: 'var(--diff-easy)'
    },
    medium: {
      fg: 'var(--diff-medium)',
      bg: 'var(--warning-bg)',
      bd: 'var(--warning-border)',
      dot: 'var(--diff-medium)'
    },
    hard: {
      fg: 'var(--diff-hard)',
      bg: 'var(--error-bg)',
      bd: 'var(--error-border)',
      dot: 'var(--diff-hard)'
    },
    neutral: {
      fg: 'var(--text-secondary)',
      bg: 'var(--bg-elevated)',
      bd: 'var(--border-default)',
      dot: 'var(--text-tertiary)'
    }
  }[tone];
  const sz = size === 'sm' ? {
    h: 18,
    px: 6,
    font: 'var(--label-xs)',
    gap: 5,
    dot: 5
  } : {
    h: 22,
    px: 8,
    font: 'var(--label-sm)',
    gap: 6,
    dot: 6
  };
  const showDot = dot ?? (variant === 'status' || variant === 'difficulty');
  const mono = variant === 'count';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: sz.gap,
      height: sz.h,
      padding: `0 ${sz.px}px`,
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
      fontSize: sz.font,
      fontWeight: 'var(--fw-medium)',
      letterSpacing: '0.01em',
      color: toneMap.fg,
      background: toneMap.bg,
      border: `var(--border-width) solid ${toneMap.bd}`,
      borderRadius: variant === 'count' ? 'var(--radius-sm)' : 'var(--radius-pill)',
      whiteSpace: 'nowrap',
      textTransform: variant === 'difficulty' ? 'capitalize' : 'none',
      ...style
    }
  }, rest), showDot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: sz.dot,
      height: sz.dot,
      borderRadius: '50%',
      background: toneMap.dot,
      flexShrink: 0
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — primary action control for the Goroutine system.
 * Hierarchies: accent (filled blue), primary (filled neutral/white-on-dark),
 * secondary (outlined), ghost (text), danger (destructive).
 */
function Button({
  children,
  hierarchy = 'accent',
  size = 'md',
  iconLeft,
  iconRight,
  iconOnly = false,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  style,
  ...rest
}) {
  const sizes = {
    sm: {
      h: 32,
      px: 12,
      font: 'var(--label-md)',
      gap: 6,
      icon: 15,
      radius: 'var(--radius-sm)'
    },
    md: {
      h: 40,
      px: 16,
      font: 'var(--label-lg)',
      gap: 8,
      icon: 17,
      radius: 'var(--radius-md)'
    },
    lg: {
      h: 48,
      px: 22,
      font: 'var(--body-md)',
      gap: 8,
      icon: 19,
      radius: 'var(--radius-md)'
    }
  }[size];
  const palettes = {
    accent: {
      bg: 'var(--accent)',
      fg: 'var(--accent-fg)',
      bd: 'transparent',
      bgHover: 'var(--accent-hover)',
      bgActive: 'var(--accent-pressed)'
    },
    primary: {
      bg: 'var(--text-primary)',
      fg: 'var(--text-inverse)',
      bd: 'transparent',
      bgHover: '#ffffff',
      bgActive: 'var(--grey-200)'
    },
    secondary: {
      bg: 'transparent',
      fg: 'var(--text-primary)',
      bd: 'var(--border-strong)',
      bgHover: 'var(--bg-hover)',
      bgActive: 'var(--bg-active)'
    },
    ghost: {
      bg: 'transparent',
      fg: 'var(--text-secondary)',
      bd: 'transparent',
      bgHover: 'var(--bg-hover)',
      bgActive: 'var(--bg-active)'
    },
    danger: {
      bg: 'var(--error)',
      fg: '#1a0e10',
      bd: 'transparent',
      bgHover: 'var(--red-300)',
      bgActive: 'var(--red-500)'
    }
  }[hierarchy];
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const isDisabled = disabled || loading;
  const bg = isDisabled ? hierarchy === 'secondary' || hierarchy === 'ghost' ? 'transparent' : 'var(--grey-800)' : active ? palettes.bgActive : hover ? palettes.bgHover : palettes.bg;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: isDisabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: sizes.gap,
      height: sizes.h,
      minWidth: iconOnly ? sizes.h : undefined,
      padding: iconOnly ? 0 : `0 ${sizes.px}px`,
      width: fullWidth ? '100%' : undefined,
      font: undefined,
      fontFamily: 'var(--font-sans)',
      fontSize: sizes.font,
      fontWeight: 'var(--fw-medium)',
      letterSpacing: '-0.002em',
      color: isDisabled ? 'var(--text-disabled)' : palettes.fg,
      background: bg,
      border: `var(--border-width) solid ${isDisabled ? 'var(--border-default)' : palettes.bd}`,
      borderRadius: sizes.radius,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      transition: `background var(--dur-fast) var(--ease-out), border-color var(--dur-fast), transform var(--dur-fast)`,
      transform: active && !isDisabled ? 'scale(0.98)' : 'scale(1)',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      position: 'relative',
      ...style
    }
  }, rest), loading && /*#__PURE__*/React.createElement("span", {
    style: {
      width: sizes.icon,
      height: sizes.icon,
      borderRadius: '50%',
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      opacity: 0.9,
      animation: 'goro-spin 0.7s linear infinite',
      display: 'inline-block'
    }
  }), !loading && iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      width: sizes.icon,
      height: sizes.icon
    }
  }, iconLeft), !iconOnly && !loading && children, !iconOnly && loading && (children ? /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.85
    }
  }, children) : null), iconOnly && !loading && children, !loading && iconRight && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      width: sizes.icon,
      height: sizes.icon
    }
  }, iconRight), /*#__PURE__*/React.createElement("style", null, `@keyframes goro-spin{to{transform:rotate(360deg)}}`));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Callout.jsx
try { (() => {
const TONES = {
  note: {
    fg: 'var(--accent-text)',
    bg: 'var(--info-bg)',
    bd: 'var(--info-border)',
    label: 'Заметка'
  },
  tip: {
    fg: 'var(--success-fg)',
    bg: 'var(--success-bg)',
    bd: 'var(--success-border)',
    label: 'Совет'
  },
  warning: {
    fg: 'var(--warning-fg)',
    bg: 'var(--warning-bg)',
    bd: 'var(--warning-border)',
    label: 'Внимание'
  },
  danger: {
    fg: 'var(--error-fg)',
    bg: 'var(--error-bg)',
    bd: 'var(--error-border)',
    label: 'Грабли'
  }
};
function icon(tone) {
  const c = 'currentColor';
  if (tone === 'warning' || tone === 'danger') return /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
    stroke: c,
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  });
  if (tone === 'tip') return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M9 18h6M10 22h4",
    stroke: c,
    strokeWidth: "2",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z",
    stroke: c,
    strokeWidth: "2",
    fill: "none"
  }));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9.5",
    stroke: c,
    strokeWidth: "2",
    fill: "none"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 11v6M12 7h.01",
    stroke: c,
    strokeWidth: "2",
    strokeLinecap: "round"
  }));
}

/** Callout — note / tip / warning / danger врезка for the textbook. */
function Callout({
  children,
  tone = 'note',
  title,
  style
}) {
  const t = TONES[tone] || TONES.note;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      padding: '14px 16px',
      background: t.bg,
      border: `var(--border-width) solid ${t.bd}`,
      borderRadius: 'var(--radius-md)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    style: {
      color: t.fg,
      flexShrink: 0,
      marginTop: 2
    }
  }, icon(tone)), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--label-md)',
      fontWeight: 'var(--fw-semibold)',
      color: t.fg,
      marginBottom: children ? 4 : 0,
      letterSpacing: '0.01em'
    }
  }, title || t.label), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--body-md)',
      lineHeight: 'var(--body-md-lh)',
      color: 'var(--text-secondary)'
    }
  }, children)));
}
Object.assign(__ds_scope, { Callout });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Callout.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Card — flat elevated surface with hairline border. */
function Card({
  children,
  interactive = false,
  padding = 20,
  as = 'div',
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    onMouseEnter: interactive ? () => setHover(true) : undefined,
    onMouseLeave: interactive ? () => setHover(false) : undefined,
    style: {
      background: 'var(--bg-elevated)',
      border: `var(--border-width) solid ${hover ? 'var(--border-strong)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: typeof padding === 'number' ? `${padding}px` : padding,
      transition: 'border-color var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out), background var(--dur-base)',
      transform: interactive && hover ? 'translateY(-2px)' : 'translateY(0)',
      cursor: interactive ? 'pointer' : 'default',
      boxShadow: interactive && hover ? 'var(--shadow-md)' : 'none',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/CodeBlock.jsx
try { (() => {
/* ── Go tokenizer (lightweight) ──────────────────────────────────────────
   Not a full parser — a pragmatic regex pass good enough for specimen code.
   Returns React spans coloured via the --code-* tokens. */
const GO_KEYWORDS = new Set(['func', 'go', 'chan', 'select', 'for', 'range', 'if', 'else', 'switch', 'case', 'default', 'return', 'defer', 'var', 'const', 'type', 'struct', 'interface', 'map', 'package', 'import', 'break', 'continue', 'fallthrough', 'goto', 'nil', 'true', 'false', 'iota']);
const GO_BUILTINS = new Set(['make', 'len', 'cap', 'append', 'copy', 'close', 'delete', 'new', 'panic', 'recover', 'print', 'println', 'complex', 'real', 'imag']);
const GO_TYPES = new Set(['int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr', 'float32', 'float64', 'complex64', 'complex128', 'byte', 'rune', 'string', 'bool', 'error', 'any']);
function highlightGo(code) {
  const tokenRe = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`[^`]*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d[\d_.eExXa-fA-F]*\b)|([A-Za-z_]\w*)|(\s+)|([^\s\w])/g;
  const out = [];
  let m,
    i = 0;
  while (m = tokenRe.exec(code)) {
    let color = null,
      text = m[0];
    if (m[1]) color = 'var(--code-comment)';else if (m[2]) color = 'var(--code-string)';else if (m[3]) color = 'var(--code-number)';else if (m[4]) {
      if (GO_KEYWORDS.has(text)) color = 'var(--code-keyword)';else if (GO_BUILTINS.has(text)) color = 'var(--code-builtin)';else if (GO_TYPES.has(text)) color = 'var(--code-type)';else {
        const after = code.slice(tokenRe.lastIndex, tokenRe.lastIndex + 1);
        if (after === '(') color = 'var(--code-func)';else color = 'var(--code-text)';
      }
    } else if (m[6]) color = 'var(--code-punct)';
    out.push(color ? /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        color
      }
    }, text) : text);
    i++;
  }
  return out;
}

/**
 * CodeBlock — Go source with optional filename header and line numbers.
 */
function CodeBlock({
  code = '',
  filename,
  language = 'go',
  showLineNumbers = true,
  highlightLines = [],
  style
}) {
  const lines = code.replace(/\n$/, '').split('\n');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--code-bg)',
      border: 'var(--border-width) solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      ...style
    }
  }, filename && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 14px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--text-tertiary)",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 2v6h6"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--code-sm)',
      color: 'var(--text-secondary)'
    }
  }, filename), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-xs)',
      color: 'var(--text-tertiary)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    }
  }, language)), /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      padding: '14px 0',
      overflowX: 'auto',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--code-md)',
      lineHeight: 'var(--code-md-lh)'
    }
  }, /*#__PURE__*/React.createElement("code", {
    style: {
      display: 'block',
      minWidth: 'max-content'
    }
  }, lines.map((ln, idx) => {
    const hot = highlightLines.includes(idx + 1);
    return /*#__PURE__*/React.createElement("span", {
      key: idx,
      style: {
        display: 'flex',
        background: hot ? 'var(--accent-subtle)' : 'transparent',
        boxShadow: hot ? 'inset 2px 0 0 var(--accent)' : 'none'
      }
    }, showLineNumbers && /*#__PURE__*/React.createElement("span", {
      style: {
        flexShrink: 0,
        width: 44,
        paddingRight: 16,
        textAlign: 'right',
        color: 'var(--text-tertiary)',
        userSelect: 'none',
        opacity: 0.7
      }
    }, idx + 1), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        paddingRight: 18,
        paddingLeft: showLineNumbers ? 0 : 16,
        whiteSpace: 'pre',
        color: 'var(--code-text)'
      }
    }, highlightGo(ln), ln === '' ? ' ' : ''));
  }))));
}
Object.assign(__ds_scope, { highlightGo, CodeBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/CodeBlock.jsx", error: String((e && e.message) || e) }); }

// components/core/Kbd.jsx
try { (() => {
/** Kbd — keyboard shortcut chip. Pass keys as children, e.g. "⌘" "↵". */
function Kbd({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("kbd", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 20,
      height: 20,
      padding: '0 5px',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-xs)',
      fontWeight: 'var(--fw-medium)',
      color: 'var(--text-secondary)',
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-strong)',
      borderBottomWidth: 2,
      borderRadius: 'var(--radius-xs)',
      lineHeight: 1,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Kbd });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Kbd.jsx", error: String((e && e.message) || e) }); }

// components/core/Logo.jsx
try { (() => {
/**
 * Logo — the Goroutine wordmark. The mark is two offset arrows forming a
 * "concurrent paths" glyph (channels), in the accent colour.
 */
function Logo({
  size = 22,
  showWordmark = true,
  color = 'var(--text-primary)',
  mark = 'var(--accent)',
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 9,
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 28 28",
    fill: "none",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("rect", {
    width: "28",
    height: "28",
    rx: "7",
    fill: mark
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 10.5h7.5a3.5 3.5 0 0 1 0 7H10l2.4-2.4M8 17.5h-.5",
    stroke: "#fff",
    strokeWidth: "2.1",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "10.5",
    r: "1.4",
    fill: "#fff"
  })), showWordmark && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: size * 0.82,
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: '-0.02em',
      color
    }
  }, "goroutine", /*#__PURE__*/React.createElement("span", {
    style: {
      color: mark
    }
  }, ".")));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Logo.jsx", error: String((e && e.message) || e) }); }

// components/core/ProgressBar.jsx
try { (() => {
/** ProgressBar — determinate track. tone tints the fill. */
function ProgressBar({
  value = 0,
  max = 100,
  tone = 'accent',
  size = 'md',
  showLabel = false,
  label,
  style
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const fill = {
    accent: 'var(--accent)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    neutral: 'var(--text-secondary)'
  }[tone];
  const h = size === 'sm' ? 4 : size === 'lg' ? 10 : 6;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: h,
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-pill)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: '100%',
      background: fill,
      borderRadius: 'var(--radius-pill)',
      transition: 'width var(--dur-slow) var(--ease-out)'
    }
  })), showLabel && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-sm)',
      color: 'var(--text-secondary)',
      whiteSpace: 'nowrap',
      minWidth: 36,
      textAlign: 'right'
    }
  }, label ?? `${Math.round(pct)}%`));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/core/SegmentedControl.jsx
try { (() => {
/**
 * SegmentedControl — tab-like switch. Used for the trainer's
 * "Условие · Теория · Решение" panel and for compact view toggles.
 * options: [{ value, label, icon?, locked?, badge? }]
 */
function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  style
}) {
  const sz = size === 'sm' ? {
    h: 30,
    px: 10,
    font: 'var(--label-md)',
    gap: 6
  } : {
    h: 36,
    px: 14,
    font: 'var(--label-lg)',
    gap: 7
  };
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'inline-flex',
      gap: 2,
      padding: 3,
      width: fullWidth ? '100%' : undefined,
      background: 'var(--bg-inset)',
      border: 'var(--border-width) solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      ...style
    }
  }, options.map(opt => {
    const selected = opt.value === value;
    const locked = opt.locked;
    return /*#__PURE__*/React.createElement("button", {
      key: opt.value,
      role: "tab",
      "aria-selected": selected,
      disabled: locked,
      onClick: () => !locked && onChange && onChange(opt.value),
      style: {
        flex: fullWidth ? 1 : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: sz.gap,
        height: sz.h,
        padding: `0 ${sz.px}px`,
        fontFamily: 'var(--font-sans)',
        fontSize: sz.font,
        fontWeight: 'var(--fw-medium)',
        color: locked ? 'var(--text-disabled)' : selected ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: selected ? 'var(--bg-elevated)' : 'transparent',
        border: `var(--border-width) solid ${selected ? 'var(--border-strong)' : 'transparent'}`,
        borderRadius: 'var(--radius-sm)',
        cursor: locked ? 'not-allowed' : 'pointer',
        boxShadow: selected ? 'var(--shadow-xs)' : 'none',
        transition: 'all var(--dur-fast) var(--ease-out)',
        whiteSpace: 'nowrap'
      }
    }, opt.icon && /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        width: 15,
        height: 15,
        opacity: locked ? 0.6 : 1
      }
    }, opt.icon), opt.label, locked && /*#__PURE__*/React.createElement("svg", {
      width: "12",
      height: "12",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.2",
      style: {
        opacity: 0.7
      }
    }, /*#__PURE__*/React.createElement("rect", {
      x: "5",
      y: "11",
      width: "14",
      height: "9",
      rx: "2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M8 11V7a4 4 0 0 1 8 0v4"
    })), opt.badge != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--label-xs)',
        color: 'var(--text-tertiary)',
        background: 'var(--bg-inset)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xs)',
        padding: '0 5px',
        lineHeight: '15px'
      }
    }, opt.badge));
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/core/TaskListItem.jsx
try { (() => {
/**
 * TaskListItem — a single task row in the trainer's left navigator.
 * Shows index, title, difficulty dot, solved check, active state.
 * status: 'solved' | 'attempted' | 'todo'
 */
function TaskListItem({
  index,
  title,
  difficulty = 'medium',
  status = 'todo',
  active = false,
  type = 'functional',
  collapsed = false,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const diffColor = {
    easy: 'var(--diff-easy)',
    medium: 'var(--diff-medium)',
    hard: 'var(--diff-hard)'
  }[difficulty];
  const marker = status === 'solved' ? /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10",
    fill: "var(--success)",
    opacity: "0.16"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7.5 12.5l3 3 6-6.5",
    stroke: "var(--success)",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })) : status === 'attempted' ? /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9",
    stroke: "var(--warning)",
    strokeWidth: "2",
    strokeDasharray: "3 3"
  })) : /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "8.5",
    stroke: "var(--border-strong)",
    strokeWidth: "1.5"
  }));
  if (collapsed) {
    return /*#__PURE__*/React.createElement("button", {
      onClick: onClick,
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      title: `${index}. ${title}`,
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        border: 'none',
        background: active ? 'var(--accent-subtle)' : hover ? 'var(--bg-hover)' : 'transparent',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        position: 'relative',
        ...style
      }
    }, marker, active && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: -3,
        top: 8,
        bottom: 8,
        width: 2,
        background: 'var(--accent)',
        borderRadius: 2
      }
    }));
  }
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      textAlign: 'left',
      padding: '8px 10px 8px 12px',
      border: 'none',
      position: 'relative',
      background: active ? 'var(--accent-subtle)' : hover ? 'var(--bg-hover)' : 'transparent',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      transition: 'background var(--dur-fast)',
      ...style
    }
  }, active && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: 7,
      bottom: 7,
      width: 2.5,
      background: 'var(--accent)',
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      display: 'inline-flex'
    }
  }, marker), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-sm)',
      color: 'var(--text-tertiary)',
      flexShrink: 0,
      width: 18
    }
  }, String(index).padStart(2, '0')), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--label-md)',
      fontWeight: active ? 'var(--fw-medium)' : 'var(--fw-regular)',
      color: active ? 'var(--text-primary)' : status === 'solved' ? 'var(--text-secondary)' : 'var(--text-primary)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), type === 'review' && /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--violet-400)",
    strokeWidth: "2",
    title: "Code review"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.3-4.3"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: diffColor,
      flexShrink: 0
    },
    title: difficulty
  }));
}
Object.assign(__ds_scope, { TaskListItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/TaskListItem.jsx", error: String((e && e.message) || e) }); }

// components/core/Terminal.jsx
try { (() => {
/* Colorize a `go test -race` line by its leading token. */
function renderLine(line, idx) {
  let color = 'var(--code-text)';
  const t = line.trimStart();
  if (/^(ok|PASS|--- PASS|=== RUN)/.test(t)) color = 'var(--success-fg)';else if (/^(FAIL|--- FAIL|panic:|.*\.go:\d+:)/.test(t)) color = 'var(--error-fg)';else if (/^(WARNING: DATA RACE|==================)/.test(t)) color = 'var(--warning-fg)';else if (/^(Goroutine|Previous|Read|Write|Found|Goexit)/.test(t)) color = 'var(--text-secondary)';else if (t.startsWith('$')) color = 'var(--text-tertiary)';
  return /*#__PURE__*/React.createElement("div", {
    key: idx,
    style: {
      whiteSpace: 'pre-wrap',
      color
    }
  }, line === '' ? '\u00a0' : line);
}
const VERDICTS = {
  idle: {
    label: 'Готов к запуску',
    fg: 'var(--text-tertiary)',
    dot: 'var(--text-tertiary)',
    glow: 'none'
  },
  running: {
    label: 'Выполняется…',
    fg: 'var(--accent-text)',
    dot: 'var(--accent)',
    glow: 'none'
  },
  pass: {
    label: 'PASS',
    fg: 'var(--success-fg)',
    dot: 'var(--success)',
    glow: 'var(--glow-success)'
  },
  fail: {
    label: 'FAIL',
    fg: 'var(--error-fg)',
    dot: 'var(--error)',
    glow: 'var(--glow-error)'
  },
  timeout: {
    label: 'TIMEOUT',
    fg: 'var(--warning-fg)',
    dot: 'var(--warning)',
    glow: 'none'
  },
  compile: {
    label: 'Ошибка компиляции',
    fg: 'var(--error-fg)',
    dot: 'var(--error)',
    glow: 'var(--glow-error)'
  }
};

/**
 * Terminal — the `go test -race` console. A first-class element: a verdict
 * header (status pill + duration) over the raw test output.
 * status: 'idle' | 'running' | 'pass' | 'fail' | 'timeout' | 'compile'
 */
function Terminal({
  status = 'idle',
  output = '',
  duration,
  title = 'go test -race ./...',
  height = 220,
  style
}) {
  const v = VERDICTS[status] || VERDICTS.idle;
  const lines = output ? output.replace(/\n$/, '').split('\n') : [];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg-terminal)',
      border: 'var(--border-width) solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: v.glow,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 12px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(255,255,255,0.015)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: 'var(--grey-700)'
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: 'var(--grey-700)'
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      width: 11,
      height: 11,
      borderRadius: '50%',
      background: 'var(--grey-700)'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--code-sm)',
      color: 'var(--text-tertiary)'
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7
    }
  }, status === 'running' ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: '50%',
      border: '1.5px solid var(--accent)',
      borderTopColor: 'transparent',
      animation: 'goro-spin 0.7s linear infinite'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: v.dot,
      boxShadow: status === 'pass' || status === 'fail' ? `0 0 8px ${v.dot}` : 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-sm)',
      fontWeight: 'var(--fw-medium)',
      color: v.fg,
      letterSpacing: '0.04em'
    }
  }, v.label), duration && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--label-xs)',
      color: 'var(--text-tertiary)'
    }
  }, duration))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: lines.length ? '12px 14px' : 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--code-md)',
      lineHeight: 'var(--code-md-lh)',
      height
    }
  }, lines.length ? lines.map(renderLine) : /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-tertiary)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--code-sm)'
    }
  }, "\u0417\u0430\u043F\u0443\u0441\u0442\u0438 \u0442\u0435\u0441\u0442\u044B, \u0447\u0442\u043E\u0431\u044B \u0443\u0432\u0438\u0434\u0435\u0442\u044C \u0432\u044B\u0432\u043E\u0434")), /*#__PURE__*/React.createElement("style", null, `@keyframes goro-spin{to{transform:rotate(360deg)}}`));
}
Object.assign(__ds_scope, { Terminal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Terminal.jsx", error: String((e && e.message) || e) }); }

// ui_kits/trainer/trainer.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useRef,
  useEffect,
  useCallback
} = React;

/* ── Go syntax highlighter ─────────────────────────────────────────────── */
const KW = new Set(['func', 'go', 'chan', 'select', 'for', 'range', 'if', 'else', 'switch', 'case', 'default', 'return', 'defer', 'var', 'const', 'type', 'struct', 'interface', 'map', 'package', 'import', 'break', 'continue', 'nil', 'true', 'false']);
const BUILTIN = new Set(['make', 'len', 'cap', 'append', 'copy', 'close', 'delete', 'new', 'panic', 'recover']);
const TYPES = new Set(['int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint32', 'uint64', 'float32', 'float64', 'byte', 'rune', 'string', 'bool', 'error', 'any']);
function hl(code) {
  const re = /(\/\/[^\n]*)|(`[^`]*`|"(?:[^"\\]|\\.)*")|(\b\d[\d_.eExX]*\b)|([A-Za-z_]\w*)|(\s+)|([^\s\w])/g;
  const out = [];
  let m,
    i = 0;
  while (m = re.exec(code)) {
    let c = null,
      t = m[0];
    if (m[1]) c = 'var(--code-comment)';else if (m[2]) c = 'var(--code-string)';else if (m[3]) c = 'var(--code-number)';else if (m[4]) {
      if (KW.has(t)) c = 'var(--code-keyword)';else if (BUILTIN.has(t)) c = 'var(--code-builtin)';else if (TYPES.has(t)) c = 'var(--code-type)';else c = code[re.lastIndex] === '(' ? 'var(--code-func)' : 'var(--code-text)';
    } else if (m[6]) c = 'var(--code-punct)';
    out.push(c ? /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        color: c
      }
    }, t) : t);
    i++;
  }
  return out;
}

/* ── Icons ─────────────────────────────────────────────────────────────── */
const Ic = {
  play: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, p), /*#__PURE__*/React.createElement("polygon", {
    points: "6 4 20 12 6 20 6 4"
  })),
  reset: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M3 12a9 9 0 1 0 3-6.7L3 8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 3v5h5"
  })),
  chevL: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "m15 18-6-6 6-6"
  })),
  chevR: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "m9 18 6-6-6-6"
  })),
  panel: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, p), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "16",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 4v16"
  })),
  lock: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2"
  }, p), /*#__PURE__*/React.createElement("rect", {
    x: "5",
    y: "11",
    width: "14",
    height: "9",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 11V7a4 4 0 0 1 8 0v4"
  })),
  check: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10",
    fill: "var(--success)",
    opacity: "0.16"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7.5 12.5l3 3 6-6.5",
    stroke: "var(--success)",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })),
  search: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.3-4.3"
  })),
  doc: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 2v6h6"
  })),
  book: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
  })),
  key: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M9 18h6M10 22h4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2Z"
  }))
};

/* ── Data ──────────────────────────────────────────────────────────────── */
const TOPICS = [{
  n: '01',
  name: 'Каналы и select',
  tasks: [{
    id: 1,
    t: 'Небуферизованный пинг-понг',
    d: 'easy',
    s: 'solved'
  }, {
    id: 2,
    t: 'Мультиплексор на select',
    d: 'medium',
    s: 'solved'
  }, {
    id: 3,
    t: 'Таймаут на select',
    d: 'medium',
    s: 'solved'
  }, {
    id: 4,
    t: 'Закрытие канала-сигнала',
    d: 'easy',
    s: 'solved'
  }]
}, {
  n: '02',
  name: 'Синхронизация и sync',
  tasks: [{
    id: 5,
    t: 'Потокобезопасный счётчик',
    d: 'easy',
    s: 'solved'
  }, {
    id: 6,
    t: 'sync.Once для инициализации',
    d: 'medium',
    s: 'solved'
  }, {
    id: 7,
    t: 'RWMutex-кэш',
    d: 'medium',
    s: 'attempted'
  }, {
    id: 8,
    t: 'WaitGroup без утечки',
    d: 'medium',
    s: 'todo'
  }]
}, {
  n: '03',
  name: 'Паттерны конкурентности',
  tasks: [{
    id: 9,
    t: 'Generator',
    d: 'easy',
    s: 'solved'
  }, {
    id: 10,
    t: 'Fan-out / fan-in',
    d: 'medium',
    s: 'solved'
  }, {
    id: 11,
    t: 'Tee-канал',
    d: 'hard',
    s: 'todo'
  }, {
    id: 12,
    t: 'Семафор на канале',
    d: 'medium',
    s: 'todo'
  }]
}, {
  n: '04',
  name: 'Управление контекстом',
  tasks: [{
    id: 13,
    t: 'Отмена по context',
    d: 'medium',
    s: 'todo'
  }, {
    id: 14,
    t: 'context.WithTimeout',
    d: 'medium',
    s: 'todo'
  }, {
    id: 15,
    t: 'Проброс значений',
    d: 'easy',
    s: 'todo'
  }]
}, {
  n: '05',
  name: 'Highload-задачи',
  tasks: [{
    id: 16,
    t: 'Rate limiter (token bucket)',
    d: 'hard',
    s: 'todo'
  }, {
    id: 17,
    t: 'Дедупликация запросов',
    d: 'hard',
    s: 'todo'
  }, {
    id: 18,
    t: 'Шардированный счётчик',
    d: 'medium',
    s: 'todo'
  }, {
    id: 19,
    t: 'Батчинг записей',
    d: 'medium',
    s: 'todo'
  }, {
    id: 20,
    t: 'Backpressure',
    d: 'hard',
    s: 'todo'
  }]
}, {
  n: '06',
  name: 'Code Review',
  review: true,
  tasks: [{
    id: 21,
    t: 'Найти гонку в кэше',
    d: 'hard',
    s: 'todo',
    rev: true
  }, {
    id: 22,
    t: 'Утечка горутины в воркере',
    d: 'hard',
    s: 'todo',
    rev: true
  }]
}, {
  n: '07',
  name: 'Воркер-пулы и конвейеры',
  tasks: [{
    id: 23,
    t: 'Простой воркер-пул',
    d: 'easy',
    s: 'solved'
  }, {
    id: 24,
    t: 'Пул с результатами',
    d: 'medium',
    s: 'solved'
  }, {
    id: 25,
    t: 'Пул с ограничением параллелизма',
    d: 'medium',
    s: 'active'
  }, {
    id: 26,
    t: 'Конвейер из трёх стадий',
    d: 'medium',
    s: 'todo'
  }, {
    id: 27,
    t: 'Graceful shutdown пула',
    d: 'hard',
    s: 'todo'
  }, {
    id: 28,
    t: 'Динамическое масштабирование',
    d: 'hard',
    s: 'todo'
  }, {
    id: 29,
    t: 'Приоритетная очередь задач',
    d: 'medium',
    s: 'todo'
  }, {
    id: 30,
    t: 'Ретраи с backoff',
    d: 'medium',
    s: 'todo'
  }, {
    id: 31,
    t: 'Сбор ошибок (errgroup)',
    d: 'medium',
    s: 'todo'
  }, {
    id: 32,
    t: 'Конвейер с отменой',
    d: 'hard',
    s: 'todo'
  }]
}];
const STARTER = `package workerpool

import "sync"

// WorkerPool обрабатывает jobs не более чем limit горутинами
// одновременно и возвращает результаты в произвольном порядке.
func WorkerPool(jobs []int, limit int, fn func(int) int) []int {
\tresults := make([]int, len(jobs))
\tsem := make(chan struct{}, limit)
\tvar wg sync.WaitGroup

\tfor i, j := range jobs {
\t\twg.Add(1)
\t\tsem <- struct{}{}
\t\tgo func(i, j int) {
\t\t\tdefer wg.Done()
\t\t\tdefer func() { <-sem }()
\t\t\tresults[i] = fn(j)
\t\t}(i, j)
\t}

\twg.Wait()
\treturn results
}`;
const OUT = {
  pass: `$ go test -race -run TestWorkerPool ./...
=== RUN   TestWorkerPool
=== RUN   TestWorkerPool/limit_1
=== RUN   TestWorkerPool/limit_4
=== RUN   TestWorkerPool/limit_exceeds_jobs
--- PASS: TestWorkerPool (0.42s)
    --- PASS: TestWorkerPool/limit_1 (0.10s)
    --- PASS: TestWorkerPool/limit_4 (0.11s)
    --- PASS: TestWorkerPool/limit_exceeds_jobs (0.09s)
PASS
ok      concurrency/workerpool  1.84s`,
  fail: `$ go test -race -run TestWorkerPool ./...
=== RUN   TestWorkerPool
=== RUN   TestWorkerPool/limit_4
    pool_test.go:48: порядок не важен, но сумма результатов неверна:
        ожидалось 90, получено 48
--- FAIL: TestWorkerPool (0.31s)
    --- FAIL: TestWorkerPool/limit_4 (0.12s)
FAIL
exit status 1
FAIL    concurrency/workerpool  0.93s`,
  race: `$ go test -race -run TestWorkerPool ./...
=== RUN   TestWorkerPool
==================
WARNING: DATA RACE
Write at 0x00c0000b4010 by goroutine 9:
  concurrency/workerpool.WorkerPool.func1()
      pool.go:17 +0x84

Previous write at 0x00c0000b4010 by goroutine 8:
  concurrency/workerpool.WorkerPool.func1()
      pool.go:17 +0x84

Goroutine 9 (running) created at:
  concurrency/workerpool.WorkerPool()
      pool.go:14 +0x1f0
==================
--- FAIL: TestWorkerPool (0.28s)
FAIL    concurrency/workerpool  0.71s`,
  compile: `$ go test -race -run TestWorkerPool ./...
# concurrency/workerpool [build failed]
./pool.go:17:11: undefined: reslts
./pool.go:21:2: wg.Wait undefined (type sync.WaitGroup has no field or method Wait)
FAIL    concurrency/workerpool [build failed]`,
  timeout: `$ go test -race -timeout 10s -run TestWorkerPool ./...
=== RUN   TestWorkerPool
panic: test timed out after 10s
\trunning tests:
\t\tTestWorkerPool (10s)

goroutine 34 [chan send]:
concurrency/workerpool.WorkerPool(...)
      pool.go:13 +0x118
fatal error: all goroutines are asleep - deadlock!
FAIL    concurrency/workerpool  10.00s`
};
const SCENARIOS = [{
  k: 'pass',
  label: 'PASS'
}, {
  k: 'fail',
  label: 'FAIL'
}, {
  k: 'race',
  label: 'Гонка'
}, {
  k: 'compile',
  label: 'Компиляция'
}, {
  k: 'timeout',
  label: 'Timeout'
}];
const verdictOf = k => k === 'pass' ? 'pass' : k === 'timeout' ? 'timeout' : k === 'compile' ? 'compile' : 'fail';

/* ── Sidebar ───────────────────────────────────────────────────────────── */
function Sidebar({
  collapsed,
  onToggle,
  activeId,
  solved
}) {
  const diffColor = d => ({
    easy: 'var(--diff-easy)',
    medium: 'var(--diff-medium)',
    hard: 'var(--diff-hard)'
  })[d];
  const statusOf = tk => solved.has(tk.id) ? 'solved' : tk.id === activeId ? 'active' : tk.s;
  const W = collapsed ? 56 : 300;
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: W,
      flexShrink: 0,
      borderRight: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width var(--dur-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 48,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: collapsed ? '0 10px' : '0 14px',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, !collapsed && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8
    }
  }, Ic.search({
    stroke: 'var(--text-tertiary)'
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-tertiary)'
    }
  }, "\u041F\u043E\u0438\u0441\u043A \u0437\u0430\u0434\u0430\u0447")), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      marginLeft: 'auto',
      fontSize: 11,
      color: 'var(--text-tertiary)',
      display: 'inline-flex',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '1px 5px',
      border: '1px solid var(--border-strong)',
      borderRadius: 4
    }
  }, "\u2318K")))), !collapsed && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 14px',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--text-secondary)'
    }
  }, "\u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441"), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 13,
      color: 'var(--accent-text)',
      fontWeight: 600
    }
  }, 12 + (solved.size > 12 ? 0 : 0), "/32")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      background: 'var(--bg-inset)',
      borderRadius: 999,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '37.5%',
      height: '100%',
      background: 'var(--accent)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: collapsed ? '8px 8px' : '8px 8px'
    }
  }, TOPICS.map(tp => /*#__PURE__*/React.createElement("div", {
    key: tp.n,
    style: {
      marginBottom: collapsed ? 6 : 10
    }
  }, !collapsed && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 8px 4px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      color: 'var(--text-tertiary)'
    }
  }, tp.n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--text-secondary)',
      letterSpacing: '.01em',
      textTransform: 'none'
    }
  }, tp.name), tp.review && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto'
    }
  }, Ic.search({
    stroke: 'var(--violet-400)',
    width: 11,
    height: 11
  }))), collapsed && /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--border-subtle)',
      margin: '4px 6px'
    }
  }), tp.tasks.map(tk => {
    const st = statusOf(tk);
    const active = tk.id === activeId;
    const marker = st === 'solved' ? Ic.check() : st === 'attempted' ? /*#__PURE__*/React.createElement("svg", {
      width: "15",
      height: "15",
      viewBox: "0 0 24 24",
      fill: "none"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "9",
      stroke: "var(--warning)",
      strokeWidth: "2",
      strokeDasharray: "3 3"
    })) : /*#__PURE__*/React.createElement("svg", {
      width: "15",
      height: "15",
      viewBox: "0 0 24 24",
      fill: "none"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "8.5",
      stroke: "var(--border-strong)",
      strokeWidth: "1.5"
    }));
    if (collapsed) return /*#__PURE__*/React.createElement("div", {
      key: tk.id,
      title: `${tk.id}. ${tk.t}`,
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 34,
        borderRadius: 6,
        background: active ? 'var(--accent-subtle)' : 'transparent',
        position: 'relative',
        cursor: 'pointer'
      }
    }, active && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: -2,
        top: 7,
        bottom: 7,
        width: 2,
        background: 'var(--accent)',
        borderRadius: 2
      }
    }), marker);
    return /*#__PURE__*/React.createElement("div", {
      key: tk.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '7px 8px 7px 10px',
        borderRadius: 6,
        position: 'relative',
        cursor: 'pointer',
        background: active ? 'var(--accent-subtle)' : 'transparent'
      },
      onMouseEnter: e => {
        if (!active) e.currentTarget.style.background = 'var(--bg-hover)';
      },
      onMouseLeave: e => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }
    }, active && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 0,
        top: 6,
        bottom: 6,
        width: 2.5,
        background: 'var(--accent)',
        borderRadius: 2
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flexShrink: 0,
        display: 'inline-flex'
      }
    }, marker), /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 12,
        color: 'var(--text-tertiary)',
        width: 18,
        flexShrink: 0
      }
    }, String(tk.id).padStart(2, '0')), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0,
        fontSize: 13,
        color: active ? 'var(--text-primary)' : st === 'solved' ? 'var(--text-secondary)' : 'var(--text-primary)',
        fontWeight: active ? 500 : 400,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, tk.t), tk.rev && /*#__PURE__*/React.createElement("span", {
      style: {
        flexShrink: 0
      }
    }, Ic.search({
      stroke: 'var(--violet-400)',
      width: 12,
      height: 12
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: diffColor(tk.d),
        flexShrink: 0
      }
    }));
  })))), /*#__PURE__*/React.createElement("button", {
    onClick: onToggle,
    style: {
      height: 42,
      border: 'none',
      borderTop: '1px solid var(--border-subtle)',
      background: 'transparent',
      color: 'var(--text-tertiary)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      fontSize: 13
    }
  }, collapsed ? Ic.chevR() : /*#__PURE__*/React.createElement(React.Fragment, null, Ic.chevL(), " \u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C")));
}

/* ── Right panel ───────────────────────────────────────────────────────── */
function RightPanel({
  width,
  tab,
  setTab,
  solutionUnlocked,
  onForceUnlock
}) {
  const tabs = [{
    value: 'cond',
    label: 'Условие'
  }, {
    value: 'theory',
    label: 'Теория'
  }, {
    value: 'sol',
    label: 'Решение',
    locked: !solutionUnlocked
  }];
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width,
      flexShrink: 0,
      borderLeft: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
      display: 'flex',
      flexDirection: 'column',
      minWidth: 300
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 14px',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'inline-flex',
      gap: 2,
      padding: 3,
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-default)',
      borderRadius: 8,
      width: '100%'
    }
  }, tabs.map(tb => {
    const sel = tb.value === tab;
    return /*#__PURE__*/React.createElement("button", {
      key: tb.value,
      disabled: tb.locked,
      onClick: () => !tb.locked && setTab(tb.value),
      style: {
        flex: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 32,
        fontSize: 13,
        fontWeight: 500,
        color: tb.locked ? 'var(--text-disabled)' : sel ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: sel ? 'var(--bg-elevated)' : 'transparent',
        border: `1px solid ${sel ? 'var(--border-strong)' : 'transparent'}`,
        borderRadius: 6,
        cursor: tb.locked ? 'not-allowed' : 'pointer'
      }
    }, tb.label, tb.locked && Ic.lock({
      style: {
        opacity: .7
      }
    }));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px 18px'
    }
  }, tab === 'cond' && /*#__PURE__*/React.createElement(PanelCondition, null), tab === 'theory' && /*#__PURE__*/React.createElement(PanelTheory, null), tab === 'sol' && (solutionUnlocked ? /*#__PURE__*/React.createElement(PanelSolution, null) : /*#__PURE__*/React.createElement(PanelLocked, {
    onForce: onForceUnlock
  }))));
}
const H = ({
  children
}) => /*#__PURE__*/React.createElement("h3", {
  style: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 10px'
  }
}, children);
const P = ({
  children
}) => /*#__PURE__*/React.createElement("p", {
  style: {
    fontSize: 14,
    lineHeight: '22px',
    color: 'var(--text-secondary)',
    margin: '0 0 14px'
  }
}, children);
const Code = ({
  children
}) => /*#__PURE__*/React.createElement("code", {
  className: "mono",
  style: {
    fontSize: 12.5,
    color: 'var(--code-text)',
    background: 'var(--bg-inset)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 4,
    padding: '1px 5px'
  }
}, children);
function PanelCondition() {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 22,
      padding: '0 8px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 500,
      color: 'var(--diff-medium)',
      background: 'var(--warning-bg)',
      border: '1px solid var(--warning-border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'var(--diff-medium)'
    }
  }), "medium"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: 22,
      padding: '0 8px',
      borderRadius: 6,
      fontSize: 12,
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-secondary)',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)'
    }
  }, "functional")), /*#__PURE__*/React.createElement(H, null, "\u041F\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430"), /*#__PURE__*/React.createElement(P, null, "\u0420\u0435\u0430\u043B\u0438\u0437\u0443\u0439 ", /*#__PURE__*/React.createElement(Code, null, "WorkerPool"), ", \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442 \u0441\u0440\u0435\u0437 ", /*#__PURE__*/React.createElement(Code, null, "jobs"), " \u043D\u0435 \u0431\u043E\u043B\u0435\u0435 \u0447\u0435\u043C ", /*#__PURE__*/React.createElement(Code, null, "limit"), " \u0433\u043E\u0440\u0443\u0442\u0438\u043D\u0430\u043C\u0438 \u043E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E. \u041A\u0430\u0436\u0434\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u043F\u0440\u043E\u0433\u043E\u043D\u044F\u0435\u0442\u0441\u044F \u0447\u0435\u0440\u0435\u0437 ", /*#__PURE__*/React.createElement(Code, null, "fn"), "; \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F \u043F\u043E \u0442\u043E\u043C\u0443 \u0436\u0435 \u0438\u043D\u0434\u0435\u043A\u0441\u0443. \u041F\u043E\u0440\u044F\u0434\u043E\u043A \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u043D\u0435 \u0432\u0430\u0436\u0435\u043D \u2014 \u0432\u0430\u0436\u043D\u043E \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0435 \u0438\u043D\u0434\u0435\u043A\u0441\u043E\u0432."), /*#__PURE__*/React.createElement(H, null, "\u0421\u0438\u0433\u043D\u0430\u0442\u0443\u0440\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-default)',
      borderRadius: 8,
      padding: '12px 14px',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("pre", {
    className: "mono",
    style: {
      margin: 0,
      fontSize: 12.5,
      lineHeight: '20px',
      whiteSpace: 'pre-wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--code-keyword)'
    }
  }, "func"), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--code-func)'
    }
  }, "WorkerPool"), "(jobs []", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--code-type)'
    }
  }, "int"), ", limit ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--code-type)'
    }
  }, "int"), ",", '\n', '  ', "fn ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--code-keyword)'
    }
  }, "func"), "(", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--code-type)'
    }
  }, "int"), ") ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--code-type)'
    }
  }, "int"), ") []", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--code-type)'
    }
  }, "int"))), /*#__PURE__*/React.createElement(H, null, "\u0422\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      paddingLeft: 18,
      fontSize: 14,
      lineHeight: '24px',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("li", null, "\u043D\u0435 \u0431\u043E\u043B\u0435\u0435 ", /*#__PURE__*/React.createElement(Code, null, "limit"), " \u043E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0445 \u0433\u043E\u0440\u0443\u0442\u0438\u043D;"), /*#__PURE__*/React.createElement("li", null, "\u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 ", /*#__PURE__*/React.createElement(Code, null, "results[i] == fn(jobs[i])"), ";"), /*#__PURE__*/React.createElement("li", null, "\u0447\u0438\u0441\u0442\u044B\u0439 \u043F\u0440\u043E\u0433\u043E\u043D \u043F\u043E\u0434 ", /*#__PURE__*/React.createElement(Code, null, "-race"), ";"), /*#__PURE__*/React.createElement("li", null, "\u0431\u0435\u0437 \u0443\u0442\u0435\u0447\u0435\u043A \u0433\u043E\u0440\u0443\u0442\u0438\u043D \u043F\u043E\u0441\u043B\u0435 \u0432\u043E\u0437\u0432\u0440\u0430\u0442\u0430.")));
}
function PanelTheory() {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      color: 'var(--accent-text)'
    }
  }, "\u0427\u0438\u0442\u0430\u0442\u044C \u0434\u043E \u0440\u0435\u0448\u0435\u043D\u0438\u044F"), /*#__PURE__*/React.createElement(H, null, /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 12,
      display: 'block'
    }
  }, "\u041E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u0435 \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u0438\u0437\u043C\u0430")), /*#__PURE__*/React.createElement(P, null, "\u041A\u043B\u0430\u0441\u0441\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043F\u0440\u0438\u0451\u043C \u2014 \u0441\u0447\u0451\u0442\u043D\u044B\u0439 \u0441\u0435\u043C\u0430\u0444\u043E\u0440 \u043D\u0430 \u0431\u0443\u0444\u0435\u0440\u0438\u0437\u043E\u0432\u0430\u043D\u043D\u043E\u043C \u043A\u0430\u043D\u0430\u043B\u0435. \u0401\u043C\u043A\u043E\u0441\u0442\u044C \u043A\u0430\u043D\u0430\u043B\u0430 \u0440\u0430\u0432\u043D\u0430 \u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C\u0443 \u043E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0445 \u0433\u043E\u0440\u0443\u0442\u0438\u043D: \u0437\u0430\u043F\u0438\u0441\u044C ", /*#__PURE__*/React.createElement(Code, null, "sem <- struct"), " \u0431\u043B\u043E\u043A\u0438\u0440\u0443\u0435\u0442\u0441\u044F, \u043A\u043E\u0433\u0434\u0430 \xAB\u0441\u043B\u043E\u0442\u043E\u0432\xBB \u043D\u0435\u0442."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      padding: '12px 14px',
      background: 'var(--warning-bg)',
      border: '1px solid var(--warning-border)',
      borderRadius: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "17",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--warning-fg)",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--warning-fg)',
      marginBottom: 3
    }
  }, "\u0413\u0440\u0430\u0431\u043B\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      lineHeight: '21px',
      color: 'var(--text-secondary)'
    }
  }, "\u0417\u0430\u0445\u0432\u0430\u0442\u044B\u0432\u0430\u0439 \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0435 \u0446\u0438\u043A\u043B\u0430 (", /*#__PURE__*/React.createElement(Code, null, "i, j"), ") \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430\u043C\u0438 \u0433\u043E\u0440\u0443\u0442\u0438\u043D\u044B. \u0418\u043D\u0430\u0447\u0435 \u0432\u0441\u0435 \u0433\u043E\u0440\u0443\u0442\u0438\u043D\u044B \u0443\u0432\u0438\u0434\u044F\u0442 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u2014 \u0438 \u043F\u043E\u043B\u0443\u0447\u0438\u0448\u044C \u0433\u043E\u043D\u043A\u0443 \u0438\u043B\u0438 \u043D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0438\u043D\u0434\u0435\u043A\u0441."))), /*#__PURE__*/React.createElement(P, null, "\u0417\u0430\u043F\u0438\u0441\u044C \u0432 ", /*#__PURE__*/React.createElement(Code, null, "results[i]"), " \u043F\u043E \u0440\u0430\u0437\u043D\u044B\u043C ", /*#__PURE__*/React.createElement(Code, null, "i"), " \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u0430 \u0431\u0435\u0437 \u043C\u044C\u044E\u0442\u0435\u043A\u0441\u0430: \u0433\u043E\u0440\u0443\u0442\u0438\u043D\u044B \u043F\u0438\u0448\u0443\u0442 \u0432 \u043D\u0435\u043F\u0435\u0440\u0435\u0441\u0435\u043A\u0430\u044E\u0449\u0438\u0435\u0441\u044F \u044F\u0447\u0435\u0439\u043A\u0438. \u0410 \u0432\u043E\u0442 ", /*#__PURE__*/React.createElement(Code, null, "append"), " \u0432 \u043E\u0431\u0449\u0438\u0439 \u0441\u043B\u0430\u0439\u0441 \u2014 \u0443\u0436\u0435 \u0433\u043E\u043D\u043A\u0430."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      padding: '12px 14px',
      background: 'var(--info-bg)',
      border: '1px solid var(--info-border)',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      marginTop: 1
    }
  }, Ic.book({
    stroke: 'var(--accent-text)',
    width: 16,
    height: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      lineHeight: '21px',
      color: 'var(--text-secondary)'
    }
  }, "\u0413\u043B\u0443\u0431\u0436\u0435 \u2014 \u0432 \u0443\u0447\u0435\u0431\u043D\u0438\u043A\u0435: ", /*#__PURE__*/React.createElement("a", {
    href: "../textbook/index.html"
  }, "\u041F\u0430\u0442\u0442\u0435\u0440\u043D\u044B \u043A\u043E\u043D\u043A\u0443\u0440\u0435\u043D\u0442\u043D\u043E\u0441\u0442\u0438 \u2192 \u0421\u0435\u043C\u0430\u0444\u043E\u0440\u044B"), " \u0438 ", /*#__PURE__*/React.createElement("a", {
    href: "../textbook/index.html"
  }, "\u0423\u0442\u0435\u0447\u043A\u0438 \u0438 \u0433\u043E\u043D\u043A\u0438"), ".")));
}
function PanelLocked({
  onForce
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '0 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-tertiary)',
      marginBottom: 16
    }
  }, Ic.lock({
    width: 20,
    height: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--text-primary)',
      marginBottom: 8
    }
  }, "\u0420\u0435\u0448\u0435\u043D\u0438\u0435 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u043E"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      lineHeight: '22px',
      color: 'var(--text-secondary)',
      maxWidth: 240,
      margin: '0 0 20px'
    }
  }, "\u042D\u0442\u0430\u043B\u043E\u043D\u043D\u044B\u0439 \u0440\u0430\u0437\u0431\u043E\u0440 \u043E\u0442\u043A\u0440\u043E\u0435\u0442\u0441\u044F, \u043A\u043E\u0433\u0434\u0430 \u0442\u0435\u0441\u0442\u044B \u043F\u0440\u043E\u0439\u0434\u0443\u0442. \u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u0441\u0430\u043C."), /*#__PURE__*/React.createElement("button", {
    onClick: onForce,
    style: {
      height: 36,
      padding: '0 16px',
      borderRadius: 8,
      border: '1px solid var(--border-strong)',
      background: 'transparent',
      color: 'var(--text-secondary)',
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer'
    }
  }, "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0432\u0441\u0451 \u0440\u0430\u0432\u043D\u043E"));
}
function PanelSolution() {
  const sol = `func WorkerPool(jobs []int, limit int, fn func(int) int) []int {
\tresults := make([]int, len(jobs))
\tsem := make(chan struct{}, limit)
\tvar wg sync.WaitGroup
\tfor i, j := range jobs {
\t\twg.Add(1)
\t\tsem <- struct{}{}
\t\tgo func(i, j int) {
\t\t\tdefer wg.Done()
\t\t\tdefer func() { <-sem }()
\t\t\tresults[i] = fn(j)
\t\t}(i, j)
\t}
\twg.Wait()
\treturn results
}`;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      marginBottom: 14
    }
  }, Ic.check(), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--success-fg)',
      fontWeight: 500
    }
  }, "\u0417\u0430\u0434\u0430\u0447\u0430 \u0440\u0435\u0448\u0435\u043D\u0430")), /*#__PURE__*/React.createElement(H, null, "\u042D\u0442\u0430\u043B\u043E\u043D \u043F\u043E \u0448\u0430\u0433\u0430\u043C"), /*#__PURE__*/React.createElement("ol", {
    style: {
      margin: '0 0 16px',
      paddingLeft: 18,
      fontSize: 14,
      lineHeight: '23px',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("li", null, "\u0421\u0435\u043C\u0430\u0444\u043E\u0440 ", /*#__PURE__*/React.createElement(Code, null, "sem"), " \u0451\u043C\u043A\u043E\u0441\u0442\u044C\u044E ", /*#__PURE__*/React.createElement(Code, null, "limit"), " \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0438\u0432\u0430\u0435\u0442 \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u0438\u0437\u043C."), /*#__PURE__*/React.createElement("li", null, "\u0421\u043B\u043E\u0442 \u0437\u0430\u043D\u0438\u043C\u0430\u0435\u0442\u0441\u044F ", /*#__PURE__*/React.createElement("i", null, "\u0434\u043E"), " \u0437\u0430\u043F\u0443\u0441\u043A\u0430 \u0433\u043E\u0440\u0443\u0442\u0438\u043D\u044B \u2014 \u0442\u0430\u043A \u0436\u0438\u0432\u044B\u0445 \u0433\u043E\u0440\u0443\u0442\u0438\u043D \u043D\u0435 \u0431\u043E\u043B\u044C\u0448\u0435 \u043B\u0438\u043C\u0438\u0442\u0430."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement(Code, null, "results[i]"), " \u043F\u0438\u0448\u0435\u0442\u0441\u044F \u043F\u043E \u0441\u0432\u043E\u0435\u043C\u0443 \u0438\u043D\u0434\u0435\u043A\u0441\u0443 \u2014 \u0433\u043E\u043D\u043A\u0438 \u043D\u0435\u0442."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement(Code, null, "wg.Wait()"), " \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u0440\u0443\u0435\u0442, \u0447\u0442\u043E \u0432\u0441\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0438\u0441\u044C \u0434\u043E \u0432\u043E\u0437\u0432\u0440\u0430\u0442\u0430.")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-default)',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '7px 12px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)'
    }
  }, Ic.doc({
    stroke: 'var(--text-tertiary)'
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 12,
      color: 'var(--text-secondary)'
    }
  }, "pool.go")), /*#__PURE__*/React.createElement("pre", {
    className: "mono",
    style: {
      margin: 0,
      padding: '12px 14px',
      fontSize: 12,
      lineHeight: '18px',
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("code", null, hl(sol)))), /*#__PURE__*/React.createElement(H, null, "\u0412\u043E\u043F\u0440\u043E\u0441\u044B \u0438\u043D\u0442\u0435\u0440\u0432\u044C\u044E\u0435\u0440\u0430"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      paddingLeft: 18,
      fontSize: 14,
      lineHeight: '23px',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("li", null, "\u0427\u0442\u043E \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u0441\u044F, \u0435\u0441\u043B\u0438 ", /*#__PURE__*/React.createElement(Code, null, "fn"), " \u043C\u043E\u0436\u0435\u0442 \u043F\u0430\u043D\u0438\u043A\u043E\u0432\u0430\u0442\u044C?"), /*#__PURE__*/React.createElement("li", null, "\u041A\u0430\u043A \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043E\u0442\u043C\u0435\u043D\u0443 \u0447\u0435\u0440\u0435\u0437 ", /*#__PURE__*/React.createElement(Code, null, "context.Context"), "?"), /*#__PURE__*/React.createElement("li", null, "\u0427\u0435\u043C \u044D\u0442\u043E \u043E\u0442\u043B\u0438\u0447\u0430\u0435\u0442\u0441\u044F \u043E\u0442 \u043F\u0443\u043B\u0430 \u043D\u0430 \u0444\u0438\u043A\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u0432\u043E\u0440\u043A\u0435\u0440\u0430\u0445 \u0441 \u043E\u0431\u0449\u0438\u043C \u043A\u0430\u043D\u0430\u043B\u043E\u043C \u0437\u0430\u0434\u0430\u0447?")));
}

/* ── Editor + Terminal ─────────────────────────────────────────────────── */
function Editor({
  code,
  runState
}) {
  const lines = code.split('\n');
  const errLine = runState === 'compile' ? 17 : null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-inset)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'stretch',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 16px',
      height: 40,
      borderRight: '1px solid var(--border-subtle)',
      borderBottom: '2px solid var(--accent)',
      background: 'var(--bg-inset)'
    }
  }, Ic.doc({
    stroke: 'var(--accent-text)'
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 12.5,
      color: 'var(--text-primary)'
    }
  }, "pool.go")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 16px',
      height: 40,
      color: 'var(--text-tertiary)'
    }
  }, Ic.doc({
    stroke: 'var(--text-tertiary)'
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 12.5
    }
  }, "pool_test.go"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-disabled)'
    }
  }, "readonly"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("pre", {
    className: "mono",
    style: {
      margin: 0,
      padding: '12px 0',
      fontSize: 13,
      lineHeight: '21px'
    }
  }, /*#__PURE__*/React.createElement("code", {
    style: {
      display: 'block',
      minWidth: 'max-content'
    }
  }, lines.map((ln, i) => {
    const isErr = errLine === i + 1;
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        display: 'flex',
        background: isErr ? 'var(--error-bg)' : 'transparent',
        boxShadow: isErr ? 'inset 2px 0 0 var(--error)' : 'none'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flexShrink: 0,
        width: 48,
        paddingRight: 16,
        textAlign: 'right',
        color: 'var(--text-tertiary)',
        userSelect: 'none',
        opacity: .6
      }
    }, i + 1), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        paddingRight: 18,
        whiteSpace: 'pre',
        color: 'var(--code-text)'
      }
    }, hl(ln), ln === '' ? ' ' : ''));
  })))));
}
const VERD = {
  idle: {
    label: 'Готов к запуску',
    fg: 'var(--text-tertiary)',
    dot: 'var(--text-tertiary)'
  },
  running: {
    label: 'Выполняется…',
    fg: 'var(--accent-text)',
    dot: 'var(--accent)'
  },
  pass: {
    label: 'PASS',
    fg: 'var(--success-fg)',
    dot: 'var(--success)'
  },
  fail: {
    label: 'FAIL',
    fg: 'var(--error-fg)',
    dot: 'var(--error)'
  },
  timeout: {
    label: 'TIMEOUT',
    fg: 'var(--warning-fg)',
    dot: 'var(--warning)'
  },
  compile: {
    label: 'Ошибка компиляции',
    fg: 'var(--error-fg)',
    dot: 'var(--error)'
  }
};
function TermLine({
  line
}) {
  let c = 'var(--code-text)';
  const t = line.trimStart();
  if (/^(ok|PASS|--- PASS|=== RUN|\s*--- PASS)/.test(t)) c = 'var(--success-fg)';else if (/^(FAIL|--- FAIL|panic:|fatal error|exit status|\s*--- FAIL|.*_test\.go:\d+:|\.\/pool\.go|# )/.test(t)) c = 'var(--error-fg)';else if (/^(WARNING: DATA RACE|====)/.test(t)) c = 'var(--warning-fg)';else if (/^(Write|Previous|Read|Goroutine|running tests|goroutine|concurrency)/.test(t)) c = 'var(--text-secondary)';else if (t.startsWith('$')) c = 'var(--text-tertiary)';else if (/pool\.go:\d+/.test(t)) c = 'var(--text-secondary)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      whiteSpace: 'pre-wrap',
      color: c
    }
  }, line === '' ? '\u00a0' : line);
}
function Terminal({
  runState,
  output,
  duration,
  height
}) {
  const v = VERD[runState] || VERD.idle;
  const lines = output ? output.split('\n') : [];
  const glow = runState === 'pass' ? 'var(--glow-success)' : runState === 'fail' || runState === 'compile' ? 'var(--glow-error)' : 'none';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height,
      flexShrink: 0,
      background: 'var(--bg-terminal)',
      borderTop: '1px solid var(--border-default)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: glow
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 14px',
      borderBottom: '1px solid var(--border-subtle)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 12,
      color: 'var(--text-tertiary)'
    }
  }, "go test -race ./..."), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7
    }
  }, runState === 'running' ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: '50%',
      border: '1.5px solid var(--accent)',
      borderTopColor: 'transparent',
      animation: 'sp .7s linear infinite'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: v.dot,
      boxShadow: runState === 'pass' || runState === 'fail' ? `0 0 8px ${v.dot}` : 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: v.fg,
      letterSpacing: '.04em'
    }
  }, v.label), duration && /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      color: 'var(--text-tertiary)'
    }
  }, duration))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: lines.length ? '10px 14px' : 0
    }
  }, lines.length ? lines.map((l, i) => /*#__PURE__*/React.createElement(TermLine, {
    key: i,
    line: l
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-tertiary)',
      fontSize: 12,
      fontFamily: 'var(--font-mono)'
    }
  }, "\u0417\u0430\u043F\u0443\u0441\u0442\u0438 \u0442\u0435\u0441\u0442\u044B, \u0447\u0442\u043E\u0431\u044B \u0443\u0432\u0438\u0434\u0435\u0442\u044C \u0432\u044B\u0432\u043E\u0434 \xB7 \u2318\u21B5"), /*#__PURE__*/React.createElement("style", null, `@keyframes sp{to{transform:rotate(360deg)}} pre,div{font-family:var(--font-mono);font-size:12.5px;line-height:19px;}`)));
}

/* ── App ───────────────────────────────────────────────────────────────── */
function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [runState, setRunState] = useState('idle'); // idle running pass fail timeout compile
  const [scenario, setScenario] = useState('pass');
  const [tab, setTab] = useState('cond');
  const [solved, setSolved] = useState(new Set([1, 2, 3, 4, 5, 6, 9, 10, 23, 24, 2]));
  const [unlocked, setUnlocked] = useState(false);
  const [termH, setTermH] = useState(208);
  const [toast, setToast] = useState(null);
  const timer = useRef();
  const run = useCallback(() => {
    clearTimeout(timer.current);
    setRunState('running');
    const dur = scenario === 'timeout' ? 1400 : 1000;
    timer.current = setTimeout(() => {
      const v = verdictOf(scenario);
      setRunState(v);
      if (v === 'pass') {
        setSolved(s => new Set([...s, 25]));
        setUnlocked(true);
        setToast('Задача решена · Решение разблокировано');
        setTimeout(() => setToast(null), 3200);
      }
    }, dur);
  }, [scenario]);
  useEffect(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        run();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [run]);

  // terminal drag-resize
  const dragRef = useRef(null);
  const onDrag = e => {
    e.preventDefault();
    const startY = e.clientY,
      startH = termH;
    const move = ev => setTermH(Math.max(64, Math.min(460, startH + (startY - ev.clientY))));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const out = runState === 'idle' || runState === 'running' ? '' : OUT[scenario];
  const dur = runState === 'pass' ? '1.84s' : runState === 'fail' ? '0.93s' : runState === 'timeout' ? '10.0s' : runState === 'compile' ? '0.2s' : runState === 'race' ? '0.71s' : undefined;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-canvas)'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      height: 48,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '0 14px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "../landing/index.html",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 28 28"
  }, /*#__PURE__*/React.createElement("rect", {
    width: "28",
    height: "28",
    rx: "7",
    fill: "var(--accent)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 10.5h7.5a3.5 3.5 0 0 1 0 7H10l2.4-2.4M8 17.5h-.5",
    stroke: "#fff",
    strokeWidth: "2.1",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    fill: "none"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 12,
      color: 'var(--text-tertiary)'
    }
  }, "\u0422\u043E\u043F\u0438\u043A 07"), Ic.chevR({
    stroke: 'var(--text-disabled)',
    width: 13,
    height: 13
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)',
      whiteSpace: 'nowrap'
    }
  }, "\u0412\u043E\u0440\u043A\u0435\u0440-\u043F\u0443\u043B\u044B"), Ic.chevR({
    stroke: 'var(--text-disabled)',
    width: 13,
    height: 13
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-primary)',
      whiteSpace: 'nowrap'
    }
  }, "25 \xB7 \u041F\u0443\u043B \u0441 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u0435\u043C")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      color: 'var(--text-disabled)'
    }
  }, "\u0434\u0435\u043C\u043E-\u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0439"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 2,
      padding: 2,
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-default)',
      borderRadius: 7
    }
  }, SCENARIOS.map(s => {
    const sel = s.k === scenario;
    return /*#__PURE__*/React.createElement("button", {
      key: s.k,
      onClick: () => {
        setScenario(s.k);
        setRunState('idle');
      },
      style: {
        height: 24,
        padding: '0 9px',
        fontSize: 11.5,
        fontWeight: 500,
        fontFamily: 'var(--font-mono)',
        color: sel ? 'var(--text-primary)' : 'var(--text-tertiary)',
        background: sel ? 'var(--bg-elevated)' : 'transparent',
        border: `1px solid ${sel ? 'var(--border-strong)' : 'transparent'}`,
        borderRadius: 5,
        cursor: 'pointer'
      }
    }, s.label);
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 22,
      background: 'var(--border-subtle)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    title: "\u041D\u0430\u0437\u0430\u0434",
    style: navBtn
  }, Ic.chevL()), /*#__PURE__*/React.createElement("button", {
    title: "\u0414\u0430\u043B\u044C\u0448\u0435",
    style: navBtn
  }, Ic.chevR()))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    collapsed: collapsed,
    onToggle: () => setCollapsed(c => !c),
    activeId: 25,
    solved: solved
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 48,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 14px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: run,
    disabled: runState === 'running',
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: 34,
      padding: '0 14px',
      borderRadius: 8,
      border: 'none',
      background: runState === 'running' ? 'var(--grey-800)' : 'var(--accent)',
      color: runState === 'running' ? 'var(--text-secondary)' : '#fff',
      fontSize: 13.5,
      fontWeight: 500,
      cursor: runState === 'running' ? 'default' : 'pointer'
    }
  }, runState === 'running' ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      height: 14,
      borderRadius: '50%',
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      animation: 'sp .7s linear infinite'
    }
  }) : Ic.play(), runState === 'running' ? 'Выполняется' : 'Запустить тесты', /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      opacity: .8,
      padding: '1px 5px',
      background: 'rgba(255,255,255,.16)',
      borderRadius: 4
    }
  }, "\u2318\u21B5")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setRunState('idle'),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      height: 34,
      padding: '0 13px',
      borderRadius: 8,
      border: '1px solid var(--border-strong)',
      background: 'transparent',
      color: 'var(--text-secondary)',
      fontSize: 13.5,
      fontWeight: 500,
      cursor: 'pointer'
    }
  }, Ic.reset(), " \u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      color: 'var(--text-tertiary)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'var(--success)'
    }
  }), "Go 1.22 \xB7 -race")), /*#__PURE__*/React.createElement(Editor, {
    code: STARTER,
    runState: runState
  }), /*#__PURE__*/React.createElement("div", {
    onPointerDown: onDrag,
    style: {
      height: 6,
      flexShrink: 0,
      cursor: 'ns-resize',
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 3,
      borderRadius: 2,
      background: 'var(--border-strong)'
    }
  })), /*#__PURE__*/React.createElement(Terminal, {
    runState: runState,
    output: out,
    duration: dur,
    height: termH
  })), /*#__PURE__*/React.createElement(RightPanel, {
    width: collapsed ? 420 : 380,
    tab: tab,
    setTab: setTab,
    solutionUnlocked: unlocked,
    onForceUnlock: () => setUnlocked(true)
  })), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1100,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '11px 16px',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--success-border)',
      borderRadius: 10,
      boxShadow: 'var(--shadow-lg)'
    }
  }, Ic.check(), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: 'var(--text-primary)',
      fontWeight: 500
    }
  }, toast)), /*#__PURE__*/React.createElement("style", null, `@keyframes sp{to{transform:rotate(360deg)}}`));
}
const navBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 7,
  border: '1px solid var(--border-default)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer'
};
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/trainer/trainer.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Callout = __ds_scope.Callout;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CodeBlock = __ds_scope.CodeBlock;

__ds_ns.Kbd = __ds_scope.Kbd;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.TaskListItem = __ds_scope.TaskListItem;

__ds_ns.Terminal = __ds_scope.Terminal;

})();
