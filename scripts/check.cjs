const fs=require('node:fs');
const vm=require('node:vm');
const {SOURCE,prepareHTML}=require('./prepare.cjs');
for(const file of ['assets/js/pwa.js','sw.js','scripts/prepare.cjs','scripts/build.cjs']){
  new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});console.log('Sintaxe OK:',file);
}
const source=fs.readFileSync(SOURCE,'utf8');
const html=fs.readFileSync('index.html','utf8');
if(html!==prepareHTML(source))throw new Error('index.html não corresponde ao HTML v8. Execute npm run prepare:app.');
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(match[1].trim())new vm.Script(match[1],{filename:SOURCE});
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
if(new Set(ids).size!==ids.length)throw new Error('IDs duplicados');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!fs.existsSync(match[1]))throw new Error('Arquivo ausente: '+match[1]);
for(const icon of JSON.parse(fs.readFileSync('manifest.webmanifest')).icons)if(!fs.existsSync(icon.src))throw new Error('Ícone ausente');
JSON.parse(fs.readFileSync('vercel.json','utf8'));
console.log('HTML v8, manifesto, ícones e configuração da Vercel OK');
