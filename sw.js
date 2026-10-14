/* Bump the version on every release that changes a cached file. */
const VERSION='v8';
const BASE=new URL('./',self.location.href);
const PREFIX='minha-jornada:'+BASE.pathname+':';
const CACHE=PREFIX+VERSION;
const SHELL=['./','index.html','manifest.webmanifest','assets/css/pwa.css','assets/js/pwa.js','assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/maskable-512.png'];
const URLS=SHELL.map(path=>new URL(path,BASE).href);
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS)));
  // Updated versions wait until the user chooses to reload.
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',event=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
  if(event.request.mode==='navigate'){
    // Versioned shell avoids mixing an old JS bundle with a new HTML page.
    event.respondWith(caches.open(CACHE).then(cache=>cache.match(new URL('index.html',BASE).href)).then(cached=>cached||fetch(event.request)));
  }else if(URLS.includes(url.href)){
    event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request)).then(cached=>cached||fetch(event.request)));
  }
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL('index.html#hoje',BASE).href;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
    const client=clients.find(item=>item.url.startsWith(BASE.href));
    if(client){await client.navigate(target);return client.focus();}
    return self.clients.openWindow(target);
  }));
});
