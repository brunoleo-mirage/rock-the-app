// Contagem anônima de acessos por cidade (só métricas).
// Recebe um POST sem corpo. Lê a cidade estimada pela rede do Cloudflare (request.cf)
// e soma +1 em (dia, país, estado, cidade). Não grava IP, identificador, horário individual nem qualquer dado do usuário.
const ORIGIN_OK = /^https:\/\/([a-z0-9-]+\.)?rock-the-app\.pages\.dev$/;
const clean = s => String(s || '').replace(/[\u0000-\u001f]/g, '').slice(0, 60) || '?';

export async function onRequestPost({ request, env }) {
  try {
    const origin = request.headers.get('Origin');
    if (env.DB && (!origin || ORIGIN_OK.test(origin))) {
      const cf = request.cf || {};
      const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
      await env.DB.prepare(
        'INSERT INTO hits(day,country,region,city,n) VALUES(?,?,?,?,1) ' +
        'ON CONFLICT(day,country,region,city) DO UPDATE SET n=n+1'
      ).bind(day, clean(cf.country), clean(cf.region), clean(cf.city)).run();
    }
  } catch (e) { /* métrica nunca deve quebrar o app */ }
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
