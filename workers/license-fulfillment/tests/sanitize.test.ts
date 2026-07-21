import { describe, it, expect } from 'vitest';
import { hasUnsafeChars } from '../src/sanitize';

describe('hasUnsafeChars', () => {
  it('accepts a plain name', () => {
    expect(hasUnsafeChars('Jane Doe')).toBe(false);
  });
  it('accepts a plain email', () => {
    expect(hasUnsafeChars('jane@example.com')).toBe(false);
  });
  it('rejects a name containing a newline (preamble line-injection)', () => {
    expect(hasUnsafeChars('Jane\nDoe')).toBe(true);
  });
  it('rejects a name containing a bidi-override (RLO, U+202E)', () => {
    expect(hasUnsafeChars('Jane‮Doe')).toBe(true);
  });
  it('rejects a name containing a control character', () => {
    expect(hasUnsafeChars('JaneDoe')).toBe(true);
  });
});
