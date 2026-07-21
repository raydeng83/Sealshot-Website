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
