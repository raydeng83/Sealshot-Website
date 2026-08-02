import { getLicense, findLicenseIdByEmail, type LicenseRecord } from './store';

export type RenewalTarget = {
  licenseId: string;
  rec: LicenseRecord;
  source: 'reference' | 'email';
  /** Set when the email index pointed somewhere else — alert-worthy. */
  disagreedWithEmail?: string;
};

/**
 * Which licence a renewal order is for.
 *
 * A fallback chain, never a conjunction. Requiring the reference id AND the
 * email to agree would reject exactly the customer this exists to serve — the
 * one whose address changed since they bought. A disagreement is reported for
 * alerting, not used to reject.
 *
 * The reference id wins because it comes from a licence file the customer
 * holds, whereas the email index is a guess based on who last bought from that
 * address.
 */
export async function resolveRenewalTarget(
  kv: KVNamespace,
  input: { referenceId?: string; email: string }
): Promise<RenewalTarget | null> {
  const byEmail = await findLicenseIdByEmail(kv, input.email);

  if (input.referenceId) {
    const rec = await getLicense(kv, input.referenceId);
    if (rec) {
      return {
        licenseId: input.referenceId,
        rec,
        source: 'reference',
        ...(byEmail && byEmail !== input.referenceId ? { disagreedWithEmail: byEmail } : {}),
      };
    }
  }
  if (byEmail) {
    const rec = await getLicense(kv, byEmail);
    if (rec) return { licenseId: byEmail, rec, source: 'email' };
  }
  return null;
}
