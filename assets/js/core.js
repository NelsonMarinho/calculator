// Shared time helpers and pure journey calculations.
const pad=n=>String(n).padStart(2,'0');
const toMin=v=>{if(!v)return null;const[h,m]=v.split(':').map(Number);return h*60+m};
const fmt=m=>{const s=m<0?'-':'';m=Math.abs(Math.round(m));return s+pad(Math.floor(m/60))+':'+pad(m%60)};
const clk=m=>fmt(((m%1440)+1440)%1440);
const sgn=m=>(m>=0?'+':'-')+fmt(Math.abs(m));
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const pd=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const addD=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return ymd(d)};
const br=s=>s.split('-').reverse().join('/');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const parseBR=t=>{t=String(t||'').replace(/[^\d.,]/g,'');if(!t)return 0;if(t.includes(','))t=t.replace(/\./g,'').replace(',','.');else if(!/^\d+\.\d{1,2}$/.test(t))t=t.replace(/\./g,'');const v=parseFloat(t);return isNaN(v)?0:v};
const fmtS=(m,c)=>{const t=Math[c?'ceil':'floor'](Math.abs(m)*60-1e-6);return (m<0?'-':'')+pad(Math.floor(t/3600))+':'+pad(Math.floor(t%3600/60))+':'+pad(t%60)};
const TIPOS={trab:'Trabalho',fer:'Feriado / folga',comp:'Folga compensada',atm:'Atestado'};
const DOW=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const F=['ent','sal','vol','fin'];
const DEF={wk:[0,440,440,440,440,440,0],B:119,A:10,tol:1,prz:6,ini:0,a1:110,a2:115,sal:0,div:220,p50:50,p100:100,pn:20,hide:0};
const nm=(x,y)=>{let t=0;for(let k=0;k<3;k++){t+=Math.max(0,Math.min(y,k*1440+300)-Math.max(x,k*1440));t+=Math.max(0,Math.min(y,k*1440+1440)-Math.max(x,k*1440+1320))}return t};
function calculateDay(date,days,cfg){
  const d=days[date]||{},tipo=d.tipo||'trab',Jw=cfg.wk[pd(date).getDay()];
  const J=(tipo==='fer'||tipo==='atm')?0:Jw,r={date,d,tipo,J,Jw,saldo:null,worked:null,night:0,cross:false,err:null};
  if(tipo==='comp'){r.saldo=-Jw;r.worked=0;return r}
  if(tipo==='atm'){r.saldo=0;r.worked=0;return r}
  let prev=-1;const a={};
  F.forEach(k=>{if(d.modo==='continua'&&(k==='sal'||k==='vol'))return;let x=toMin(d[k]);if(x===null)return;while(x<=prev){x+=1440;r.cross=true}a[k]=x;prev=x});
  r.e=a.ent;r.s=a.sal;r.v=a.vol;r.f=a.fin;
  const vs=Object.values(a);
  if(vs.length&&Math.max(...vs)-Math.min(...vs)>=1200){r.err='As marcações somam mais de 20 horas entre a primeira e a última. Confira os horários.';return r}
  if(r.e!=null&&r.s!=null)r.night+=nm(r.e,r.s);
  if(r.v!=null&&r.f!=null)r.night+=nm(r.v,r.f);
  r.continuous=d.modo==='continua';
  if(r.continuous&&r.e!=null&&r.f!=null)r.night=nm(r.e,r.f);
  if(r.continuous?r.e!=null&&r.f!=null:vs.length===4){
    r.p=r.continuous?r.f-r.e:r.s-r.e;r.sg=r.continuous?0:r.f-r.v;r.worked=r.p+r.sg;let sd=r.worked-J;
    if(cfg.tol&&tipo==='trab'&&J>0&&sd&&Math.abs(sd)<=10){sd=0;r.tolOn=1}
    r.saldo=sd;
    if(cfg.sal){const h=(cfg.sal/(cfg.div||220)),dom=tipo==='fer'||pd(date).getDay()===0;r.pc=dom?cfg.p100:cfg.p50;r.vE=Math.max(sd,0)/60*h*(1+r.pc/100);r.vN=h*(r.night/420+cfg.pn/100*r.night/52.5)}
  }
  return r;
}
