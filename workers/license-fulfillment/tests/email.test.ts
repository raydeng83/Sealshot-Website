import { describe, it, expect, vi } from 'vitest';
import { sendLicenseEmail } from '../src/email';

describe('sendLicenseEmail', () => {
  it('posts to Resend with a base64 attachment', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ id: 'e1' }), { status: 200 }));
    const res = await sendLicenseEmail({
      apiKey: 'rk', from: 'Sealshot <license@mail.seal-shot.com>', to: 'buyer@example.com',
      name: 'Buy Er', fileName: 'buyer@example.com.sealshotlicense', fileText: 'FILE',
      fetchImpl,
    });
    expect(res).toEqual({ ok: true, status: 200 });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.to).toBe('buyer@example.com');
    expect(body.attachments[0].filename).toBe('buyer@example.com.sealshotlicense');
    expect(atob(body.attachments[0].content)).toBe('FILE');
  });
  it('reports non-ok status', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 422 }));
    const res = await sendLicenseEmail({
      apiKey: 'rk', from: 'x', to: 'y', name: 'n', fileName: 'f', fileText: 'F',
      fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(422);
  });

  it("carries the provider's explanation, not just the status", async () => {
    // The real 403 that stalled three orders on 2026-08-10. The status alone
    // says nothing; this body names both the cause and the fix.
    const explanation = JSON.stringify({
      statusCode: 403,
      message: 'You can only send testing emails to your own email address (owner@example.com)',
      name: 'validation_error',
    });
    const fetchImpl = vi.fn(async () => new Response(explanation, { status: 403 }));
    const res = await sendLicenseEmail({
      apiKey: 'rk', from: 'x', to: 'y', name: 'n', fileName: 'f', fileText: 'F',
      fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toContain('You can only send testing emails');
  });

  it('bounds the explanation so a huge error page cannot bloat the order record', async () => {
    const fetchImpl = vi.fn(async () => new Response('x'.repeat(5000), { status: 500 }));
    const res = await sendLicenseEmail({
      apiKey: 'rk', from: 'x', to: 'y', name: 'n', fileName: 'f', fileText: 'F',
      fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(res.error!.length).toBeLessThanOrEqual(301);
  });

  it('leaves the explanation unset on success, and on an empty body', async () => {
    const okFetch = vi.fn(async () => new Response(JSON.stringify({ id: 'e1' }), { status: 200 }));
    const ok = await sendLicenseEmail({
      apiKey: 'rk', from: 'x', to: 'y', name: 'n', fileName: 'f', fileText: 'F',
      fetchImpl: okFetch as unknown as typeof fetch });
    expect(ok.error).toBeUndefined();

    const emptyFetch = vi.fn(async () => new Response('', { status: 502 }));
    const empty = await sendLicenseEmail({
      apiKey: 'rk', from: 'x', to: 'y', name: 'n', fileName: 'f', fileText: 'F',
      fetchImpl: emptyFetch as unknown as typeof fetch });
    expect(empty.error).toBeUndefined();
  });
});
