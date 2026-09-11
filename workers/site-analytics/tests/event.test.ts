import { describe, it, expect, vi } from 'vitest';
import { handleEvent, parseEvent, isAllowedOrigin, DOWNLOAD_CLICK } from '../src/event';

function post(body: unknown, origin = 'https://seal-shot.com', headers: Record<string, string> = {}) {
  return new Request('https://analytics.example/e', {
    method: 'POST',
    headers: { origin, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function dataset() {
  return { writeDataPoint: vi.fn() };
}

describe('parseEvent', () => {
  it('accepts both tracked labels', () => {
    expect(parseEvent(JSON.stringify({ event: DOWNLOAD_CLICK, label: 'home' }))).toEqual({ label: 'home' });
    expect(parseEvent(JSON.stringify({ event: DOWNLOAD_CLICK, label: 'dmg' }))).toEqual({ label: 'dmg' });
  });

  it('rejects an unknown label rather than recording it', () => {
    // A typo in the markup must surface as a missing metric, not as a silent
    // third category nobody reads.
    expect(parseEvent(JSON.stringify({ event: DOWNLOAD_CLICK, label: 'hoem' }))).toBeNull();
  });

  it('rejects an unknown event name', () => {
    expect(parseEvent(JSON.stringify({ event: 'pageview', label: 'home' }))).toBeNull();
  });

  it('survives junk without throwing', () => {
    expect(parseEvent('not json')).toBeNull();
    expect(parseEvent('null')).toBeNull();
    expect(parseEvent('[]')).toBeNull();
    expect(parseEvent('"home"')).toBeNull();
  });
});

describe('isAllowedOrigin', () => {
  const env = { SITE_HOSTS: 'seal-shot.com,www.seal-shot.com' };

  it('allows both site hosts', () => {
    expect(isAllowedOrigin(env, 'https://seal-shot.com')).toBe(true);
    expect(isAllowedOrigin(env, 'https://www.seal-shot.com')).toBe(true);
  });

  it('allows localhost so `npm run dev` exercises the real endpoint', () => {
    expect(isAllowedOrigin(env, 'http://localhost:4321')).toBe(true);
    expect(isAllowedOrigin(env, 'http://127.0.0.1:8787')).toBe(true);
  });

  it('rejects another site, a missing origin, and a lookalike host', () => {
    expect(isAllowedOrigin(env, 'https://evil.example')).toBe(false);
    expect(isAllowedOrigin(env, null)).toBe(false);
    expect(isAllowedOrigin(env, 'https://seal-shot.com.evil.example')).toBe(false);
    // http, not https, on the real host.
    expect(isAllowedOrigin(env, 'http://seal-shot.com')).toBe(false);
  });
});

describe('handleEvent', () => {
  it('records a click and answers 204 with no body', async () => {
    const SITE_EVENTS = dataset();
    const res = await handleEvent(post({ event: DOWNLOAD_CLICK, label: 'home' }), { SITE_EVENTS } as never);
    expect(res.status).toBe(204);
    expect(SITE_EVENTS.writeDataPoint).toHaveBeenCalledWith({
      blobs: [DOWNLOAD_CLICK, 'home'],
      doubles: [1],
      indexes: [DOWNLOAD_CLICK],
    });
  });

  it('writes nothing that could identify a visitor', async () => {
    const SITE_EVENTS = dataset();
    await handleEvent(
      post({ event: DOWNLOAD_CLICK, label: 'dmg' }, 'https://seal-shot.com', {
        'cf-connecting-ip': '203.0.113.9',
        'user-agent': 'Mozilla/5.0 (Macintosh)',
        cookie: 'session=abc',
      }),
      { SITE_EVENTS } as never
    );
    const written = JSON.stringify(SITE_EVENTS.writeDataPoint.mock.calls[0][0]);
    expect(written).not.toContain('203.0.113.9');
    expect(written).not.toContain('Mozilla');
    expect(written).not.toContain('abc');
  });

  it('refuses a foreign origin', async () => {
    const SITE_EVENTS = dataset();
    const res = await handleEvent(
      post({ event: DOWNLOAD_CLICK, label: 'home' }, 'https://evil.example'),
      { SITE_EVENTS } as never
    );
    expect(res.status).toBe(403);
    expect(SITE_EVENTS.writeDataPoint).not.toHaveBeenCalled();
  });

  it('refuses a bad label', async () => {
    const SITE_EVENTS = dataset();
    const res = await handleEvent(post({ event: DOWNLOAD_CLICK, label: 'nope' }), { SITE_EVENTS } as never);
    expect(res.status).toBe(400);
    expect(SITE_EVENTS.writeDataPoint).not.toHaveBeenCalled();
  });

  it('refuses a body far larger than a beacon', async () => {
    const SITE_EVENTS = dataset();
    const res = await handleEvent(post('x'.repeat(600)), { SITE_EVENTS } as never);
    expect(res.status).toBe(413);
    expect(SITE_EVENTS.writeDataPoint).not.toHaveBeenCalled();
  });

  it('rejects GET', async () => {
    const req = new Request('https://analytics.example/e', { method: 'GET' });
    expect((await handleEvent(req, {} as never)).status).toBe(405);
  });

  it('honours the rate limiter', async () => {
    const SITE_EVENTS = dataset();
    const EVENT_LIMITER = { limit: vi.fn(async () => ({ success: false })) };
    const res = await handleEvent(post({ event: DOWNLOAD_CLICK, label: 'home' }), {
      SITE_EVENTS, EVENT_LIMITER,
    } as never);
    expect(res.status).toBe(429);
    expect(SITE_EVENTS.writeDataPoint).not.toHaveBeenCalled();
  });

  it('degrades OPEN when the limiter binding is missing', async () => {
    // A misconfigured limiter must not start silently dropping events.
    const SITE_EVENTS = dataset();
    const res = await handleEvent(post({ event: DOWNLOAD_CLICK, label: 'home' }), { SITE_EVENTS } as never);
    expect(res.status).toBe(204);
    expect(SITE_EVENTS.writeDataPoint).toHaveBeenCalled();
  });

  it('does not fail the beacon when the dataset binding is absent', async () => {
    const res = await handleEvent(post({ event: DOWNLOAD_CLICK, label: 'home' }), {} as never);
    expect(res.status).toBe(204);
  });
});
