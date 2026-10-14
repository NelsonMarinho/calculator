const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const PUBLIC_FILES=[
  'index.html','manifest.webmanifest','sw.js',
  'assets/css/app.css','assets/js/core.js','assets/js/storage.js',
  'assets/js/app.js','assets/js/pwa.js',
  'assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/maskable-512.png'
];

function build(root=path.resolve(__dirname,'..')){
  const output=path.join(root,'dist');
  const files=PUBLIC_FILES.map(name=>({name,content:fs.readFileSync(path.join(root,name))}));
  const worker=files.find(file=>file.name==='sw.js').content.toString('utf8');
  const marker=/^const VERSION='[^']+';$/m;
  if(!marker.test(worker))throw new Error('Não foi encontrado o marcador VERSION no service worker.');
  const hash=crypto.createHash('sha256');
  for(const file of files){hash.update(file.name+'\0');hash.update(crypto.createHash('sha256').update(file.content).digest());}
  const version='build-'+hash.digest('hex').slice(0,16);
  fs.rmSync(output,{recursive:true,force:true});
  for(const file of files){
    const destination=path.join(output,file.name);
    fs.mkdirSync(path.dirname(destination),{recursive:true});
    fs.writeFileSync(destination,file.name==='sw.js'?worker.replace(marker,`const VERSION='${version}';`):file.content);
  }
  return {output,version,count:files.length};
}

if(require.main===module){
  const result=build();
  console.log(`Build concluído: ${result.count} arquivos públicos em dist; cache ${result.version}.`);
}
module.exports={build,PUBLIC_FILES};
