
const $=id=>document.getElementById(id);
const num=(id,d)=>{const v=parseFloat($(id).value);return isNaN(v)?d:v};
const brl=v=>DB.cfg.hide?'R$ ••••':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
const hourly=()=>DB.cfg.sal/(DB.cfg.div||220);
let DB={cfg:{...DEF,wk:[...DEF.wk]},days:{},fired:{}},cur=ymd(new Date()),last=null,notifyOn=false;

function load(){try{const data=JornadaStorage.load();if(data)DB=data;}catch(e){toast('Não foi possível ler os dados salvos. Restaure um backup em Espelho.','bad');}}
function save(){try{JornadaStorage.save(DB);$('saveState').textContent='Salvo neste aparelho';$('saveState').className='save-state pos';return true;}catch(e){$('saveState').textContent='Não foi possível salvar';$('saveState').className='save-state neg';toast('Não foi possível salvar. Exporte um backup antes de fechar o app.','bad');return false;}}
function fillForm(){const d=DB.days[cur]||{};F.forEach(i=>$(i).value=d[i]||'');$('tipo').value=d.tipo||'trab';$('modo').value=d.modo||'intervalo';syncMode();$('just').value=d.just||'';$('dt').value=cur;$('just').closest('details').open=!!d.just;$('dlabel').textContent=(cur===ymd(new Date())?'Hoje · ':'')+pd(cur).toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'})}
function syncMode(){const continuous=$('modo').value==='continua';$('times').classList.toggle('continuous',continuous);['sal','vol'].forEach(k=>$(k).closest('.f').hidden=continuous);$('modoHint').textContent=continuous?'Registre entrada e saída real. Máximo consecutivo: 6h. O saldo segue a jornada configurada em Ajustes.':'Registre as quatro batidas. Cada período de trabalho deve respeitar o limite consecutivo de 6h.';}
function readForm(){const d={};if($('modo').value==='continua')d.modo='continua';F.forEach(i=>{if($(i).value)d[i]=$(i).value});if($('tipo').value!=='trab')d.tipo=$('tipo').value;if($('just').value.trim())d.just=$('just').value.trim();if(Object.keys(d).length)DB.days[cur]=d;else delete DB.days[cur];delete DB.fired[cur]}
function fillCfg(){const c=DB.cfg;for(let i=0;i<7;i++)$('wk'+i).value=fmt(c.wk[i]);$('cb').value=fmt(c.B);$('a1').value=fmt(c.a1);$('a2').value=fmt(c.a2);$('ca').value=c.A;$('tol').checked=!!c.tol;$('prz').value=c.prz;$('ini').value=fmt(Math.abs(c.ini));$('iniS').value=c.ini<0?'-':'+';$('salr').value=c.sal?c.sal.toFixed(2).replace('.',','):'';$('dvs').value=c.div;$('p50').value=c.p50;$('p100').value=c.p100;$('pn').value=c.pn;$('hide').checked=!!c.hide}
function readCfg(){const c=DB.cfg;for(let i=0;i<7;i++)c.wk[i]=toMin($('wk'+i).value)||0;c.B=toMin($('cb').value)||0;c.a1=toMin($('a1').value)||110;c.a2=toMin($('a2').value)||115;c.A=Math.min(60,Math.max(1,+$('ca').value||10));c.tol=$('tol').checked?1:0;c.prz=+$('prz').value;const m=toMin($('ini').value)||0;c.ini=$('iniS').value==='-'?-m:m;c.sal=Math.min(100000000,parseBR($('salr').value));c.div=Math.min(300,Math.max(100,num('dvs',220)||220));c.p50=Math.min(300,Math.max(0,num('p50',50)));c.p100=Math.min(300,Math.max(0,num('p100',100)));c.pn=Math.min(300,Math.max(0,num('pn',20)));c.hide=$('hide').checked?1:0}

/* ===== Cálculo de um dia ===== */
const calcDay=date=>calculateDay(date,DB.days,DB.cfg);

/* ===== Intervalo entre jornadas: última saída real + 11h ===== */
const REST_MIN=660;
let restWarning=null;
function markStamp(date,minutes){const d=pd(date);d.setMinutes(minutes);return d.getTime();}
function stampLabel(ms){const d=new Date(ms);return br(ymd(d))+' às '+pad(d.getHours())+':'+pad(d.getMinutes());}
function restInfo(date){
  const current=calcDay(date);let previous=null;
  for(const k of Object.keys(DB.days).filter(k=>k<date).sort()){
    const day=calcDay(k);
    if(day.err||day.e==null||day.f==null)continue;
    const end=markStamp(k,day.f);
    if(!Number.isFinite(end))continue;
    if(!previous||end>previous.end)previous={date:k,end};
  }
  const start=current.e!=null?markStamp(date,current.e):null;
  const minutes=previous&&start!=null?(start-previous.end)/60000:null;
  const earliest=previous?previous.end+REST_MIN*60000:null;
  const nextEarliest=!current.err&&current.e!=null&&current.f!=null?markStamp(date,current.f)+REST_MIN*60000:null;
  return{previous,minutes,earliest,nextEarliest,missing:minutes!=null?Math.max(REST_MIN-minutes,0):null};
}
function drawRest(r,b){
  const box=$('restCard'),info=restInfo(cur),active=r.tipo!=='comp'&&r.tipo!=='atm';
  restWarning=null;box.hidden=!active;if(!active)return;
  let rows='',message='',kind='info';const copy=[];
  if(info.previous){
    rows+=`<div><dt>Última saída registrada</dt><dd>${stampLabel(info.previous.end)}</dd></div><div><dt>Entrada permitida a partir de</dt><dd>${stampLabel(info.earliest)}</dd></div>`;
    copy.push('Última saída: '+stampLabel(info.previous.end),'Entrada permitida a partir de: '+stampLabel(info.earliest));
    if(info.minutes!=null){
      rows+=`<div><dt>Descanso entre jornadas</dt><dd class="num ${info.missing?'neg':'pos'}">${fmt(info.minutes)}</dd></div>`;
      if(info.minutes<0){kind='bad';message='A entrada se sobrepõe à jornada anterior. Confira as datas e marcações reais.';}
      else if(info.missing){kind='bad';message='Descanso insuficiente: '+fmt(info.minutes)+'. Faltaram '+fmt(info.missing)+' para completar as 11h. Registre os horários reais e avise o gestor.';}
      else{kind='ok';message='Descanso de '+fmt(info.minutes)+': mínimo de 11h atendido.';}
      copy.push('Descanso: '+fmt(info.minutes),'Faltam para 11h: '+fmt(info.missing));
    }else message='Antes de iniciar a jornada, respeite o horário mínimo de entrada acima.';
  }else message='Sem saída anterior válida registrada: não é possível verificar as 11h de descanso.';
  if(info.nextEarliest){
    rows+=`<div><dt>Próxima entrada a partir de</dt><dd class="pos">${stampLabel(info.nextEarliest)}</dd></div>`;
    copy.push('Próxima entrada a partir de: '+stampLabel(info.nextEarliest));
  }
  box.innerHTML='<h2>Descanso entre jornadas · 11h</h2><p id="restGate" role="status" aria-live="polite" style="margin:0 0 10px;font-weight:600"></p>'+(rows?'<dl>'+rows+'</dl>':'')+`<p class="hint ${kind==='bad'?'neg':kind==='ok'?'pos':''}" style="margin:12px 0 0">${esc(message)}</p>`+'<p class="hint" style="margin:8px 0 0">Art. 66 da CLT. Conferência com base nas marcações disponíveis.</p>';
  if(info.missing){restWarning=message;b.M.push({k:'bad',t:message});}
  if(last&&last.text&&copy.length)last.text+='\n\nDescanso entre jornadas\n'+copy.join('\n');
}


/* ===== Liberação da primeira batida ===== */
function entryGate(date=cur,now=Date.now()){
  const info=restInfo(date),today=date===ymd(new Date(now));
  const type=(DB.days[date]||{}).tipo||'trab',active=type!=='comp'&&type!=='atm';
  const remaining=active&&today&&info.earliest!=null?Math.max(info.earliest-now,0):0;
  return{...info,today,active,remaining,locked:remaining>0};
}
function updateEntryGate(){
  const gate=entryGate(),ent=$('ent');
  ent.disabled=gate.locked;ent.closest('.f').classList.toggle('disabled',gate.locked);if($('quickPunch').dataset.next==='ent')$('quickPunch').disabled=gate.locked;ent.setAttribute('aria-disabled',String(gate.locked));
  document.querySelectorAll('[data-now]').forEach(button=>{
    button.disabled=!gate.today||!gate.active||(button.dataset.now==='ent'&&gate.locked);
    button.title=!gate.today?'Use o teclado para registrar outra data.':gate.locked&&button.dataset.now==='ent'?'Aguarde completar 11h de descanso.':'';
  });
  const box=$('restGate');if(!box||!gate.active)return;
  let message,kind='info';
  if(!gate.previous)message='Sem saída anterior registrada: liberação não verificada.';
  else if(!gate.today)message='Nesta data, a entrada deve ser a partir de '+stampLabel(gate.earliest)+'.';
  else if(gate.locked){kind='warn';const minutes=Math.ceil(gate.remaining/60000);message='Entrada bloqueada · faltam '+minutes+' min ('+fmt(minutes)+') para completar as 11h. Libera em '+stampLabel(gate.earliest)+'.';}
  else{kind='ok';message='Descanso de 11h concluído · '+(ent.value?'entrada liberada.':'já pode registrar a entrada.');}
  if(box.textContent!==message)box.textContent=message;
  box.className='s-'+kind;box.style.padding='10px 12px';box.style.borderRadius='10px';
}
function entryAllowed(value,showMessage=true){
  if(!value)return true;
  const gate=entryGate(),stamp=markStamp(cur,toMin(value));
  if(gate.locked||gate.earliest!=null&&stamp<gate.earliest){
    if(showMessage)toast('Entrada não registrada. Complete as 11h de descanso: entrada a partir de '+stampLabel(gate.earliest)+'.','warn');
    return false;
  }
  return true;
}

/* ===== Banco acumulado (compensa os créditos mais antigos primeiro) ===== */
function accum(){
  const ks=Object.keys(DB.days).sort(),lots=[];let tot=0,mes=0;
  const ap=(date,m)=>{if(m>0)lots.push({date,m});else{let n=-m;while(n>0&&lots.length){const l=lots[0],t=Math.min(l.m,n);l.m-=t;n-=t;if(!l.m)lots.shift()}}};
  if(DB.cfg.ini){ap(ks[0]||cur,DB.cfg.ini);tot+=DB.cfg.ini}
  ks.forEach(k=>{const r=calcDay(k);if(r.saldo==null)return;tot+=r.saldo;ap(k,r.saldo);if(k.slice(0,7)===cur.slice(0,7))mes+=r.saldo});
  return{tot,mes,lots};
}
function drawAcc(){
  const a=accum();let v='—',sub='sem créditos a vencer',cls='';
  if(a.lots.length){const l=a.lots[0],due=pd(l.date);due.setMonth(due.getMonth()+DB.cfg.prz);
    const dl=Math.round((due-pd(ymd(new Date())))/864e5);v=br(ymd(due));
    cls=dl<0?'neg':dl<=30?'wn':'';sub=(dl<0?'vencido há '+(-dl)+' dias':'em '+dl+' dias')+' · '+fmt(l.m)}
  $('acc').innerHTML=`<div><small>Saldo do mês</small><b class="num ${a.mes<0?'neg':'pos'}">${sgn(a.mes)}</b></div><div><small>Saldo total</small><b class="num ${a.tot<0?'neg':'pos'}">${sgn(a.tot)}</b></div><div><small>Próximo vencimento</small><b class="num ${cls}">${v}</b><i>${sub}</i></div>`;
}
function monthVals(){let e=0,n=0;Object.keys(DB.days).filter(k=>k.startsWith(cur.slice(0,7))).forEach(k=>{const r=calcDay(k);e+=r.vE||0;n+=r.vN||0});return{e,n}}
function drawHv(){
  const c=DB.cfg,h=hourly();
  $('hv').textContent=c.sal?'Valor da hora: '+brl(h)+' · extra '+c.p50+'%: '+brl(h*(1+c.p50/100))+' · dom./feriado '+c.p100+'%: '+brl(h*(1+c.p100/100))+' · noturno: +'+c.pn+'% sobre a hora':'Informe o salário para calcular o valor da hora e das horas extras. O divisor 220 corresponde a 44 horas semanais.';
}
function drawHist(){
  const ym=cur.slice(0,7),ks=Object.keys(DB.days).sort().filter(k=>k.startsWith(ym)),[y,m]=ym.split('-'),mv=monthVals();
  $('hc').innerHTML='<h2>Espelho de '+m+'/'+y+'</h2>'+(ks.length?'<table><tr><th>Dia</th><th>Tipo</th><th>Trab.</th><th>Saldo</th></tr>'+ks.map(k=>{const r=calcDay(k);return`<tr data-d="${k}" tabindex="0" class="${k===cur?'sel':''}"><td>${br(k).slice(0,5)} ${DOW[pd(k).getDay()]}</td><td>${TIPOS[r.tipo]}${r.continuous?'<small>Contínua · 2 batidas</small>':''}${restInfo(k).missing?'<small class="neg">Descanso &lt; 11h</small>':''}${r.d.just?'<small>✎ '+esc(r.d.just)+'</small>':''}</td><td class="num">${r.worked==null?'—':fmt(r.worked)}</td><td class="num ${r.saldo<0?'neg':'pos'}">${r.saldo==null?'—':sgn(r.saldo)}</td></tr>`}).join('')+'</table>'+(DB.cfg.sal&&(mv.e||mv.n)?'<p class="live">Estimativa do mês: extras '+brl(mv.e)+' · adicional noturno '+brl(mv.n)+'</p>':''):'<p class="empty">Nenhum dia registrado neste mês.</p>');
}

/* ===== Resultado do dia ===== */
const SEV={bad:0,warn:1,info:2,ok:3};
function build(r){
  const B=DB.cfg.B,M=[],add=(k,t)=>M.push({k,t});
  last=null;
  if(r.err){add('bad',r.err);return{html:'<p class="empty">Corrija os horários.</p>',M}}
  if(r.tipo==='comp'||r.tipo==='atm'){
    add('info',r.tipo==='comp'?'A jornada do dia é debitada do banco de horas.':'Atestado: o dia não gera débito nem crédito.');
    return{html:`<div class="big"><small>${r.tipo==='comp'?'Folga compensada pelo banco':'Dia abonado'}</small><b class="num ${r.saldo<0?'neg':''}">${r.saldo?sgn(r.saldo):'00:00'}</b></div>`,M}}
  if(r.continuous)return buildContinuous(r);
  if(r.cross)add('info','Jornada atravessa a meia-noite: horários após 00:00 contam como dia seguinte.');
  if(r.e==null||r.s==null||r.v==null){
    const mi=r.J>360?60:r.J>240?15:0;
    if(r.s!=null&&r.v==null&&mi)add('info','Volte do almoço a partir de '+clk(r.s+mi)+(mi===60?' (máximo '+clk(r.s+120)+')':'')+'.');
    return{html:'<p class="empty">Informe entrada, saída e volta do almoço.</p>',M}}
  const p=r.s-r.e,lunch=r.v-r.s,nightRow=r.night?`<div><dt>Noturno (22h às 5h)</dt><dd class="num">${fmt(r.night)} (+${fmt(r.night/7)} hora reduzida)${r.vN!=null?' · '+brl(r.vN):''}</dd></div>`:'';
  if(p>360||(r.sg!=null&&r.sg>360))add('bad','Limite consecutivo de 6h excedido em um período. Registre os horários reais e avise o gestor.');
  const chk=t=>{const mi=t>360?60:t>240?15:0;if(mi&&lunch<mi)add('warn','Almoço de '+fmt(lunch)+': o mínimo é '+fmt(mi)+' para esta jornada.');if(lunch>120)add('warn','Almoço de '+fmt(lunch)+': acima do máximo de 2 horas sem acordo escrito.')};
  let html,text;
  if(r.f==null){
    chk(r.J);
    const falta=Math.max(r.J-p,0),cumprir=r.v+falta,maxS=r.v+(r.J-p)+B;
    last={e:r.e,v:r.v,cumprir,maxS};
    html=`<div class="ring" id="ring" style="--p:${r.J?Math.min(p/r.J*100,100):100}"><div id="ringIn"><small>Sair às</small><b class="num">${clk(cumprir)}</b><small>jornada cumprida</small></div></div><div class="kpis"><div><small>Primeiro turno</small><b class="num">${fmt(p)}</b></div><div><small>Faltam</small><b class="num">${fmt(falta)}</b></div><div class="lim"><small>Limite do banco</small><b class="num">${clk(maxS)}</b></div></div>${nightRow?'<dl>'+nightRow+'</dl>':''}<div id="live"></div>`;
    text=`Primeiro Turno: ${fmt(p)}\nFaltam para jornada: ${fmt(falta)}\nSaída para cumprir jornada: ${clk(cumprir)}\nSaída máxima permitida: ${clk(maxS)}`;
  }else{
    const sg=r.sg,tot=r.worked,saldo=r.saldo,maxS=r.v+(r.J-p)+B;
    chk(tot);
    html=`<div class="ring" style="--p:${r.J?Math.min(tot/r.J*100,100):100};--rc:${saldo>B?'var(--bad)':saldo<0?'var(--warn)':'var(--ok)'}"><div><small>Saldo do dia</small><b class="num ${saldo>=0?'pos':'neg'}">${sgn(saldo)}</b><small>${fmt(tot)} de ${fmt(r.J)}</small></div></div><dl><div><dt>Primeiro turno</dt><dd class="num">${fmt(p)}</dd></div><div><dt>Segundo turno</dt><dd class="num">${fmt(sg)}</dd></div><div><dt>Total trabalhado</dt><dd class="num">${fmt(tot)}</dd></div><div><dt>Almoço</dt><dd class="num">${fmt(lunch)}</dd></div><div><dt>Jornada contratada</dt><dd class="num">${fmt(r.J)}</dd></div><div><dt>Horas extras</dt><dd class="num">${fmt(Math.max(saldo,0))}${r.vE>0?' · '+brl(r.vE)+' ('+r.pc+'%)':''}</dd></div><div><dt>Saída máxima permitida</dt><dd class="num">${clk(maxS)}</dd></div>${nightRow}</dl>`;
    text=`Resumo da Jornada\n\nEntrada: ${clk(r.e)}\nSaída Almoço: ${clk(r.s)}\nRetorno Almoço: ${clk(r.v)}\nSaída Final: ${clk(r.f)}\n\nPrimeiro Turno: ${fmt(p)}\nSegundo Turno: ${fmt(sg)}\nTotal Trabalhado: ${fmt(tot)}\nAlmoço: ${fmt(lunch)}\nJornada Contratada: ${fmt(r.J)}\n\nSaldo Banco de Horas: ${sgn(saldo)}\n\nHorário máximo permitido para saída: ${clk(maxS)}`;
    if(r.vE>0)add('info','Valor estimado se as horas extras forem pagas. Horas compensadas com folga no banco de horas não geram pagamento.');
    if(r.tolOn)add('info','Tolerância de ponto aplicada: variação de até 10 minutos não conta (art. 58 CLT).');
    if(saldo>B){add('bad','Excedeu o limite diário de banco de horas em '+fmt(saldo-B)+'.');text+='\n\nAtenção: excedeu o limite diário de banco de horas.'}
    else if(saldo<0)add('warn','Jornada incompleta: faltam '+fmt(-saldo)+'.');
    else add('ok','Dentro do limite do banco de horas.');
  }
  r.text=text;last=last||{};last.text=text;
  return{html,M};
}
function setStatus(k,t){if(restWarning){k='bad';t=restWarning;}$('status').className=t?'s-'+k:'';$('status').textContent=t||''}
function calc(){
  const r=calcDay(cur);F.forEach(i=>$(i).classList.remove('err'));
  const b=build(r);drawRest(r,b);b.M.sort((x,y)=>SEV[x.k]-SEV[y.k]);
  $('out').innerHTML=b.html;
  const f=b.M[0];setStatus(f?f.k:'',f?f.t:'');
  $('notes').innerHTML=b.M.slice(1).map(m=>'<li>• '+esc(m.t)+'</li>').join('');
  drawAcc();drawHist();drawHv();updateEntryGate();drawQuickPunch();live();
}
function nowAbs(){const d=new Date();let n=d.getHours()*60+d.getMinutes()+d.getSeconds()/60;if(last&&last.e!=null&&n<last.e)n+=1440;return n}
function live(){
  if(last&&last.continuous){liveContinuous();return}
  const el=$('live'),rg=$('ring'),ri=$('ringIn');
  if(!el||!rg||!ri||!last||cur!==ymd(new Date()))return;
  const r=calcDay(cur),n=nowAbs(),C=DB.cfg,B=C.B;
  if(n<r.v){el.innerHTML='';return}
  const w=(r.s-r.e)+(n-r.v),rest=r.J-w;
  if(rest>0){
    rg.className='ring';rg.style.setProperty('--p',Math.min(w/(r.J||1)*100,100));rg.style.setProperty('--rc','var(--brand)');
    ri.innerHTML=`<small>Sair às</small><b class="num">${clk(last.cumprir)}</b><small>faltam ${fmtS(rest,1)}</small>`;
    el.innerHTML=`<p class="live">Faltam ${fmt(rest)} para cumprir a jornada.</p>`;return;
  }
  const banco=-rest,left=B-banco,lvl=banco>=B?3:banco>=C.a2?2:banco>=C.a1?1:0;
  const col=lvl===0?'var(--ok)':lvl===1?'var(--warn)':'var(--bad)';
  const sub=['limite em '+fmtS(left,1),'atenção · limite em '+fmtS(left,1),'BATA O PONTO · '+fmtS(left,1),'REGISTRE A SAÍDA REAL'][lvl];
  const msg=['Jornada cumprida. Cada minuto a mais entra no banco de horas.','Banco em '+fmt(banco)+'. Prepare-se para bater o ponto.','Bata o ponto agora: faltam '+fmtS(left,1)+' para o limite do banco.','Limite do banco atingido. Registre a saída real e comunique o gestor.'][lvl];
  rg.className='ring'+(lvl===2?' blink':lvl===3?' blink fast':'');
  rg.style.setProperty('--p',B?Math.min(banco/B*100,100):100);rg.style.setProperty('--rc',col);
  ri.innerHTML=`<small>Banco de horas</small><b class="num s">+${fmtS(banco)}</b><small>${sub}</small>`;
  el.innerHTML=`<p class="live">${msg}</p>`;
  if(lvl===1)setStatus('warn',msg);
  else if(lvl===2)setStatus('bad',msg);
  else if(lvl===3)setStatus('bad','Limite do banco atingido. Registre a saída real e comunique o gestor.');
}


/* ===== Jornada contínua: duas batidas e limite consecutivo de 6h ===== */
function buildContinuous(r){
  const M=[],add=(k,t)=>M.push({k,t});
  if(r.cross)add('info','Jornada atravessa a meia-noite: a saída conta no dia seguinte.');
  add('info','O limite de 6h consecutivas não altera a jornada contratada. O saldo é comparado à configuração em Ajustes.');
  if(r.e==null){if(r.f!=null)add('warn','Informe a entrada para calcular a jornada contínua.');return{html:'<p class="empty">Informe a entrada. A saída final encerra a jornada.</p>',M}}
  const limit=r.e+360;
  if(r.f==null){
    last={continuous:true,e:r.e,maxS:limit,cumprir:r.e+r.J};
    last.text='Jornada contínua — '+br(cur)+'\nEntrada: '+clk(r.e)+'\nLimite de 6h: '+clk(limit)+'\nJornada configurada: '+fmt(r.J);
    return{html:`<div class="ring" id="ring"><div id="ringIn"><small>Limite de 6h</small><b class="num">${clk(limit)}</b><small>${limit>=1440?'saída no dia seguinte':'saída até este horário'}</small></div></div><div class="kpis"><div><small>Entrada</small><b class="num">${clk(r.e)}</b></div><div><small>Máx. consecutivo</small><b class="num">06:00</b></div><div><small>Jornada contratada</small><b class="num">${fmt(r.J)}</b></div></div><div id="live"></div>`,M};
  }
  const excess=Math.max(r.worked-360,0);
  add(excess?'bad':'ok',excess?'Excedeu o limite de 6h consecutivas em '+fmt(excess)+'. Registre a saída real e avise o gestor.':'Jornada contínua encerrada dentro do limite de 6h.');
  if(r.saldo<0)add('warn','Saldo negativo de '+fmt(-r.saldo)+' em relação à jornada configurada.');
  if(r.tolOn)add('info','Tolerância configurada aplicada ao saldo do dia.');
  last={text:`Jornada contínua — ${br(cur)}\nEntrada: ${clk(r.e)}\nSaída final: ${clk(r.f)}\nTotal trabalhado: ${fmt(r.worked)}\nLimite consecutivo: 06:00\nExcesso consecutivo: ${fmt(excess)}\nJornada configurada: ${fmt(r.J)}\nSaldo do banco: ${sgn(r.saldo)}`};
  return{html:`<div class="ring" style="--p:${Math.min(r.worked/360*100,100)};--rc:${excess?'var(--bad)':'var(--ok)'}"><div><small>Total consecutivo</small><b class="num ${excess?'neg':'pos'}">${fmt(r.worked)}</b><small>limite de 06:00</small></div></div><dl><div><dt>Entrada</dt><dd>${clk(r.e)}</dd></div><div><dt>Saída final</dt><dd>${clk(r.f)}${r.cross?' (+1 dia)':''}</dd></div><div><dt>Limite de saída</dt><dd>${clk(limit)}</dd></div><div><dt>Excesso consecutivo</dt><dd class="${excess?'neg':''}">${fmt(excess)}</dd></div><div><dt>Jornada contratada</dt><dd>${fmt(r.J)}</dd></div><div><dt>Saldo do banco</dt><dd class="${r.saldo<0?'neg':'pos'}">${sgn(r.saldo)}</dd></div>${r.night?`<div><dt>Noturno (22h às 5h)</dt><dd>${fmt(r.night)}${r.vN!=null?' · '+brl(r.vN):''}</dd></div>`:''}${r.vE>0?`<div><dt>Extras estimadas se pagas</dt><dd>${brl(r.vE)}</dd></div>`:''}</dl>`,M};
}
function liveContinuous(){
  if(cur!==ymd(new Date()))return;
  const el=$('live'),rg=$('ring'),ri=$('ringIn');if(!el||!rg||!ri)return;
  const now=new Date(),n=now.getHours()*60+now.getMinutes()+now.getSeconds()/60,worked=n-last.e;if(worked<0){el.innerHTML='<p class="live">Aguardando o horário de entrada registrado.</p>';return;}
  const left=360-worked,near=left<=DB.cfg.A;
  rg.style.setProperty('--p',Math.min(worked/360*100,100));rg.style.setProperty('--rc',left<=0?'var(--bad)':near?'var(--warn)':'var(--brand)');
  ri.innerHTML=`<small>${left<0?'Limite excedido':'Saída até '+clk(last.maxS)}</small><b class="num s">${fmtS(worked)}</b><small>${left<0?'excesso de '+fmtS(-left):left===0?'6h atingidas': 'faltam '+fmtS(left,1)}</small>`;
  el.innerHTML=`<p class="live">${left<=0?'Limite de 6h atingido. Registre a saída real e comunique o gestor.':'Tempo consecutivo trabalhado. Saldo atual: '+sgn(worked-calcDay(cur).J)+'.'}</p>`;
  if(near)setStatus(left<=0?'bad':'warn',left<=0?'Limite de 6h consecutivas atingido. Registre a saída real.':'Prepare-se para sair até '+clk(last.maxS)+': faltam '+fmtS(left,1)+'.');
}
function scheduleContinuous(){
  if(!notifyOn||cur!==ymd(new Date())||$('fin').value)return;
  const now=new Date(),n=now.getHours()*60+now.getMinutes()+now.getSeconds()/60,fr=DB.fired[cur]=DB.fired[cur]||{};if(n<last.e)return;
  const events=[['contBefore',last.maxS-DB.cfg.A,'Limite de 6h se aproxima','Prepare-se para sair até '+clk(last.maxS)+'.','warn'],['contLimit',last.maxS,'Limite de 6h atingido','Registre a saída real e comunique o gestor.','bad']];
  // Ao ativar tarde, emitir somente o aviso mais urgente vigente.
  for(const [key,t,title,msg,k] of events){if(fr[key]||n<t)continue;fr[key]=1;save();if(key==='contBefore'&&n>=last.maxS)continue;notify(title,msg,k)}
}

/* ===== Alertas ===== */
function beep(n){try{const c=new (window.AudioContext||window.webkitAudioContext)();for(let i=0;i<n;i++){const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.value=.15;o.start(c.currentTime+i*.35);o.stop(c.currentTime+i*.35+.2)}}catch(e){}}
function toast(msg,k){const d=document.createElement('div');d.className='s-'+k;d.innerHTML='<span></span><button aria-label="Fechar">×</button>';d.firstChild.textContent=msg;d.lastChild.onclick=()=>d.remove();$('toasts').appendChild(d);setTimeout(()=>d.remove(),k==='bad'?60000:20000)}
function notify(t,msg,k){toast(msg,k);beep(k==='bad'?5:3);if('Notification' in window&&Notification.permission==='granted'){try{if('serviceWorker' in navigator)navigator.serviceWorker.ready.then(reg=>reg.showNotification(t,{body:msg,icon:'assets/icons/icon-192.png'})).catch(()=>{});else new Notification(t,{body:msg});}catch(e){}}}
function schedule(){
  if(last&&last.continuous){scheduleContinuous();return}
  if(!notifyOn||!last||!last.maxS||$('fin').value||cur!==ymd(new Date()))return;
  const n=nowAbs(),A=DB.cfg.A,fr=DB.fired[cur]=DB.fired[cur]||{};
  if(n<calcDay(cur).v)return;
  const C=DB.cfg,c0=last.cumprir;
  [['p1',c0-A,'Saída em breve','Faltam '+A+' min para cumprir a jornada ('+clk(c0)+').','warn'],
   ['a1',c0,'Jornada cumprida','O banco de horas começou a subir.','ok'],
   ['b1',c0+C.a1,'Banco em '+fmt(C.a1),'Faltam '+fmt(C.B-C.a1)+' para o limite. Prepare-se para bater o ponto.','warn'],
   ['b2',c0+C.a2,'Banco em '+fmt(C.a2)+': bata o ponto!','Faltam '+fmt(C.B-C.a2)+' para o limite do banco ('+clk(last.maxS)+'). Bata o ponto agora.','bad'],
   ['b3',last.maxS,'Limite ultrapassado','Registre a saída real e comunique o gestor.','bad']
  ].forEach(([key,t,ti,msg,k])=>{if(fr[key]||n<t)return;fr[key]=1;save();if(n<t+2)notify(ti,msg,k)});
}

/* ===== Exportações ===== */
function dl(n,t,c){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([c],{type:t}));a.href=url;a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
function ics(){
  if(!last||!last.maxS){toast('Preencha a entrada e, no modo com intervalo, a saída e volta do almoço. Deixe a saída final em aberto.','warn');return}
  const base=cur.replace(/-/g,''),A=DB.cfg.A;
  const dt=m=>{const d=m>=1440?addD(cur,1).replace(/-/g,''):base,x=m%1440;return d+'T'+pad(Math.floor(x/60))+pad(x%60)+'00'};
  const ev=(id,m,n,tg)=>['BEGIN:VEVENT','UID:'+base+'-'+id+'@jornada','DTSTAMP:'+base+'T000000','DTSTART:'+dt(m),'DTEND:'+dt(m+15),'SUMMARY:'+n,'BEGIN:VALARM','TRIGGER:-PT'+tg+'M','ACTION:DISPLAY','DESCRIPTION:'+n,'END:VALARM','END:VEVENT'];
  dl('lembretes-jornada.ics','text/calendar',['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Jornada//PT-BR',...(last.continuous?[...ev('continua',last.maxS,'Limite de 6h consecutivas: registre a saída real',A)]:[...ev('cumprir',last.cumprir,'Jornada cumprida: o banco começa a subir',A),...ev('b1',last.cumprir+DB.cfg.a1,'Banco em '+fmt(DB.cfg.a1)+': prepare-se para bater o ponto',0),...ev('b2',last.cumprir+DB.cfg.a2,'Banco em '+fmt(DB.cfg.a2)+': bata o ponto agora',0),...ev('limite',last.maxS,'Limite do banco atingido: registre a saída real e avise o gestor',0)]),'END:VCALENDAR'].join('\r\n'));
  toast('Abra o arquivo baixado para adicionar ao calendário.','ok');
}
function csv(){
  const ym=cur.slice(0,7),rows=[['Data','Tipo','Formato','Entrada','Saida almoco','Volta almoco','Saida final','Trabalhado','Jornada','Saldo','Extras R$','Noturno R$','Descanso entre jornadas','Falta para 11h','Proxima entrada minima','Justificativa']];
  Object.keys(DB.days).sort().filter(k=>k.startsWith(ym)).forEach(k=>{const r=calcDay(k),d=r.d,rest=restInfo(k);rows.push([br(k),TIPOS[r.tipo],r.continuous?'Contínua (2 batidas)':'Com intervalo',d.ent||'',r.continuous?'':d.sal||'',r.continuous?'':d.vol||'',d.fin||'',r.worked==null?'':fmt(r.worked),fmt(r.J),r.saldo==null?'':sgn(r.saldo),r.vE?r.vE.toFixed(2).replace('.',','):'',r.vN?r.vN.toFixed(2).replace('.',','):'',rest.minutes==null?'':fmt(rest.minutes),rest.missing==null?'':fmt(rest.missing),rest.nextEarliest?stampLabel(rest.nextEarliest):'',(d.just||'').replace(/[;\r\n]/g,' ')])});
  if(rows.length<2){toast('Nenhum dia registrado neste mês.','warn');return}
  dl('espelho-'+ym+'.csv','text/csv;charset=utf-8','\ufeff'+rows.map(x=>x.join(';')).join('\r\n'));
}

/* ===== Teclado numérico de horas ===== */
let tgt=null,dg='';
const sheet=$('sheet'),shD=$('shD'),shOk=$('shOk');
function drawSheet(){shD.textContent=dg.slice(0,2).padEnd(2,'-')+':'+dg.slice(2,4).padEnd(2,'-');shOk.disabled=!(dg.length===4||dg.length===0)}
function shake(){shD.classList.remove('shake');void shD.offsetWidth;shD.classList.add('shake')}
function openSheet(id){if(id==='ent'&&entryGate().locked){entryAllowed('00:00');return;}tgt=id;dg=($(id).value||'').replace(':','');$('shNow').hidden=!F.includes(id);$('shT').textContent=(document.querySelector('label[for="'+id+'"]')||{}).textContent||'Horário';history.pushState({sheet:true},'',location.href);sheet.hidden=false;document.body.classList.add('sheet-open');drawSheet();$('shCancel').focus({preventScroll:true})}
function closeSheet(goBack=true){sheet.hidden=true;if(goBack&&history.state&&history.state.sheet)history.back();document.body.classList.remove('sheet-open');if(tgt)$(tgt).focus({preventScroll:true});tgt=null}
function press(d){
  if(dg.length>=4)return;
  if(dg.length===0&&d>2)dg='0'+d;
  else if(dg.length===1&&dg[0]==='2'&&d>3)return shake();
  else if(dg.length===2&&d>5)return shake();
  else dg+=d;
  drawSheet();
}
function confirmSheet(){
  if(!tgt||!(dg.length===4||dg.length===0))return;
  const id=tgt,el=$(id),value=dg.length?dg.slice(0,2)+':'+dg.slice(2):'';
  if(id==='ent'&&!entryAllowed(value)){shake();return;}
  el.value=value;
  el.dispatchEvent(new Event('input',{bubbles:true}));closeSheet();
}
['1','2','3','4','5','6','7','8','9','Limpar','0','⌫'].forEach(k=>{
  const b=document.createElement('button');b.type='button';b.textContent=k;if(k==='Limpar'||k==='⌫')b.className='sm';
  b.onclick=()=>{if(k==='Limpar'){dg='';drawSheet()}else if(k==='⌫'){dg=dg.slice(0,-1);drawSheet()}else press(k)};$('keys').appendChild(b);
});
$('shNow').onclick=()=>{const d=new Date();dg=pad(d.getHours())+pad(d.getMinutes());drawSheet();confirmSheet()};
$('shCancel').onclick=closeSheet;$('shBack').onclick=closeSheet;shOk.onclick=confirmSheet;
document.querySelectorAll('.tf').forEach(el=>{el.addEventListener('click',()=>openSheet(el.id));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openSheet(el.id)}})});
document.addEventListener('keydown',e=>{
  if(sheet.hidden)return;
  if(e.key==='Tab'){const buttons=Array.from(sheet.querySelectorAll('button:not(:disabled)'));const first=buttons[0],end=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}return;}
  if(/^[0-9]$/.test(e.key)){e.preventDefault();press(e.key)}
  else if(e.key==='Backspace'){e.preventDefault();dg=dg.slice(0,-1);drawSheet()}
  else if(e.key==='Enter'&&document.activeElement.tagName!=='BUTTON')confirmSheet();
  else if(e.key==='Escape'){e.preventDefault();closeSheet();}
});

/* ===== Abas ===== */
function showTab(t,writeHistory=true){if(!['hoje','mes','cfg'].includes(t))t='hoje';if(writeHistory&&location.hash!=='#'+t)history.pushState({tab:t},'', '#'+t);document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!=='v-'+t);document.querySelectorAll('.tabs button').forEach(b=>{const on=b.dataset.tab===t;b.classList.toggle('on',on);b.setAttribute('aria-current',on?'page':'false')});window.scrollTo(0,0);if(t==='mes')$('monthPicker').value=cur.slice(0,7);}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
$('hdate').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});

/* ===== Eventos ===== */
function setDay(d){cur=d;fillForm();calc()}
const onForm=()=>{const stored=(DB.days[cur]||{}).ent||'';if($('ent').value!==stored&&!entryAllowed($('ent').value)){$('ent').value=stored;updateEntryGate();return;}readForm();syncMode();save();calc()},onCfg=()=>{readCfg();save();calc()};
[...F,'tipo','modo','just'].forEach(i=>{$(i).addEventListener('input',onForm);$(i).addEventListener('change',onForm)});
[...Array(7).keys()].map(i=>'wk'+i).concat(['cb','ca','a1','a2','tol','prz','ini','iniS','salr','dvs','p50','p100','pn','hide']).forEach(i=>{$(i).addEventListener('input',onCfg);$(i).addEventListener('change',onCfg)});
document.querySelectorAll('[data-now]').forEach(b=>b.onclick=()=>{if(cur!==ymd(new Date()))return;const d=new Date(),el=$(b.dataset.now),value=pad(d.getHours())+':'+pad(d.getMinutes());if(b.dataset.now==='ent'&&!entryAllowed(value))return;if(el.value&&!confirm('Substituir '+el.value+' pelo horário atual?'))return;el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))});
$('pv').onclick=()=>setDay(addD(cur,-1));$('nx').onclick=()=>setDay(addD(cur,1));$('hj').onclick=()=>setDay(ymd(new Date()));
$('dt').addEventListener('change',()=>{if($('dt').value)setDay($('dt').value)});
$('hc').onclick=e=>{const t=e.target.closest('tr[data-d]');if(t){setDay(t.dataset.d);showTab('hoje')}};
$('hc').onkeydown=e=>{if(e.key==='Enter'){const t=e.target.closest('tr[data-d]');if(t){setDay(t.dataset.d);showTab('hoje')}}};
$('btnNotify').onclick=async()=>{
  notifyOn=true;beep(1);
  if('Notification' in window&&Notification.permission==='default'){try{await Notification.requestPermission()}catch(e){}}
  delete DB.fired[cur];save();$('btnNotify').textContent='Alertas ativados';$('btnNotify').classList.add('on');
  toast('Alertas ativados. Mantenha esta aba aberta ou use os lembretes no calendário.','ok');
};
$('btnCopy').onclick=async()=>{
  if(!last||!last.text){toast('Preencha os horários para copiar.','warn');return}
  try{await navigator.clipboard.writeText(last.text)}catch(e){const t=document.createElement('textarea');t.value=last.text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}
  toast('Resultado copiado.','ok');
};
$('btnClear').onclick=()=>{if(!confirm('Apagar as marcações de '+br(cur)+'? Esta ação não pode ser desfeita.'))return;delete DB.days[cur];delete DB.fired[cur];save();fillForm();calc()};
$('btnIcs').onclick=ics;$('btnCsv').onclick=csv;$('btnPdf').onclick=()=>window.print();
$('btnBkp').onclick=()=>dl('backup-jornada.json','application/json',JSON.stringify(DB));
$('btnRst').onclick=()=>$('fileRst').click();
$('fileRst').onchange=e=>{
  const f=e.target.files[0];if(!f)return;if(f.size>5*1024*1024){toast('O backup deve ter no máximo 5 MB.','bad');e.target.value='';return;}const rd=new FileReader();
  rd.onload=()=>{try{const d=JornadaStorage.validate(JSON.parse(rd.result));if(!confirm('Restaurar o backup? Os registros atuais serão substituídos. Faça um backup antes se quiser guardá-los.'))return;DB=d;const saved=save();fillCfg();fillForm();calc();if(saved)toast('Backup restaurado.','ok')}catch(x){toast('Arquivo de backup inválido.','bad')}};
  rd.onerror=()=>toast('Não foi possível ler este arquivo.','bad');rd.readAsText(f);e.target.value='';
};

load();fillCfg();fillForm();calc();showTab(location.hash.slice(1)||'hoje',false);
setInterval(()=>{const d=new Date();$('clock').textContent=pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());updateEntryGate();drawQuickPunch();live();schedule()},1000);

/* Navigation and the next punch are shared by web and installed app. */
function drawQuickPunch(){
  const button=$('quickPunch'),gate=entryGate();
  const flow=$('modo').value==='continua'?['ent','fin']:F;
  const next=flow.find(id=>!$(id).value);
  const labels={ent:'Registrar entrada',sal:'Sair para o almoço',vol:'Voltar do almoço',fin:'Registrar saída'};
  button.hidden=!gate.today||!gate.active||!next;
  button.disabled=next==='ent'&&gate.locked;
  button.dataset.next=next||'';button.textContent=labels[next]||'Jornada registrada';
  $('punchHint').hidden=button.hidden;
  $('punchHint').textContent=button.disabled?'Aguarde o descanso indicado abaixo.':'Toque para conferir e confirmar o horário atual.';
}
$('quickPunch').onclick=()=>{const id=$('quickPunch').dataset.next;if(!id)return;openSheet(id);if(tgt===id){const d=new Date();dg=pad(d.getHours())+pad(d.getMinutes());drawSheet();}};
$('monthPicker').onchange=()=>{const month=$('monthPicker').value;if(/^\d{4}-\d{2}$/.test(month))setDay(month+'-01');};
window.addEventListener('popstate',()=>{if(!sheet.hidden){closeSheet(false);return;}showTab(location.hash.slice(1)||'hoje',false);});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){$('hdate').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});calc();}});
