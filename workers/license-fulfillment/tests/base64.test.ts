import { describe, it, expect } from 'vitest';
import { bytesToBase64, base64ToBytes, utf8ToBytes } from '../src/base64';

describe('base64', () => {
  it('round-trips bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255]);
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });
  it('encodes known ascii', () => {
    expect(bytesToBase64(utf8ToBytes('hi'))).toBe('aGk=');
  });
  it('encodes multibyte utf8', () => {
    // "é" is 0xC3 0xA9
    expect(bytesToBase64(utf8ToBytes('é'))).toBe('w6k=');
  });
});
