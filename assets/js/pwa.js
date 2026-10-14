(()=>{
  const banner=document.getElementById('installBanner'),button=document.getElementById('installButton');
  const help=document.getElementById('installHelp'),instructions=document.getElementById('installInstructions');
  const network=document.getElementById('networkState'),update=document.getElementById('updateBanner');
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  let prompt=null,registration=null,reloading=false,offlineReady=false;
  function status(){network.textContent=offlineReady?(navigator.onLine?'Pronto para usar offline':'Sem conexão · modo offline'):(navigator.onLine?'Preparando acesso offline…':'Sem conexão · offline ainda não preparado');}
  function showHelp(){
    help.hidden=false;
    instructions.textContent=!window.isSecureContext||location.protocol==='file:'?'Para instalar e preparar o modo offline, abra o app por um endereço HTTPS. Abrir o arquivo HTML diretamente não permite a instalação.':standalone()?'O app já está aberto no modo instalado. Após preparar o acesso offline, você pode registrar horários sem internet.':'No Android, abra este endereço no Chrome ou Samsung Internet e use o menu do navegador: “Instalar app” ou “Adicionar à tela inicial”. No notebook, procure a opção de instalar na barra de endereço ou no menu. Se abriu dentro de outro app, escolha abrir no navegador.';
    help.scrollIntoView({behavior:'smooth',block:'center'});
    document.getElementById('closeInstallHelp').focus();
  }
  banner.hidden=standalone();
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;banner.hidden=standalone();button.textContent='Instalar app';});
  window.addEventListener('appinstalled',()=>{banner.hidden=true;prompt=null;toast('Minha Jornada instalada.','ok');});
  button.onclick=async()=>{
    if(!prompt){showHelp();return;}
    const pending=prompt;prompt=null;
    try{await pending.prompt();const choice=await pending.userChoice;if(choice.outcome==='accepted')banner.hidden=true;}catch(e){showHelp();}
  };
  document.getElementById('installSettings').onclick=showHelp;
  document.getElementById('closeInstallHelp').onclick=()=>{help.hidden=true;(banner.hidden?document.getElementById('installSettings'):button).focus();};
  window.addEventListener('online',status);window.addEventListener('offline',status);
  function waiting(){if(registration&&registration.waiting)update.hidden=false;}
  document.getElementById('updateButton').onclick=()=>{
    if(!registration||!registration.waiting)return;
    if(!document.getElementById('sheet').hidden){toast('Confirme ou cancele o horário antes de atualizar.','warn');return;}
    if(!save())return;
    reloading=true;registration.waiting.postMessage({type:'SKIP_WAITING'});
  };
  if('serviceWorker' in navigator&&window.isSecureContext&&location.protocol!=='file:'){
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)location.reload();});
    navigator.serviceWorker.register('./sw.js').then(reg=>{
      registration=reg;waiting();
      reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed')waiting();});});
      return navigator.serviceWorker.ready;
    }).then(()=>{offlineReady=true;status();}).catch(()=>{network.textContent='Acesso offline indisponível';});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&registration)registration.update().catch(()=>{});});
  }else network.textContent='Abra por HTTPS para usar offline';
})();
