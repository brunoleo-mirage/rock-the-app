const V='rta-v88';
const CORE=['./','index.html','map.jpg','sticker.png','mirage-logo.png','manifest.webmanifest','favicon.png','icons/icon-192.png','icons/icon-512.png','fonts/AmaticSC-Regular.woff','fonts/AmaticSC-Bold.woff','chars/storm.webp','chars/storm-2.webp','chars/storm-3.webp','chars/rain.webp','chars/rain-2.webp','chars/rain-3.webp','chars/mix.webp','chars/mix-2.webp','chars/mix-3.webp','chars/sun.webp','chars/sun-2.webp','chars/sun-3.webp','chars/cold.webp','chars/cold-2.webp','chars/cold-3.webp','chars/fog.webp','chars/fog-2.webp','chars/fog-3.webp','chars/hot.webp','chars/hot-2.webp','chars/hot-3.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!=='rta-fonts').map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return; const u=new URL(r.url);
  if(u.hostname==='api.open-meteo.com')return;
  if(u.origin===location.origin&&u.pathname==='/app'){
    /* navegação não aceita resposta "redirected": entrega uma cópia limpa do cache se estiver sem internet */
    e.respondWith(fetch(r).catch(()=>caches.match('./').then(m=>m||caches.match('index.html')).then(m=>m?m.blob().then(b=>new Response(b,{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}})):Response.error())));
    return;}
  if(u.origin===location.origin&&r.mode==='navigate'){
    /* abrir o app: tenta a internet primeiro (versão nova), mas desiste em 4 s e usa a cópia guardada */
    const clean=()=>caches.match('./').then(m=>m||caches.match('index.html')).then(m=>m?m.blob().then(b=>new Response(b,{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}})):Response.error());
    e.respondWith(new Promise(res=>{let done=false;const to=setTimeout(()=>{if(!done){done=true;clean().then(res);}},4000);
      fetch(r).then(x=>{if(done)return;done=true;clearTimeout(to);if(x&&x.ok){const cp=x.clone();caches.open(V).then(c=>c.put('./',cp));}res(x);}).catch(()=>{if(!done){done=true;clearTimeout(to);clean().then(res);}});}));
    return;}
  if(u.origin===location.origin){
    e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>{
      const net=fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));}return res;}).catch(()=>m);
      return m||net;}));
    return;}
  if(/gstatic\.com$|googleapis\.com$/.test(u.hostname)){
    e.respondWith(caches.open('rta-fonts').then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'&&u.hostname.endsWith('gstatic.com')))c.put(r,res.clone());return res;}).catch(()=>m))));
  }
});
