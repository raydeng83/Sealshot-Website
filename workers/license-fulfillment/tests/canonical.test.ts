import { describe, it, expect } from 'vitest';
import { canonicalize, textHash } from '../src/canonical';

describe('canonicalize', () => {
  it('strips BOM, normalizes CRLF, trims trailing ws', () => {
    expect(canonicalize('﻿a \r\nb\t\r\nc')).toBe('a\nb\nc');
  });
  it('NFC-normalizes (decomposed é -> composed)', () => {
    const decomposed = 'é'; // e + combining acute
    expect(canonicalize(decomposed)).toBe('é');
  });

  // Parity with Swift's Character.isWhitespace (Unicode White_Space property),
  // which the shipping app uses — NOT the same set as JS's \s.
  it('trims a trailing U+0085 (NEL) as whitespace (White_Space in Swift)', () => {
    const nel = String.fromCodePoint(0x85);
    expect(canonicalize(`a${nel}`)).toBe('a');
  });

  it('preserves a non-leading U+FEFF (BOM strip only applies at position 0)', () => {
    const bom = String.fromCodePoint(0xfeff);
    expect(canonicalize(`a${bom}`)).toBe(`a${bom}`);
  });

  it('normalizes a lone CR to LF', () => {
    expect(canonicalize('a\rb')).toBe('a\nb');
  });
});

describe('textHash', () => {
  it('matches SHA256/base64 of the canonical bytes', async () => {
    // echo -n "abc" | openssl dgst -sha256 -binary | base64
    expect(await textHash('abc')).toBe('ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=');
  });
});
