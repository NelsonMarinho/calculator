const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('calculador-jornada-v8.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const header=source.slice(source.indexOf('const pad='),source.indexOf('function fillForm()'));
const sound=source.slice(source.indexOf('let alertAudio='),source.indexOf('function toast('));
const notify=source.slice(source.indexOf('async function notify('),source.indexOf('function schedule('));
function context(permission='granted'){
 const state={contexts:[],notes:[],notifications:[],messages:[],values:new Map()};
 class Audio{
  constructor(){this.state='suspended';this.currentTime=10;this.destination={};this.resumes=0;state.contexts.push(this);}
  async resume(){this.state='running';this.resumes++;}
  createOscillator(){const note={};state.notes.push(note);return{frequency:{setValueAtTime:(value,time)=>{note.frequency=value;note.time=time;}},connect(){},disconnect(){},start(time){note.start=time;},stop(time){note.stop=time;}};}
  createGain(){return{gain:{setValueAtTime(){},linearRampToValueAtTime(value,time){if(value>0)state.notes[state.notes.length-1].volume=value;}},connect(){},disconnect(){}};}
 }
 class Notification{static permission=permission;constructor(title,options){state.notifications.push({title,options});}}
 const registration={showNotification:async(title,options)=>{state.notifications.push({title,options});}};
 const c=vm.createContext({window:{AudioContext:Audio,Notification},Notification,navigator:{serviceWorker:{controller:{},ready:Promise.resolve(registration)}},localStorage:{getItem:key=>state.values.get(key)||null,setItem:(key,value)=>state.values.set(key,value)},toast:(...message)=>state.messages.push(message)});
 vm.runInContext(header+'\n'+sound+'\n'+notify,c);
 return{c,state};
}
test('toque do app usa uma melodia e reutiliza o contexto desbloqueado',async()=>{const {c,state}=context();assert.equal(await vm.runInContext('beep(1)',c),true);await vm.runInContext('beep(1)',c);assert.equal(state.contexts.length,1);assert.equal(state.contexts[0].resumes,1);assert.equal(state.notes.length,8);assert.ok(new Set(state.notes.map(note=>note.frequency)).size>1);});
test('alerta urgente repete o toque três vezes e respeita o volume',async()=>{const {c,state}=context();await vm.runInContext('DB.cfg.soundVolume=.4;beep(5)',c);assert.equal(state.notes.length,12);assert.ok(state.notes.every(note=>note.volume===.1));assert.ok(state.notes.at(-1).stop-state.notes[0].start>2);});
test('modo som do celular evita melodia duplicada e usa notificações',async()=>{const {c,state}=context();const result=await vm.runInContext("DB.cfg.soundMode='system';notify('Limite','Aviso','bad')",c);assert.equal(result.tone,false);assert.equal(result.notification,true);assert.equal(state.contexts.length,0);const options=state.notifications[0].options;assert.equal(options.silent,undefined);assert.equal(options.renotify,true);assert.ok(options.tag);assert.deepEqual(Array.from(options.vibrate),[200,100,200]);});
test('modo app silencia o som da notificação para não tocar duas vezes',async()=>{const {c,state}=context();await vm.runInContext("notify('Jornada','Aviso','warn')",c);assert.equal(state.notes.length,8);assert.equal(state.notifications[0].options.silent,true);assert.equal(state.notifications[0].options.vibrate,undefined);});
test('sem som mantém apenas o aviso visual e a notificação silenciosa',async()=>{const {c,state}=context();await vm.runInContext("DB.cfg.soundMode='silent';notify('Jornada','Aviso','warn')",c);assert.equal(state.contexts.length,0);assert.equal(state.messages.length,1);assert.equal(state.notifications[0].options.silent,true);});
test('permissão negada não emite som do app como substituição',async()=>{const {c,state}=context('denied');const result=await vm.runInContext("DB.cfg.soundMode='system';notify('Jornada','Aviso','warn')",c);assert.equal(result.notification,false);assert.equal(state.notes.length,0);assert.equal(state.messages.length,1);});
test('preferências de toque sobrevivem ao backup e à leitura local',()=>{const {c}=context();vm.runInContext("DB.cfg.soundMode='system';DB.cfg.soundVolume=.35;save();DB.cfg.soundMode='silent';load();",c);assert.equal(vm.runInContext('soundSettings().mode',c),'system');assert.equal(vm.runInContext('soundSettings().volume',c),.35);assert.equal(vm.runInContext("validateBackup({cfg:{soundMode:'app',soundVolume:.8},days:{}}).cfg.soundVolume",c),.8);assert.throws(()=>vm.runInContext("validateBackup({cfg:{soundMode:'invalid'},days:{}})",c));assert.throws(()=>vm.runInContext('validateBackup({cfg:{soundVolume:2},days:{}})',c));});
test('áudio suspenso é retomado antes do próximo toque',async()=>{const {c,state}=context();await vm.runInContext('beep(1)',c);state.contexts[0].state='suspended';await vm.runInContext('beep(1)',c);assert.equal(state.contexts.length,1);assert.equal(state.contexts[0].resumes,2);});
