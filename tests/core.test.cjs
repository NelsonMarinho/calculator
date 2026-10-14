const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('calculador-jornada-v8.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const helpers=script.slice(script.indexOf('const pad='),script.indexOf('function fillForm()'));
const domain=script.slice(script.indexOf('const nm='),script.indexOf('/* ===== Banco acumulado'));
function context(){const values=new Map(),messages=[];const c=vm.createContext({localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)},toast:(...args)=>messages.push(args)});vm.runInContext(helpers+'\n'+domain,c);c.messages=messages;return c;}
function calc(day,cfg={}){const c=context();c.day=day;c.config=cfg;return vm.runInContext("DB.days={'2026-10-13':day};DB.cfg={...DEF,wk:[...DEF.wk],...config};calcDay('2026-10-13')",c);}
test('v8 calcula 8h trabalhadas e 40min de saldo',()=>{const r=calc({ent:'08:00',sal:'12:00',vol:'13:00',fin:'17:00'});assert.equal(r.worked,480);assert.equal(r.saldo,40);});
test('tolerância respeita a configuração da v8',()=>{const day={ent:'08:00',sal:'12:00',vol:'13:00',fin:'16:25'};assert.equal(calc(day).saldo,0);assert.equal(calc(day,{tol:0}).saldo,5);});
test('v8 usa quatro batidas mesmo quando backup antigo contém modo contínuo',()=>{const r=calc({modo:'continua',ent:'08:00',sal:'12:00',vol:'13:00',fin:'14:00'});assert.equal(r.worked,300);assert.equal(r.saldo,-140);});
test('virada de meia-noite soma períodos e minutos noturnos',()=>{const r=calc({ent:'22:00',sal:'02:00',vol:'03:00',fin:'07:00'});assert.equal(r.worked,480);assert.equal(r.night,360);assert.equal(r.cross,true);});
test('duas batidas não fecham uma jornada de quatro batidas',()=>{const r=calc({ent:'08:00',fin:'14:00'});assert.equal(r.worked,null);assert.equal(r.saldo,null);});
test('folga compensada debita a jornada e atestado mantém saldo',()=>{assert.equal(calc({tipo:'comp'}).saldo,-440);assert.equal(calc({tipo:'atm'}).saldo,0);});
test('feriado calcula todo trabalho como saldo positivo',()=>{const r=calc({tipo:'fer',ent:'08:00',sal:'12:00',vol:'13:00',fin:'17:00'});assert.equal(r.J,0);assert.equal(r.saldo,480);});
test('horários que excedem 20h entre primeira e última geram erro',()=>{assert.ok(calc({ent:'08:00',sal:'12:00',vol:'13:00',fin:'05:00'}).err);});
test('estimativa salarial da v8 usa o adicional configurado',()=>{const r=calc({ent:'08:00',sal:'12:00',vol:'13:00',fin:'17:00'},{sal:2200});assert.equal(r.vE,10);assert.equal(r.vN,0);});
test('contador em segundos da v8 evita perder um segundo inteiro',()=>{const c=context();assert.equal(vm.runInContext('fmtS(1)',c),'00:01:00');assert.equal(vm.runInContext('fmtS(1,true)',c),'00:01:00');});
test('chave jornada4 mantém os registros existentes',()=>{const c=context();vm.runInContext("localStorage.setItem('jornada4',JSON.stringify({cfg:DEF,days:{'2026-10-13':{ent:'08:00'}}}));load();",c);assert.equal(vm.runInContext("DB.days['2026-10-13'].ent",c),'08:00');});
test('backup parcial recebe valores padrão sem compartilhar a jornada',()=>{const c=context();assert.equal(vm.runInContext('const db=validateBackup({cfg:{},days:{}});db.cfg.wk[1]=1;DEF.wk[1]',c),440);});
test('backup inválido não substitui os dados atuais',()=>{const c=context();for(const bad of [null,{cfg:[],days:{}},{cfg:{},days:[]},{cfg:{wk:[0]},days:{}},{cfg:{div:0},days:{}},{cfg:{},days:{'2026-02-30':{}}},{cfg:{},days:{'2026-10-13':{ent:'25:00'}}},{cfg:{},days:{'2026-10-13':{tipo:'toString'}}}]){c.bad=bad;assert.throws(()=>vm.runInContext('validateBackup(bad)',c));}});
test('falha ao salvar retorna false e avisa o usuário',()=>{const c=context();c.localStorage.setItem=()=>{throw new Error('Quota');};assert.equal(vm.runInContext('save()',c),false);assert.match(c.messages[0][0],/Não foi possível salvar/);});
