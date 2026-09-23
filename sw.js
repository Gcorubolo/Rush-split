const CACHE='rush-split-v1'; const SHELL=['./','./index.html','./manifest.json','./css/style.css','./js/app.js','./js/storage.js','./js/settlement.js','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{let c=x.clone();caches.open(CACHE).then(a=>a.put(e.request,c));return x}).catch(()=>caches.match('./index.html'))))});
