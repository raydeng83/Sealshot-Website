export type OrderState = 'sent' | 'pending' | 'rejected' | 'failed';

export type OrderRecord = {
  licenseId: string;
  email: string;
  /** Buyer name — kept so a retry can re-issue the identical license. */
  name: string;
  issued: string;
  /**
   * Frozen when the order is first recorded, never recomputed.
   *
   * A renewal's window is derived from the licence's CURRENT `updatesThrough`.
   * Recomputing it on a retry would read a value a previous attempt already
   * moved, extending the same purchase twice — so the fulfilment path reads
   * this field and never the licence record.
   */
  updatesThrough: string;
  licenseType: 'individual' | 'business-volume';
  /** Seat count carried from the licence being renewed; 1 for a new purchase. */
  seats: number;
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

/**
 * A licence, keyed by its own id rather than by the order that created it.
 *
 * Order records answer "did we deliver this purchase?"; licence records answer
 * "what does this customer currently own?" — which is what a renewal needs,
 * since a renewal arrives as a *different* Polar order for the *same* licence.
 * `latestOrderId` is the back-pointer, kept for support and for tracing which
 * purchase last moved the window.
 */
export type LicenseRecord = {
  name: string;
  email: string;
  licenseType: 'individual' | 'business-volume';
  issued: string;
  updatesThrough: string;
  seats: number;
  latestOrderId: string;
};

const LICENSE_PREFIX = 'license:';
const EMAIL_PREFIX = 'email:';

const licenseKey = (id: string) => `${LICENSE_PREFIX}${id}`;
const emailKey = (email: string) => `${EMAIL_PREFIX}${email.trim().toLowerCase()}`;

export async function getLicense(kv: KVNamespace, licenseId: string): Promise<LicenseRecord | null> {
  const raw = await kv.get(licenseKey(licenseId));
  return raw ? (JSON.parse(raw) as LicenseRecord) : null;
}

/**
 * Writes the record and points this email at it. The index is last-write-wins
 * and never deletes: if a buyer's address changes, both the old and the new
 * address resolve to the licence, so a renewal bought from either one still
 * matches. Losing the old pointer would strand exactly the customer the email
 * fallback exists for.
 */
export async function putLicense(
  kv: KVNamespace,
  licenseId: string,
  rec: LicenseRecord
): Promise<void> {
  await kv.put(licenseKey(licenseId), JSON.stringify(rec));
  await kv.put(emailKey(rec.email), licenseId);
}

export async function findLicenseIdByEmail(
  kv: KVNamespace,
  email: string
): Promise<string | null> {
  return (await kv.get(emailKey(email))) ?? null;
}
