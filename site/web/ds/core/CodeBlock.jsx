import React from 'react';

/* ── Go tokenizer (lightweight) ──────────────────────────────────────────
   Not a full parser — a pragmatic regex pass good enough for specimen code.
   Returns React spans coloured via the --code-* tokens. */
const GO_KEYWORDS = new Set(['func','go','chan','select','for','range','if','else','switch','case','default','return','defer','var','const','type','struct','interface','map','package','import','break','continue','fallthrough','goto','nil','true','false','iota']);
const GO_BUILTINS = new Set(['make','len','cap','append','copy','close','delete','new','panic','recover','print','println','complex','real','imag']);
const GO_TYPES = new Set(['int','int8','int16','int32','int64','uint','uint8','uint16','uint32','uint64','uintptr','float32','float64','complex64','complex128','byte','rune','string','bool','error','any']);

export function highlightGo(code) {
  const tokenRe = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`[^`]*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d[\d_.eExXa-fA-F]*\b)|([A-Za-z_]\w*)|(\s+)|([^\s\w])/g;
  const out = [];
  let m, i = 0;
  while ((m = tokenRe.exec(code))) {
    let color = null, text = m[0];
    if (m[1]) color = 'var(--code-comment)';
    else if (m[2]) color = 'var(--code-string)';
    else if (m[3]) color = 'var(--code-number)';
    else if (m[4]) {
      if (GO_KEYWORDS.has(text)) color = 'var(--code-keyword)';
      else if (GO_BUILTINS.has(text)) color = 'var(--code-builtin)';
      else if (GO_TYPES.has(text)) color = 'var(--code-type)';
      else {
        const after = code.slice(tokenRe.lastIndex, tokenRe.lastIndex + 1);
        if (after === '(') color = 'var(--code-func)';
        else color = 'var(--code-text)';
      }
    } else if (m[6]) color = 'var(--code-punct)';
    out.push(color ? <span key={i} style={{ color }}>{text}</span> : text);
    i++;
  }
  return out;
}

/**
 * CodeBlock — Go source with optional filename header and line numbers.
 */
export function CodeBlock({ code = '', filename, language = 'go', showLineNumbers = true, highlightLines = [], style }) {
  const lines = code.replace(/\n$/, '').split('\n');
  return (
    <div style={{
      background: 'var(--code-bg)', border: 'var(--border-width) solid var(--border-default)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden', ...style,
    }}>
      {filename && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--code-sm)', color: 'var(--text-secondary)' }}>{filename}</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 'var(--label-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{language}</span>
        </div>
      )}
      <pre style={{ margin: 0, padding: '14px 0', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: 'var(--code-md)', lineHeight: 'var(--code-md-lh)' }}>
        <code style={{ display: 'block', minWidth: 'max-content' }}>
          {lines.map((ln, idx) => {
            const hot = highlightLines.includes(idx + 1);
            return (
              <span key={idx} style={{ display: 'flex', background: hot ? 'var(--accent-subtle)' : 'transparent', boxShadow: hot ? 'inset 2px 0 0 var(--accent)' : 'none' }}>
                {showLineNumbers && (
                  <span style={{ flexShrink: 0, width: 44, paddingRight: 16, textAlign: 'right', color: 'var(--text-tertiary)', userSelect: 'none', opacity: 0.7 }}>{idx + 1}</span>
                )}
                <span style={{ flex: 1, paddingRight: 18, paddingLeft: showLineNumbers ? 0 : 16, whiteSpace: 'pre', color: 'var(--code-text)' }}>{highlightGo(ln)}{ln === '' ? ' ' : ''}</span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

export default CodeBlock;
