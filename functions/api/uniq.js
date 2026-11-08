// Contagem anônima de pessoas únicas: recebe um código aleatório do aparelho, guarda só o hash (SHA-256 com sal),
// por dia. Não grava IP, cidade, horário individual nem qualquer dado pessoal. Também soma +1 em origem e hora de pico.
const ORIGIN_OK = /^https:\/\/([a-z0-9-]+\.)?rock-the-app\.pages\.dev$/;
let ready = false;
async function init(DB) {
  if (ready) return;
  await DB.batch([
    DB.prepare('CREATE TABLE IF NOT EXISTS uq(day TEXT NOT NULL, h TEXT NOT NULL, PRIMARY KEY(day,h))'),
    DB.prepare('CREATE TABLE IF NOT EXISTS ev(day TEXT NOT NULL, k TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day,k))'),
  ]);
  ready = true;
}
const bump = (DB, day, k) => DB.prepare('INSERT INTO ev(day,k,n) VALUES(?,?,1) ON CONFLICT(day,k) DO UPDATE SET n=n+1').bind(day, k);

export async function onRequestPost({ request, env }) {
  try {
    const origin = request.headers.get('Origin');
    if (env.DB && (!origin || ORIGIN_OK.test(origin))) {
      const b = await request.json().catch(() => ({}));
      const id = String(b.id || '');
      if (/^[A-Za-z0-9-]{16,64}$/.test(id)) {
        await init(env.DB);
        const now = new Date();
        const day = now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
        const hr = now.toLocaleTimeString('sv-SE', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }).slice(0, 2);
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('rta-uq|' + id));
        const h = [...new Uint8Array(buf)].slice(0, 12).map(x => x.toString(16).padStart(2, '0')).join('');
        const seen = await env.DB.prepare('SELECT 1 AS x FROM uq WHERE h=? LIMIT 1').bind(h).first();
        const today = await env.DB.prepare('SELECT 1 AS x FROM uq WHERE day=? AND h=?').bind(day, h).first();
        if (!today) {
          const st = [env.DB.prepare('INSERT OR IGNORE INTO uq(day,h) VALUES(?,?)').bind(day, h), bump(env.DB, day, seen ? 'ret' : 'new'), bump(env.DB, day, 'h:' + hr)];
          const src = String(b.src || '');
          if (/^[a-z0-9_-]{1,20}$/.test(src)) st.push(bump(env.DB, day, 'src:' + src));
          await env.DB.batch(st);
        }
      }
    }
  } catch (e) { /* métrica nunca deve quebrar o app */ }
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
