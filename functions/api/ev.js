// Contagem anônima de uso: soma +1 por tela, função ou show marcado. Sem identificador, sem IP, sem texto livre.
const ORIGIN_OK = /^https:\/\/([a-z0-9-]+\.)?rock-the-app\.pages\.dev$/;
const KEY_OK = /^(tab|fn|w|m):[\p{L}\p{N} .,&'+\/_-]{1,80}$/u;
let ready = false;
export async function onRequestPost({ request, env }) {
  try {
    const origin = request.headers.get('Origin');
    if (env.DB && (!origin || ORIGIN_OK.test(origin))) {
      const b = await request.json().catch(() => ({}));
      const ks = (Array.isArray(b.k) ? b.k : []).slice(0, 25).map(String).filter(k => KEY_OK.test(k));
      if (ks.length) {
        if (!ready) {
          await env.DB.prepare('CREATE TABLE IF NOT EXISTS ev(day TEXT NOT NULL, k TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day,k))').run();
          ready = true;
        }
        const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
        await env.DB.batch(ks.map(k => env.DB.prepare('INSERT INTO ev(day,k,n) VALUES(?,?,1) ON CONFLICT(day,k) DO UPDATE SET n=n+1').bind(day, k)));
      }
    }
  } catch (e) { /* métrica nunca deve quebrar o app */ }
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
