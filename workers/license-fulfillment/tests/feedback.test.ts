import { describe, it, expect, vi } from 'vitest';
import worker from '../src/index';

/**
 * The /support form endpoint.
 *
 * What matters here is not the happy path — it is that this endpoint is the only
 * contact route on the site, so every failure mode has to land somewhere a
 * person can act on, and that a form open to the internet cannot be turned into
 * a mail relay.
 */

const FROM = 'Sealshot <license@mail.seal-shot.com>';

function makeEnv(over: Record<string, unknown> = {}) {
  const sent: any[] = [];
  const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
    sent.push(JSON.parse(String(init?.body ?? '{}')));
    return new Response('{}', { status: 200 });
  }) as unknown as typeof fetch;
  return {
    env: {
      RESEND_API_KEY: 'rk',
      EMAIL_FROM: FROM,
      FEEDBACK_TO: 'support@seal-shot.com',
      FETCH: fetchImpl,
      ...over,
    } as any,
    sent,
    fetchImpl,
  };
}

function post(fields: Record<string, string>, init: RequestInit = {}) {
  const body = new URLSearchParams(fields);
  return new Request('https://w/feedback', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    ...init,
  });
}

describe('POST /feedback', () => {
  it('emails support and sends the browser back to the page', async () => {
    const { env, sent } = makeEnv();
    const res = await worker.fetch(post({
      name: 'Jane Doe', email: 'jane@example.com',
      type: 'Bug report', message: 'Capture window freezes on a second display.',
    }), env);

    // 303, not JSON: the form posts natively so this must work without any JS.
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('https://seal-shot.com/support/?sent=1');
    expect(sent[0]).toMatchObject({
      from: FROM,
      to: 'support@seal-shot.com',
      reply_to: 'jane@example.com',
      subject: 'Sealshot bug report from Jane Doe',
    });
    expect(sent[0].text).toContain('Capture window freezes');
  });

  it('accepts a message with no name or email', async () => {
    const { env, sent } = makeEnv();
    const res = await worker.fetch(post({ message: 'Just this.' }), env);
    expect(res.status).toBe(303);
    expect(sent[0].reply_to).toBeUndefined();
    expect(sent[0].text).toContain('(not given)');
  });

  it('swallows a honeypot submission without emailing, and says nothing about it', async () => {
    const { env, fetchImpl } = makeEnv();
    const res = await worker.fetch(post({ message: 'buy pills', botcheck: 'on' }), env);
    // Same response a human gets: a bot told it was caught just tries again.
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('https://seal-shot.com/support/?sent=1');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('refuses an empty message', async () => {
    const { env, fetchImpl } = makeEnv();
    expect((await worker.fetch(post({ message: '   ' }), env)).status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('will not be used as a relay: reply_to must be one plain address', async () => {
    const { env, sent } = makeEnv();
    await worker.fetch(post({
      message: 'hi',
      email: 'victim@example.com, attacker@evil.example',
    }), env);
    expect(sent[0].reply_to).toBeUndefined();
    // Still visible to whoever reads it, flagged as unusable.
    expect(sent[0].text).toContain('unusable as reply-to');
  });

  it('accepts each type the form offers', async () => {
    // The subject is how support triages, so a new option must actually change it
    // rather than collapsing into the fallback.
    for (const [i, type] of ['Purchase or payment', 'License or activation', 'Refund request'].entries()) {
      const { env, sent } = makeEnv();
      await worker.fetch(post({ message: `m${i}`, type }), env);
      expect(sent[0].subject).toBe(`Sealshot ${type.toLowerCase()}`);
      expect(sent[0].text).toContain(`Type:    ${type}`);
    }
  });

  it('cannot dictate the subject line', async () => {
    const { env, sent } = makeEnv();
    await worker.fetch(post({ message: 'hi', type: 'URGENT: wire transfer' }), env);
    expect(sent[0].subject).toBe('Sealshot general feedback');
  });

  it('strips newlines from single-line fields', async () => {
    const { env, sent } = makeEnv();
    await worker.fetch(post({ message: 'hi', name: 'Jane\nBcc: someone@evil.example' }), env);
    expect(sent[0].subject).toBe('Sealshot general feedback from Jane Bcc: someone@evil.example');
    expect(sent[0].subject).not.toContain('\n');
  });

  it('tells the visitor when the send failed rather than pretending it arrived', async () => {
    // Nothing is stored, so a lost message must not report success — the page
    // shows the email address instead.
    const { env } = makeEnv({
      FETCH: vi.fn(async () => new Response('nope', { status: 422 })) as unknown as typeof fetch,
    });
    const res = await worker.fetch(post({ message: 'hi' }), env);
    expect(res.headers.get('location')).toBe('https://seal-shot.com/support/?sent=0');
  });

  it('survives the provider throwing', async () => {
    const { env } = makeEnv({
      FETCH: vi.fn(async () => { throw new Error('network'); }) as unknown as typeof fetch,
    });
    const res = await worker.fetch(post({ message: 'hi' }), env);
    expect(res.headers.get('location')).toBe('https://seal-shot.com/support/?sent=0');
  });

  it('rate limits by IP, and says so distinguishably', async () => {
    const { env, fetchImpl } = makeEnv({
      FEEDBACK_LIMITER: { limit: async () => ({ success: false }) },
    });
    const res = await worker.fetch(post({ message: 'hi' }), env);
    expect(res.headers.get('location')).toBe('https://seal-shot.com/support/?sent=slow');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('works when the limiter binding is absent (degrades open)', async () => {
    const { env, sent } = makeEnv();
    expect((await worker.fetch(post({ message: 'hi' }), env)).status).toBe(303);
    expect(sent).toHaveLength(1);
  });

  it('refuses a body too large to be a bug report', async () => {
    const { env, fetchImpl } = makeEnv();
    const req = post({ message: 'x' });
    // Content-Length is what a flood would lie about cheaply; check it early.
    const headers = new Headers(req.headers);
    headers.set('content-length', '900000');
    const res = await worker.fetch(new Request(req, { headers }), env);
    expect(res.status).toBe(413);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects anything but POST', async () => {
    const { env } = makeEnv();
    const res = await worker.fetch(new Request('https://w/feedback'), env);
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('POST');
  });

  it('caps a runaway message instead of forwarding it whole', async () => {
    const { env, sent } = makeEnv();
    await worker.fetch(post({ message: 'y'.repeat(9000) }), env);
    expect(sent[0].text.length).toBeLessThan(5200);
  });
});
