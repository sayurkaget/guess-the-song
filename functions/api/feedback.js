/* Private, write-only feedback inbox. Read submissions in the owner's D1 dashboard. */
const reply = (status, body) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store' }
});

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return reply(405, { ok: false });
  const origin = request.headers.get('Origin');
  if (origin !== new URL(request.url).origin) return reply(403, { ok: false });
  if (!(request.headers.get('Content-Type') || '').startsWith('application/x-www-form-urlencoded')) {
    return reply(415, { ok: false });
  }
  // Bound the body before decoding; never store IPs, cookies, or request headers.
  const reader = request.body?.getReader();
  if (!reader) return reply(400, { ok: false });
  const chunks = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 20000) { await reader.cancel(); return reply(413, { ok: false }); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const fields = new URLSearchParams(new TextDecoder().decode(bytes));
  if (fields.get('bot-field')) return reply(400, { ok: false });
  const category = fields.get('category') || '';
  const message = (fields.get('message') || '').trim();
  const email = (fields.get('email') || '').trim();
  const details = (fields.get('game-details') || '').trim();
  if (!['bug', 'song', 'other'].includes(category) || message.length < 5 || message.length > 3000 ||
      email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || details.length > 600) {
    return reply(400, { ok: false });
  }
  if (!env.FEEDBACK_DB) return reply(503, { ok: false });
  try {
    const result = await env.FEEDBACK_DB.prepare(
      'INSERT INTO feedback (id, created_at, category, message, email, game_details) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), new Date().toISOString(), category, message, email, details).run();
    if (!result.success) throw new Error('Storage failed');
    return reply(201, { ok: true });
  } catch {
    return reply(503, { ok: false });
  }
}
