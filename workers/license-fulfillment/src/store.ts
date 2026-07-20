export type OrderRecord = {
  licenseId: string;
  email: string;
  issued: string;
  state: 'sent' | 'pending';
};

const keyFor = (orderId: string) => `order:${orderId}`;

export async function getOrder(kv: KVNamespace, orderId: string): Promise<OrderRecord | null> {
  const raw = await kv.get(keyFor(orderId));
  return raw ? (JSON.parse(raw) as OrderRecord) : null;
}

export async function putOrder(kv: KVNamespace, orderId: string, rec: OrderRecord): Promise<void> {
  await kv.put(keyFor(orderId), JSON.stringify(rec));
}
