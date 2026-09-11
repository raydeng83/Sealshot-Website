import { describe, it, expect, vi } from 'vitest';
import { recipients, sendReport } from '../src/email';

describe('recipients', () => {
  it('splits the configured list and trims it', () => {
    expect(recipients('mingqian.chen@bostonidentity.com,le.deng@bostonidentity.com')).toEqual([
      'mingqian.chen@bostonidentity.com',
      'le.deng@bostonidentity.com',
    ]);
    expect(recipients(' a@x.com , b@y.com ')).toEqual(['a@x.com', 'b@y.com']);
  });

  it('is empty rather than [""] when unset, so the caller can refuse to send', () => {
    expect(recipients(undefined)).toEqual([]);
    expect(recipients('')).toEqual([]);
    expect(recipients(',,')).toEqual([]);
  });
});

describe('sendReport', () => {
  it('puts both recipients on ONE message', async () => {
    // One message rather than two, so a reply keeps both of them in the thread.
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response('{"id":"e1"}', { status: 200 }));
    const res = await sendReport({
      apiKey: 'rk',
      from: 'Sealshot <reports@mail.seal-shot.com>',
      to: ['mingqian.chen@bostonidentity.com', 'le.deng@bostonidentity.com'],
      subject: 'Sealshot weekly website report — Sep 7 – Sep 13',
      text: 'body',
      fetchImpl,
    });
    expect(res).toEqual({ ok: true, status: 200 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.to).toEqual([
      'mingqian.chen@bostonidentity.com',
      'le.deng@bostonidentity.com',
    ]);
    expect(body.attachments).toBeUndefined();
  });

  it("keeps the provider's explanation, not just the status", async () => {
    // The 403 body names both cause and fix; discarding it cost three orders
    // on 2026-08-10 in the licence Worker.
    const fetchImpl = vi.fn(async () =>
      new Response('You can only send testing emails to your own email address', { status: 403 })
    );
    const res = await sendReport({
      apiKey: 'rk', from: 'x', to: ['y@z.com'], subject: 's', text: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toContain('only send testing emails');
  });
});
