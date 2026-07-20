import { describe, it, expect } from 'vitest';
import { getOrder, putOrder, type OrderRecord } from '../src/store';

function fakeKV() {
  const m = new Map<string, string>();
  return {
    get: async (k: string) => m.get(k) ?? null,
    put: async (k: string, v: string) => void m.set(k, v),
  } as unknown as KVNamespace;
}

describe('store', () => {
  it('round-trips an order record', async () => {
    const kv = fakeKV();
    const rec: OrderRecord = { licenseId: 'lic1', email: 'a@b.com', issued: '2026-07-20', state: 'sent' };
    expect(await getOrder(kv, 'ord_1')).toBeNull();
    await putOrder(kv, 'ord_1', rec);
    expect(await getOrder(kv, 'ord_1')).toEqual(rec);
  });
});
