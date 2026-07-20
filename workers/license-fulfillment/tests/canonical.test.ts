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
});

describe('textHash', () => {
  it('matches SHA256/base64 of the canonical bytes', async () => {
    // echo -n "abc" | openssl dgst -sha256 -binary | base64
    expect(await textHash('abc')).toBe('ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=');
  });
});
