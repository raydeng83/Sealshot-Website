/**
 * The Ed25519 public keys embedded in every Sealshot binary.
 *
 * Source of truth: `app/Sources/Sealshot/Licensing/LicenseKeys.swift` →
 * `LicenseKeys.production`. Key 1 signs today; key 2 is the pre-embedded
 * standby so a leaked primary can be rotated without stranding shipped builds.
 *
 * Public halves only — publishing them exposes nothing, since every copy of the
 * app already contains them. They are the single copy on this side: the browser
 * verifier, the Worker's production-key test, and the blocklist verifier all
 * import from here, because three hardcoded copies of the same constant is how
 * a key rotation ends up half-applied.
 */
export const APP_PUBLIC_KEYS: Record<number, string> = {
  1: '/tjy0vqLLdg5pvQjxsQ0jd0d9i4ihlMXLPynR8qurgk=',
  2: 'rgK5y1C5cPJOlmc1AyXXFok3FJvtIgK4k9nLKIetyqs=',
};

/** The key id new licenses and blocklists are signed with. */
export const PRIMARY_KEY_ID = 1;
