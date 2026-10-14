const fs=require('node:fs');
const vm=require('node:vm');
const files=['assets/js/core.js','assets/js/storage.js','assets/js/app.js','assets/js/pwa.js','sw.js'];
for(const file of files){new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});console.log('Sintaxe OK:',file);}
const html=fs.readFileSync('index.html','utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
if(new Set(ids).size!==ids.length)throw new Error('IDs duplicados');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!fs.existsSync(match[1]))throw new Error('Arquivo ausente: '+match[1]);
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
for(const icon of manifest.icons)if(!fs.existsSync(icon.src))throw new Error('Ícone ausente');
console.log('HTML, manifesto e arquivos locais OK');
