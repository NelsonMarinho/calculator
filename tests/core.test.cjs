const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=fs.readFileSync('assets/js/core.js','utf8');
const storage=fs.readFileSync('assets/js/storage.js','utf8');
function context(){const values=new Map();const c=vm.createContext({localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)}});vm.runInContext(core+'\n'+storage,c);return c;}
function calc(day,cfg={}){const c=context();c.day=day;c.config=cfg;return vm.runInContext("calculateDay('2026-10-13',{'2026-10-13':day},{...DEF,...config})",c);}
test('jornada completa calcula 8h trabalhadas e 40min de saldo',()=>{const r=calc({ent:'08:00',sal:'12:00',vol:'13:00',fin:'17:00'});assert.equal(r.worked,480);assert.equal(r.saldo,40);});
test('tolerância mantém saldo zero em diferença de até dez minutos',()=>{assert.equal(calc({ent:'08:00',sal:'12:00',vol:'13:00',fin:'16:25'}).saldo,0);assert.equal(calc({ent:'08:00',sal:'12:00',vol:'13:00',fin:'16:25'},{tol:0}).saldo,5);});
test('jornada contínua ignora marcações antigas de almoço',()=>{const r=calc({modo:'continua',ent:'08:00',sal:'12:00',vol:'13:00',fin:'14:00'});assert.equal(r.worked,360);assert.equal(r.saldo,-80);});
test('virada da meia-noite soma os minutos noturnos',()=>{const r=calc({modo:'continua',ent:'22:00',fin:'04:00'});assert.equal(r.worked,360);assert.equal(r.night,360);assert.equal(r.cross,true);});
test('dia incompleto não fecha saldo',()=>{const r=calc({ent:'08:00',sal:'12:00'});assert.equal(r.worked,null);assert.equal(r.saldo,null);});
test('folga compensada debita jornada e atestado mantém saldo',()=>{assert.equal(calc({tipo:'comp'}).saldo,-440);assert.equal(calc({tipo:'atm'}).saldo,0);});
test('feriado não tem jornada contratada',()=>{const r=calc({tipo:'fer',modo:'continua',ent:'08:00',fin:'12:00'});assert.equal(r.J,0);assert.equal(r.saldo,240);});
test('jornada excessivamente longa retorna erro',()=>{assert.ok(calc({modo:'continua',ent:'08:00',fin:'05:00'}).err);});
test('estimativa salarial mantém valores numéricos',()=>{const r=calc({ent:'08:00',sal:'12:00',vol:'13:00',fin:'17:00'},{sal:2200});assert.equal(r.vE,10);assert.equal(r.vN,0);});
test('refatoração preserva os resultados do HTML original',()=>{
 const original=fs.readFileSync('calculador-jornada-v7.4.html','utf8');
 const js=original.match(/<script>([\s\S]*?)<\/script>/)[1];
 const legacy=vm.createContext({});
 vm.runInContext(js.slice(js.indexOf('const pad='),js.indexOf('function load()'))+js.slice(js.indexOf('const nm='),js.indexOf('/* ===== Intervalo entre jornadas')),legacy);
 const fresh=context();
 for(const date of ['2026-10-11','2026-10-12','2026-10-13'])for(const modo of ['intervalo','continua'])for(const tipo of ['trab','fer','comp','atm'])for(const ent of ['08:00','22:00']){
  const days={[date]:{modo,tipo,ent,sal:ent==='08:00'?'12:00':'02:00',vol:ent==='08:00'?'13:00':'03:00',fin:ent==='08:00'?'17:00':'07:00'}};
  legacy.days=days;fresh.days=days;legacy.date=date;fresh.date=date;
  vm.runInContext('DB.days=days;DB.cfg.sal=2200;',legacy);
  const old=JSON.stringify(vm.runInContext('calcDay(date)',legacy));
  const current=JSON.stringify(vm.runInContext('calculateDay(date,days,{...DEF,sal:2200})',fresh));
  assert.equal(current,old);
 }
});
test('backup antigo é lido pela mesma chave e sem alterar o original',()=>{const c=context();vm.runInContext("localStorage.setItem('jornada4',JSON.stringify({cfg:DEF,days:{'2026-10-13':{ent:'08:00'}}}));",c);assert.equal(vm.runInContext("JornadaStorage.load().days['2026-10-13'].ent",c),'08:00');});
test('backup parcial recebe os valores padrão',()=>{const c=context();assert.equal(vm.runInContext('JornadaStorage.validate({cfg:{},days:{}}).cfg.div',c),220);});
test('backup rejeita horários, datas e configurações inválidas',()=>{const c=context();for(const bad of [null,{cfg:{},days:[]},{cfg:{wk:[0]},days:{}},{cfg:{sal:-1},days:{}},{cfg:{div:0},days:{}},{cfg:{},days:{'2026-02-30':{}}},{cfg:{},days:{'2026-10-13':{ent:'25:00'}}},{cfg:{},days:{'2026-10-13':{tipo:'toString'}}},{cfg:{},days:{'2026-10-13':{just:'x'.repeat(121)}}}]){c.bad=bad;assert.throws(()=>vm.runInContext('JornadaStorage.validate(bad)',c));}});
test('falha no armazenamento não é silenciada',()=>{const c=context();c.localStorage.setItem=()=>{throw new Error('Quota');};assert.throws(()=>vm.runInContext('JornadaStorage.save({cfg:DEF,days:{},fired:{}})',c),/Quota/);});
test('restaurar backup não altera os padrões da aplicação',()=>{const c=context();assert.equal(vm.runInContext('const db=JornadaStorage.validate({cfg:{},days:{}});db.cfg.wk[1]=1;DEF.wk[1]',c),440);});
