#!/usr/bin/env -S npx tsx
/**
 * Revoke a license: sign, verify, publish, verify again.
 *
 *   npm run revoke -- 65ED7FCE-AEDC-44BF-B905-B415893A83EF
 *   npm run revoke -- <uuid> --dry-run     # sign and verify, do not commit
 *
 * Deliberately NOT automated end to end. The Worker already holds the signing
 * key and receives order.refunded, so it could do all of this — but publishing
 * needs write access to the release repo, and a token that can rewrite
 * appcast.xml sitting next to the license signing key would mean one compromised
 * secret store can ship a signed-looking malicious update to every install.
 * Revocation happens a handful of times a year; that is a bad trade.
 *
 * What this does fix is the ritual. The verify step is the one a human skips,
 * and skipping it is invisible: the app fails open, so a bad signature, a
 * malformed file or an unsigned hand edit all degrade silently to "revokes
 * nothing" — indistinguishable from "nothing revoked yet". Here it runs twice,
 * once before publishing and once against what the repo actually contains.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

// Cross-repo by nature: the tool, the file and the verifier live in three places.
const HERE = dirname(new URL(import.meta.url).pathname);
const LICENSEGEN = '/Users/ledeng/projects/sealshot/scripts/licensegen/.build/debug/licensegen';
const RELEASE_REPO = '/Users/ledeng/projects/Sealshot-Release';
const BLOCKLIST = join(RELEASE_REPO, 'license-blocklist.json');
const VERIFY = resolve(HERE, 'verify-blocklist.mts');

const UUID_RE = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const id = args.find((a) => !a.startsWith('--'))?.toUpperCase();

function die(msg: string): never {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

const run = (cmd: string, argv: string[], cwd?: string) =>
  execFileSync(cmd, argv, { cwd, encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'] });

const step = (n: number, label: string) => console.log(`\n[${n}/5] ${label}`);

// ── Preconditions, all of which have bitten at least once ────────────────────
if (!id) die('usage: npm run revoke -- <license-uuid> [--dry-run]');
if (!UUID_RE.test(id)) die(`"${id}" is not a UUID. The license id is in the file and in KV.`);
if (!existsSync(LICENSEGEN))
  die(`licensegen not built at ${LICENSEGEN}\n  build it in scripts/licensegen, but note its `
    + `Keychain ACL re-prompts after every rebuild.`);
if (!existsSync(BLOCKLIST))
  die(`no blocklist at ${BLOCKLIST}. It must be seeded once before revoke can append `
    + `to it — licensegen requires an --id, so it cannot create the file.`);

const original = readFileSync(BLOCKLIST, 'utf8');
const before = JSON.parse(original) as { revoked: string[] };
if (before.revoked.some((r) => r.toUpperCase() === id))
  die(`${id} is already revoked. Nothing to do.`);

// A dirty release repo means a commit here would sweep up unrelated changes.
const dirty = run('git', ['status', '--porcelain'], RELEASE_REPO).trim();
if (dirty && !dryRun)
  die(`${RELEASE_REPO} has uncommitted changes:\n${dirty}\n  Commit or stash them first — this `
    + `script commits license-blocklist.json and must not carry anything else with it.`);

// Cross-check against our own records. Revocation is the one operation that
// takes something away from a customer, and the id is typed by hand from an
// alert — so a transposed character revokes a paying customer instead. KV knows
// whether this license was actually refunded; ask it.
const force = args.includes('--force');
let record: { email?: string; refunded?: boolean } | null = null;
try {
  const out = run('npx', ['wrangler', 'kv', 'key', 'get', '--binding', 'ORDERS',
                          `license:${id}`], HERE);
  record = JSON.parse(out);
} catch {
  record = null;   // absent, or wrangler unavailable
}

if (!record) {
  console.log(`\n⚠  no license:${id} record in KV.`);
  console.log('   Either the id is wrong, or the license was issued outside the Worker');
  console.log('   (licensegen by hand, e.g. a volume license).');
  if (!force) die('refusing without --force. Check the id first.');
} else if (record.refunded !== true) {
  console.log(`\n⚠  license:${id} is NOT marked refunded in KV.`);
  console.log(`   buyer: ${record.email ?? 'unknown'}`);
  console.log('   Revoking it would cut off a customer who still holds a valid purchase.');
  if (!force) die('refusing without --force. Revoke for fraud or a manual refund needs --force.');
} else {
  console.log(`\n  KV confirms refunded — buyer ${record.email ?? 'unknown'}`);
}

console.log(`\nrevoking ${id}`);
console.log(`  blocklist currently revokes ${before.revoked.length} license(s)`);

// ── 1. Sign ──────────────────────────────────────────────────────────────────
step(1, 'licensegen revoke — may prompt for Keychain access');
try {
  console.log('  ' + run(LICENSEGEN, ['revoke', '--id', id, '--blocklist', BLOCKLIST]).trim());
} catch (err: any) {
  die(`licensegen failed: ${err.stderr?.toString().trim() || err.message}`);
}

// ── 2. Verify BEFORE publishing ──────────────────────────────────────────────
step(2, 'verify the signed file before it leaves this machine');
try {
  run('npx', ['tsx', VERIFY, '--file', BLOCKLIST, '--expect', id], HERE);
  console.log('  ✓ valid, and revokes the id');
} catch (err: any) {
  console.error(err.stdout?.toString() ?? '');
  die('the file licensegen just wrote does not verify. NOT publishing it.');
}

if (dryRun) {
  // Restore, rather than telling the human to. A dry run that leaves the file
  // modified is not a dry run — and the leftover id makes the NEXT real run fail
  // with "already revoked", which is both wrong and confusing.
  writeFileSync(BLOCKLIST, original);
  console.log(`\n--dry-run: signed and verified, then reverted. ${BLOCKLIST} is unchanged.`);
  process.exit(0);
}

// ── 3. Commit ────────────────────────────────────────────────────────────────
step(3, 'commit');
run('git', ['add', 'license-blocklist.json'], RELEASE_REPO);
run('git', ['commit', '-m', `Revoke ${id}`], RELEASE_REPO);
console.log('  ' + run('git', ['log', '--oneline', '-1'], RELEASE_REPO).trim());

// ── 4. Push ──────────────────────────────────────────────────────────────────
step(4, 'push');
try {
  run('git', ['push', 'origin', 'main'], RELEASE_REPO);
  console.log('  ✓ pushed');
} catch (err: any) {
  die(`push failed: ${err.stderr?.toString().trim()}\n  The commit exists locally; push it by hand.`);
}

// ── 5. Verify what was PUBLISHED, via the API (authoritative, uncached) ──────
// raw.githubusercontent.com caches for roughly five minutes, so polling it right
// after a push tells you nothing useful. The Contents API is not cached and is
// what actually decides whether the right bytes are in the repo.
step(5, 'verify the published file via the GitHub API');
const API = 'https://api.github.com/repos/raydeng83/Sealshot-Release/contents/'
  + 'license-blocklist.json?ref=main';
const tmp = join(tmpdir(), `blocklist-published-${process.pid}.json`);
try {
  const meta = JSON.parse(run('curl', ['-sS', '-H', 'Accept: application/vnd.github+json', API]));
  writeFileSync(tmp, Buffer.from(meta.content, 'base64').toString('utf8'));
  run('npx', ['tsx', VERIFY, '--file', tmp, '--expect', id], HERE);
  unlinkSync(tmp);
  console.log('  ✓ the repo contains a valid blocklist revoking this id');
} catch (err: any) {
  console.error(err.stdout?.toString() ?? err.message);
  die('pushed, but the published file does not verify. Investigate before assuming '
    + 'this license is revoked.');
}

// ── 6. Note when the CDN catches up — informational, not a gate ───────────────
step(6, 'wait for raw.githubusercontent.com, which is what the app fetches');
let liveSeen = false;
for (let attempt = 1; attempt <= 6 && !liveSeen; attempt++) {
  try {
    run('npx', ['tsx', VERIFY, '--expect', id], HERE);
    liveSeen = true;
  } catch {
    if (attempt < 6) {
      console.log(`  cached copy still stale, checking again in 20s (${attempt}/5)`);
      execFileSync('sleep', ['20']);
    }
  }
}
console.log(liveSeen
  ? '  ✓ live'
  : '  … still serving a cached copy. Normal — the raw CDN holds files for about\n'
    + '    five minutes. The revocation IS published (step 5 proved it); apps that\n'
    + '    fetch after the cache expires will see it.');

console.log(`\n${id} is revoked. Installs pick it up on next launch, when update`
  + ` checks are enabled.\n`);
