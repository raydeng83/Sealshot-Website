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
});
