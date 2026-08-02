/** In-memory KVNamespace double shared by the store, renewal, and verify suites. */
export function fakeKV() {
  const values = new Map<string, string>();
  const metas = new Map<string, unknown>();
  return {
    kv: {
      get: async (k: string) => values.get(k) ?? null,
      put: async (k: string, v: string, opts?: { metadata?: unknown }) => {
        values.set(k, v);
        if (opts?.metadata !== undefined) metas.set(k, opts.metadata);
      },
      list: async ({ prefix = '', cursor }: { prefix?: string; cursor?: string } = {}) => ({
        keys: [...values.keys()]
          .filter((k) => k.startsWith(prefix))
          .map((name) => ({ name, metadata: metas.get(name) })),
        list_complete: true,
        cursor,
      }),
    } as unknown as KVNamespace,
    values,
    metas,
  };
}
