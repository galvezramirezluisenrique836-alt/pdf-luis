/* PDF_Luis — funciona sin internet.
   Sirve lo guardado al instante y, si hay señal, descarga la versión nueva
   para el siguiente arranque. Así nunca esperas y las mejoras llegan solas. */
const CACHE='pdfluis';
const BASE=['./','./index.html','./manifest.webmanifest','./icono-192.png',
            './icono-512.png','./icono-maskable.png','./apple-touch-icon.png','./favicon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(BASE)).then(()=>self.skipWaiting()).catch(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys()
    .then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  let u;try{u=new URL(req.url);}catch(_){return;}
  if(u.origin!==location.origin)return;
  e.respondWith(caches.open(CACHE).then(async c=>{
    const guardado=await c.match(req,{ignoreSearch:true});
    const red=fetch(req).then(r=>{
      if(r&&r.ok&&r.type==='basic')c.put(req,r.clone()).catch(()=>{});
      return r;
    }).catch(()=>null);
    if(guardado){red.catch(()=>{});return guardado;}
    const r=await red;
    if(r)return r;
    if(req.mode==='navigate'){const i=await c.match('./index.html');if(i)return i;}
    return new Response('Sin conexión',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }));
});
