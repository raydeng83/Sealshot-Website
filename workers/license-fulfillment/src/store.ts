export type OrderState = 'sent' | 'pending' | 'rejected' | 'failed';

export type OrderRecord = {
  licenseId: string;
  email: string;
  /** Buyer name — kept so a retry can re-issue the identical license. */
  name: string;
  issued: string;
  state: OrderState;
  /** Delivery attempts made so far (0 before the first send). */
  attempts: number;
  /** When the order was first recorded, ISO — drives the alert threshold. */
  firstSeenAt: string;
  /** When delivery was last attempted, ISO. Absent before the first attempt. */
  lastAttemptAt?: string;
  /** Short reason the last attempt failed, for the alert and for debugging. */
  lastError?: string;
  /** True once we've alerted about this order, so we only alert once. */
  alerted?: boolean;
};

const PREFIX = 'order:';
const keyFor = (orderId: string) => `${PREFIX}${orderId}`;

/**
 * State is mirrored into KV metadata so `listPending` can find orders awaiting
 * delivery from the list call alone, instead of reading every value.
 */
type Meta = { state: OrderState };

export async function getOrder(kv: KVNamespace, orderId: string): Promise<OrderRecord | null> {
  const raw = await kv.get(keyFor(orderId));
  return raw ? (JSON.parse(raw) as OrderRecord) : null;
}

export async function putOrder(kv: KVNamespace, orderId: string, rec: OrderRecord): Promise<void> {
  const meta: Meta = { state: rec.state };
  await kv.put(keyFor(orderId), JSON.stringify(rec), { metadata: meta });
}

/**
 * Orders still awaiting delivery. `limit` bounds how much work a single cron
 * run takes on. Keys whose metadata says they're settled are skipped without
 * a read; keys with no metadata are read, so records written before metadata
 * existed are still found.
 */
export async function listPending(
  kv: KVNamespace,
  limit = 50
): Promise<{ orderId: string; rec: OrderRecord }[]> {
  const out: { orderId: string; rec: OrderRecord }[] = [];
  let cursor: string | undefined;

  do {
    const page = await kv.list<Meta>({ prefix: PREFIX, cursor });
    for (const key of page.keys) {
      if (key.metadata && key.metadata.state !== 'pending') continue;
      const orderId = key.name.slice(PREFIX.length);
      const rec = await getOrder(kv, orderId);
      if (rec?.state === 'pending') out.push({ orderId, rec });
      if (out.length >= limit) return out;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return out;
}
