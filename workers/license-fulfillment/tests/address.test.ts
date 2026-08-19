import { describe, it, expect } from 'vitest';
import { buildPreamble } from '../src/canonical';
import { normalizeAddress, parseOrderPaid } from '../src/polar';
import { normalizeLine } from '../src/sanitize';

/**
 * Billing address in the preamble.
 *
 * The address is deterrence, not enforcement: nothing in the app checks it, and
 * a shared license still activates. What these tests defend is that the field
 * cannot break the two things that DO matter — byte parity with the app's
 * template when there is no address, and the fixed-column layout when there is.
 */

const BASE = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  id: '550E8400-E29B-41D4-A716-446655440000',
  issued: '2026-07-20',
  updatesThrough: '2027-07-20',
  seats: 1,
  licenseType: 'individual',
} as const;

describe('preamble with a billing address', () => {
  it('places the block under Email, continuing under the value column', () => {
    const out = buildPreamble({
      ...BASE,
      addressLines: ['1725 Revere Beach Pkwy,', 'Everett, MA 02149, US'],
    });
    expect(out.split('\n').slice(0, 6)).toEqual([
      'Sealshot License',
      '================',
      'Licensed to:      Jane Doe',
      'Email:            jane@example.com',
      'Billing address:  1725 Revere Beach Pkwy,',
      '                  Everett, MA 02149, US',
    ]);
  });

  it('is byte-identical to the addressless template when absent or empty', () => {
    // The golden fixtures are shared with the app's test suite, so this is the
    // assertion that keeps "three implementations, one set of bytes" true for
    // everything licensegen issues.
    const none = buildPreamble(BASE);
    expect(buildPreamble({ ...BASE, addressLines: undefined })).toBe(none);
    expect(buildPreamble({ ...BASE, addressLines: [] })).toBe(none);
    expect(none).not.toContain('Billing address');
  });

  it('keeps a one-line address on one line', () => {
    const out = buildPreamble({ ...BASE, addressLines: ['Everett, MA 02149, US'] });
    expect(out).toContain('Billing address:  Everett, MA 02149, US');
    expect(out.split('\n').filter((l) => l.startsWith('                  '))).toEqual([]);
  });
});

describe('normalizeAddress', () => {
  const full = {
    billing_address: {
      line1: '1725 Revere Beach Pkwy',
      line2: 'Suite 4',
      city: 'Everett',
      state: 'MA',
      postal_code: '02149',
      country: 'US',
    },
  };

  it('renders street then locality', () => {
    expect(normalizeAddress(full)).toEqual([
      '1725 Revere Beach Pkwy, Suite 4,',
      'Everett, MA 02149, US',
    ]);
  });

  it('reads the address off the customer too', () => {
    // Polar has carried it in both places across API versions.
    expect(normalizeAddress({ customer: { billing_address: full.billing_address } }))
      .toEqual(normalizeAddress(full));
  });

  it('yields undefined rather than an empty field when there is nothing to state', () => {
    expect(normalizeAddress({})).toBeUndefined();
    expect(normalizeAddress({ billing_address: {} })).toBeUndefined();
    expect(normalizeAddress({ billing_address: 'nope' })).toBeUndefined();
    expect(normalizeAddress(null)).toBeUndefined();
  });

  it('drops the street line when only a country is known', () => {
    expect(normalizeAddress({ billing_address: { country: 'US' } })).toEqual(['US']);
  });

  it('cannot forge extra preamble lines', () => {
    // The whole reason the value is normalized: a newline here would otherwise
    // put attacker-chosen text where a field belongs, in a document people read
    // as authoritative.
    const forged = normalizeAddress({
      billing_address: { line1: 'Nowhere\nUsers:            99', country: 'US' },
    })!;
    expect(forged.every((l) => !l.includes('\n'))).toBe(true);
    const out = buildPreamble({ ...BASE, addressLines: forged });
    expect(out.split('\n').filter((l) => /^Users:/.test(l))).toEqual(['Users:            1']);
  });

  it('strips control and bidi characters', () => {
    expect(normalizeLine('Ever‮ett')).toBe('Everett');
  });

  it('caps a runaway value', () => {
    expect(normalizeLine('x'.repeat(500)).length).toBe(96);
  });
});

describe('parseOrderPaid', () => {
  it('carries the address through', () => {
    const parsed = parseOrderPaid(
      JSON.stringify({
        type: 'order.paid',
        data: {
          id: 'ord_9',
          created_at: '2026-08-19T10:00:00Z',
          customer: { email: 'jane@example.com', name: 'Jane Doe' },
          billing_address: { line1: '1 High St', city: 'Boston', state: 'MA', country: 'US' },
        },
      })
    );
    expect(parsed?.addressLines).toEqual(['1 High St,', 'Boston, MA, US']);
  });

  it('parses an order with no address at all', () => {
    const parsed = parseOrderPaid(
      JSON.stringify({
        type: 'order.paid',
        data: {
          id: 'ord_10',
          created_at: '2026-08-19T10:00:00Z',
          customer: { email: 'jane@example.com', name: 'Jane Doe' },
        },
      })
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.addressLines).toBeUndefined();
  });
});
