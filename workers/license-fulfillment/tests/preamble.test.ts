import { describe, it, expect } from 'vitest';
import { buildPreamble } from '../src/canonical';

describe('buildPreamble', () => {
  it('matches the exact Swift template', () => {
    const out = buildPreamble({
      name: 'Jane Doe',
      email: 'jane@example.com',
      id: '550E8400-E29B-41D4-A716-446655440000',
      issued: '2026-07-20',
      updatesThrough: '2027-07-20',
      seats: 1,
    });
    const expected = [
      'Sealshot License',
      '================',
      'Licensed to:     Jane Doe',
      'Email:           jane@example.com',
      'License ID:      550E8400-E29B-41D4-A716-446655440000',
      'Issued:          2026-07-20',
      'Updates through: 2027-07-20',
      'Seats:           1',
      '',
      'Keep this file exactly as received. It is personally identifying and',
      'cryptographically bound to the information above - any change to this',
      'file, including removing this text, invalidates the license.',
    ].join('\n');
    expect(out).toBe(expected);
  });
});
