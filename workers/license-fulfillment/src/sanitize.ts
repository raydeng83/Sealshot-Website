/**
 * Port of licensegen's sanitizeOrDie (main.swift:100-114): reject control
 * characters (including newlines/tabs, which would let a crafted
 * name/email inject extra preamble lines) and bidi-override/isolate
 * controls (which could visually disguise the identity shown to the
 * customer).
 */
const UNSAFE_CHARS = /[\p{Cc}‪-‮⁦-⁩]/u;

export function hasUnsafeChars(s: string): boolean {
  return UNSAFE_CHARS.test(s);
}

/**
 * Make an untrusted single-line value safe to render inside the preamble.
 *
 * Unlike name and email, an address is NOT grounds for rejecting a paid order —
 * Polar collects it as a form, newlines and all, and a buyer whose street name
 * upsets a regex should still get their license. So this strips rather than
 * refuses: control and bidi characters out, every run of whitespace collapsed to
 * a single space (which is what removes the ability to forge extra preamble
 * lines), then trimmed and capped.
 *
 * The cap is a layout guard, not a security one: the value lands in a
 * fixed-column text block that people read.
 */
export function normalizeLine(s: string, maxLength = 96): string {
  const stripped = [...s]
    .filter((ch) => !UNSAFE_CHARS.test(ch))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.length > maxLength ? stripped.slice(0, maxLength).trimEnd() : stripped;
}
