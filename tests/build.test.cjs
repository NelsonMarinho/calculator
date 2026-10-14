const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
const {build,PUBLIC_FILES}=require('../scripts/build.cjs');
const {SOURCE,prepareHTML}=require('../scripts/prepare.cjs');

function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'jornada-build-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.copyFileSync(SOURCE,path.join(root,SOURCE));
 for(const name of PUBLIC_FILES){fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.copyFileSync(name,path.join(root,name));}
 return root;
}
function list(root){return fs.readdirSync(root,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?list(path.join(root,entry.name)).map(name=>entry.name+'/'+name):[entry.name]).sort();}

test('build gera somente os arquivos públicos, com referências válidas',t=>{
 const root=fixture(t);fs.writeFileSync(path.join(root,'.env'),'PRIVATE_TEST_ONLY=example');fs.mkdirSync(path.join(root,'scripts'));fs.writeFileSync(path.join(root,'scripts','internal.txt'),'internal');
 const result=build(root);assert.equal(result.count,8);
 assert.deepEqual(list(result.output),['assets/css/pwa.css','assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/maskable-512.png','assets/js/pwa.js','index.html','manifest.webmanifest','sw.js'].sort());
 const html=fs.readFileSync(path.join(result.output,'index.html'),'utf8');
 assert.equal(html,prepareHTML(fs.readFileSync(path.join(root,SOURCE),'utf8')));
 const raw=fs.readFileSync(path.join(root,SOURCE),'utf8');
 assert.equal(html.match(/<style>([\s\S]*?)<\/style>/)[1],raw.match(/<style>([\s\S]*?)<\/style>/)[1]);
 assert.equal(html.match(/<script>([\s\S]*?)<\/script>/)[1],raw.match(/<script>([\s\S]*?)<\/script>/)[1]);
 for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g))assert.ok(fs.existsSync(path.join(result.output,match[1])));
 for(const icon of JSON.parse(fs.readFileSync(path.join(result.output,'manifest.webmanifest'))).icons)assert.ok(fs.existsSync(path.join(result.output,icon.src)));
 const worker=fs.readFileSync(path.join(result.output,'sw.js'),'utf8');new vm.Script(worker);assert.ok(worker.includes(`const VERSION='${result.version}';`));
});
test('mesmo conteúdo produz a mesma versão de cache',t=>{const root=fixture(t);assert.equal(build(root).version,build(root).version);});
test('alteração do HTML v8 muda a versão de cache no deploy',t=>{const root=fixture(t);const previous=build(root).version;fs.appendFileSync(path.join(root,SOURCE),'\n/* alteração para teste */\n');assert.notEqual(build(root).version,previous);});
test('alteração do próprio worker também muda a versão',t=>{const root=fixture(t);const previous=build(root).version;fs.appendFileSync(path.join(root,'sw.js'),'\n/* alteração do worker */\n');assert.notEqual(build(root).version,previous);});
test('novo build remove arquivos antigos da saída e preserva as fontes',t=>{const root=fixture(t);const original=fs.readFileSync(path.join(root,'sw.js'),'utf8');build(root);fs.writeFileSync(path.join(root,'dist','old.txt'),'old');build(root);assert.equal(fs.existsSync(path.join(root,'dist','old.txt')),false);assert.equal(fs.readFileSync(path.join(root,'sw.js'),'utf8'),original);});
test('marcador de versão ausente interrompe o build antes de substituir a saída',t=>{const root=fixture(t);build(root);fs.writeFileSync(path.join(root,'sw.js'),'/* sem marcador */');assert.throws(()=>build(root),/VERSION/);assert.ok(fs.existsSync(path.join(root,'dist','index.html')));});
