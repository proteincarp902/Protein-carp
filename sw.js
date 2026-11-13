/* Service worker: caches the app shell only. Firestore/Firebase/CDN calls are never cached. */
const VERSION = "pc-v91";
const SHELL = ["./","index.html","style.css","app.js","i18n.js","manifest.json","assets/icon-192.png"];
self.addEventListener("install", e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL).catch(()=>{})));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("message", e=>{ if(e.data==="skipWaiting") self.skipWaiting(); });
self.addEventListener("fetch", e=>{
  const req = e.request, url = new URL(req.url);
  if(req.method !== "GET" || url.origin !== location.origin) return;
  // network first (always fresh when online), cache fallback (works offline)
  e.respondWith(fetch(req).then(res=>{
    if(res.ok){ const copy = res.clone(); caches.open(VERSION).then(c=>c.put(req,copy)); }
    return res;
  }).catch(()=>caches.match(req).then(r=>r || (req.mode==="navigate" ? caches.match("index.html") : Response.error()))));
});
