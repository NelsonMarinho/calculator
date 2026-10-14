const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function worker(){
 const handlers={},contents=new Map(),removed=[],calls=[],state={claimed:false,skipped:false};
 const cache={addAll:async urls=>{for(const url of urls){const path=new URL(url).pathname.replace('/jornada/','')||'index.html';assert.ok(fs.existsSync(path),'Cache referencia arquivo ausente: '+path);contents.set(url,'cached:'+path);}},match:async key=>contents.get(typeof key==='string'?key:key.url)};
 const c=vm.createContext({URL,caches:{open:async()=>cache,keys:async()=>['minha-jornada:/jornada/:v0','other-app-v1','minha-jornada:/jornada/:v8','minha-jornada:/other/:v0'],delete:async key=>removed.push(key)},fetch:async request=>{calls.push(request);throw new Error('offline');},self:{location:{href:'https://example.test/jornada/sw.js'},addEventListener:(name,handler)=>handlers[name]=handler,clients:{claim:async()=>{state.claimed=true;}},skipWaiting:()=>{state.skipped=true;}}});
 vm.runInContext(fs.readFileSync('sw.js','utf8'),c);
 async function event(name,extra={}){let promise;handlers[name]({...extra,waitUntil:p=>promise=p,respondWith:p=>promise=p});return promise;}
 return {event,handlers,contents,removed,calls,state};
}
test('instalação prepara todos os arquivos para uso offline',async()=>{const w=worker();await w.event('install');assert.equal(w.contents.size,8);assert.equal(w.state.skipped,false);});
test('navegação offline devolve a interface inclusive em subdiretório',async()=>{const w=worker();await w.event('install');const response=await w.event('fetch',{request:{url:'https://example.test/jornada/index.html',method:'GET',mode:'navigate'}});assert.equal(response,'cached:index.html');assert.equal(w.calls.length,0);});
test('scripts são servidos da mesma versão sem rede',async()=>{const w=worker();await w.event('install');assert.equal(await w.event('fetch',{request:{url:'https://example.test/jornada/assets/js/pwa.js',method:'GET',mode:'cors'}}),'cached:assets/js/pwa.js');});
test('worker não intercepta outras origens, apps ou requisições de gravação',async()=>{const w=worker();for(const request of [{url:'https://external.test/api',method:'GET'},{url:'https://example.test/other-app/index.html',method:'GET'},{url:'https://example.test/jornada/api',method:'POST'}])assert.equal(await w.event('fetch',{request}),undefined);});
test('atualização limpa só os caches antigos do próprio app',async()=>{const w=worker();await w.event('activate');assert.deepEqual(w.removed,['minha-jornada:/jornada/:v0']);assert.equal(w.state.claimed,true);});
test('nova versão só é ativada mediante mensagem de atualização',()=>{const w=worker();w.handlers.message({data:{type:'OTHER'}});assert.equal(w.state.skipped,false);w.handlers.message({data:{type:'SKIP_WAITING'}});assert.equal(w.state.skipped,true);});
test('manifesto contém instalação standalone e ícones PNG corretos',()=>{const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest'));assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./index.html#hoje');for(const icon of manifest.icons){const png=fs.readFileSync(icon.src);assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');const size=Number(icon.sizes.split('x')[0]);assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);}});
