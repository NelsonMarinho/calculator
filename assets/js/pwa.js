/* Does not replace the v8 controls, calculations or keyboard flow. */
(()=>{
  const status=document.getElementById('pwaStatus'),install=document.getElementById('pwaInstall');
  const update=document.getElementById('pwaUpdate'),help=document.getElementById('pwaHelp');
  let prompt=null,registration=null,ready=false,reload=false;
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  function refresh(){install.hidden=standalone();status.textContent=ready?(navigator.onLine?'Pronto para usar offline':'Sem conexão · modo offline'):'Acesso offline ainda não preparado';}
  function instructions(){help.hidden=false;help.textContent=location.protocol==='file:'||!window.isSecureContext?'Para instalar, abra o endereço HTTPS publicado. Abrir o HTML diretamente não permite preparar o acesso offline.':'No Android, use o menu do Chrome ou Samsung Internet: “Instalar app” ou “Adicionar à tela inicial”. No notebook, use a opção de instalar na barra de endereço ou no menu.';}
  install.onclick=async()=>{if(!prompt){instructions();return;}const pending=prompt;prompt=null;try{await pending.prompt();await pending.userChoice;}catch(e){instructions();}};
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;install.hidden=standalone();});
  window.addEventListener('appinstalled',()=>{prompt=null;refresh();toast('Aplicativo instalado.','ok');});
  window.addEventListener('online',refresh);window.addEventListener('offline',refresh);
  update.onclick=()=>{if(!registration||!registration.waiting)return;if(!document.getElementById('sheet').hidden){toast('Conclua ou cancele a edição do horário antes de atualizar.','warn');return;}if(!save())return;reload=true;registration.waiting.postMessage({type:'SKIP_WAITING'});};
  if('serviceWorker' in navigator&&window.isSecureContext&&location.protocol!=='file:'){
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reload)location.reload();});
    navigator.serviceWorker.register('./sw.js').then(reg=>{
      registration=reg;const waiting=()=>{update.hidden=!reg.waiting;};waiting();
      reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed')waiting();});});
      return navigator.serviceWorker.ready;
    }).then(()=>{ready=true;refresh();}).catch(()=>{status.textContent='Acesso offline indisponível. Tente reabrir com conexão.';});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&registration)registration.update().catch(()=>{});});
  }else status.textContent='Abra por HTTPS para instalar e usar offline.';
  install.hidden=standalone();
  const initial=location.hash.slice(1);if(['hoje','mes','cfg'].includes(initial))showTab(initial);
})();
