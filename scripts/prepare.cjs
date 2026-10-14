const fs=require('node:fs');
const path=require('node:path');
const SOURCE='calculador-jornada-v8.html';
function prepareHTML(source){
  if(!source.includes('</head>')||!source.includes('</body>')||!source.includes('<section class="view" id="v-cfg" hidden>'))throw new Error('HTML v8 incompleto.');
  const settings=`
  <section class="card" id="pwaSettings"><h2>Aplicativo</h2><p class="hint" id="pwaStatus" role="status">Preparando acesso offline…</p><p class="hint">Os dados ficam neste aparelho. Use Backup para transferi-los. Alertas com o app fechado dependem dos lembretes exportados para o calendário.</p><div class="actions"><button class="b" id="pwaInstall" type="button">Instalar aplicativo</button><button class="b" id="pwaUpdate" type="button" hidden>Atualizar aplicativo</button></div><p class="hint" id="pwaHelp" hidden></p></section>
`;
  const end='</section>\n<p class="disc">';
  if(!source.includes(end))throw new Error('Não foi encontrado o final da aba Ajustes.');
  return source.replace('width=device-width, initial-scale=1','width=device-width, initial-scale=1, viewport-fit=cover')
    .replace('</head>','<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" type="image/png" href="assets/icons/icon-192.png">\n<link rel="apple-touch-icon" href="assets/icons/icon-192.png">\n<link rel="stylesheet" href="assets/css/pwa.css">\n</head>')
    .replace(end,settings+end)
    .replace('</body>','<script src="assets/js/pwa.js" defer></script>\n</body>');
}
function prepare(root=path.resolve(__dirname,'..')){const html=prepareHTML(fs.readFileSync(path.join(root,SOURCE),'utf8'));fs.writeFileSync(path.join(root,'index.html'),html);return html;}
if(require.main===module){prepare();console.log('index.html gerado diretamente do HTML v8.');}
module.exports={SOURCE,prepare,prepareHTML};
