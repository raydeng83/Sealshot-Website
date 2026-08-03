import { getLicense, findLicenseIdByEmail, type LicenseRecord } from './store';

export type RenewalTarget = {
  licenseId: string;
  rec: LicenseRecord;
  source: 'reference' | 'email';
  /** Set when the email index pointed somewhere else — alert-worthy. */
  disagreedWithEmail?: string;
};

/**
 * Which license a renewal order is for.
 *
 * A fallback chain, never a conjunction. Requiring the reference id AND the
 * email to agree would reject exactly the customer this exists to serve — the
 * one whose address changed since they bought. A disagreement is reported for
 * alerting, not used to reject.
 *
 * The reference id wins because it comes from a license file the customer
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
    // A refunded licence is treated as absent, so the caller falls through to
    // "no match" — mints a fresh licence for what they just paid and alerts a
    // human. They are not left empty-handed, and a revoked licence is not
    // silently reinstated.
    if (rec && !rec.refunded) {
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
    if (rec && !rec.refunded) return { licenseId: byEmail, rec, source: 'email' };
  }
  return null;
}
