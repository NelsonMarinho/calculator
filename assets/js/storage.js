/* Retains the original key so existing records on the same origin survive. */
const JornadaStorage=(()=>{
  const KEY='jornada4';
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  function validate(data){
    if(!object(data)||!object(data.cfg)||!object(data.days))throw new Error('Backup inválido');
    const cfg={...DEF,wk:[...DEF.wk]};
    if(data.cfg.wk!==undefined){
      if(!Array.isArray(data.cfg.wk)||data.cfg.wk.length!==7||data.cfg.wk.some(n=>!Number.isInteger(n)||n<0||n>1439))throw new Error('Jornada inválida');
      cfg.wk=[...data.cfg.wk];
    }
    const limits={B:[0,1439],A:[1,60],ini:[-1000000,1000000],a1:[0,1439],a2:[0,1439],sal:[0,100000000],div:[100,300],p50:[0,300],p100:[0,300],pn:[0,300]};
    Object.keys(limits).forEach(key=>{if(data.cfg[key]===undefined)return;const n=data.cfg[key],range=limits[key];if(typeof n!=='number'||!Number.isFinite(n)||n<range[0]||n>range[1])throw new Error('Ajuste inválido');cfg[key]=n;});
    ['tol','hide'].forEach(key=>{if(data.cfg[key]!==undefined){if(![0,1,true,false].includes(data.cfg[key]))throw new Error('Ajuste inválido');cfg[key]=data.cfg[key]?1:0;}});
    if(data.cfg.prz!==undefined){if(![6,12].includes(data.cfg.prz))throw new Error('Prazo inválido');cfg.prz=data.cfg.prz;}
    const days=Object.create(null);
    const keys=Object.keys(data.days);if(keys.length>40000)throw new Error('Backup muito grande');
    keys.forEach(date=>{
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||ymd(pd(date))!==date)throw new Error('Data inválida');
      const source=data.days[date];if(!object(source))throw new Error('Registro inválido');
      const day={};
      F.forEach(key=>{if(source[key]===undefined||source[key]==='')return;if(typeof source[key]!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(source[key]))throw new Error('Horário inválido');day[key]=source[key];});
      if(source.tipo!==undefined){if(!Object.prototype.hasOwnProperty.call(TIPOS,source.tipo))throw new Error('Tipo inválido');day.tipo=source.tipo;}
      if(source.modo!==undefined){if(!['intervalo','continua'].includes(source.modo))throw new Error('Modo inválido');day.modo=source.modo;}
      if(source.just!==undefined){if(typeof source.just!=='string'||source.just.length>120)throw new Error('Justificativa inválida');day.just=source.just;}
      days[date]=day;
    });
    return {cfg,days,fired:{}};
  }
  function load(){const raw=localStorage.getItem(KEY);if(!raw)return null;const source=JSON.parse(raw),db=validate(source);if(object(source.fired))db.fired=source.fired;return db;}
  function save(db){localStorage.setItem(KEY,JSON.stringify(db));}
  return {load,save,validate};
})();
