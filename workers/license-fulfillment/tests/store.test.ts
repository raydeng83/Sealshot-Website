import { describe, it, expect } from 'vitest';
import { getOrder, putOrder, type OrderRecord } from '../src/store';

function fakeKV() {
  const values = new Map<string, string>();
  const metas = new Map<string, unknown>();
  return {
    kv: {
      get: async (k: string) => values.get(k) ?? null,
      put: async (k: string, v: string, opts?: { metadata?: unknown }) => {
        values.set(k, v);
        if (opts?.metadata !== undefined) metas.set(k, opts.metadata);
      },
    } as unknown as KVNamespace,
    metas,
  };
}

describe('store', () => {
  it('round-trips an order record', async () => {
    const { kv } = fakeKV();
    const rec: OrderRecord = {
      licenseId: 'lic1', email: 'a@b.com', name: 'A B', issued: '2026-07-20',
      state: 'sent', attempts: 1, firstSeenAt: '2026-07-20T10:00:00.000Z',
    };
    expect(await getOrder(kv, 'ord_1')).toBeNull();
    await putOrder(kv, 'ord_1', rec);
    expect(await getOrder(kv, 'ord_1')).toEqual(rec);
  });

  it('mirrors state into KV metadata so listPending can skip settled orders', async () => {
    const { kv, metas } = fakeKV();
    await putOrder(kv, 'ord_1', {
      licenseId: 'lic1', email: 'a@b.com', name: 'A B', issued: '2026-07-20',
      state: 'pending', attempts: 0, firstSeenAt: '2026-07-20T10:00:00.000Z',
    });
    expect(metas.get('order:ord_1')).toEqual({ state: 'pending' });
  });
});
