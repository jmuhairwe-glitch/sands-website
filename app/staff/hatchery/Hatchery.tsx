'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { feedingClient } from '../../../lib/feeding-client';
import { kampalaToday } from '../../../lib/feeding';

const tanks = ['T1','T2','T3','T4','T5','T6'];
const labels = {setup:'Breeder stock / method',check:'Breeder check','jar-am':'Morning jar check','jar-pm':'Evening jar check',hatch:'Hatch completed',transfer:'Nursery transfer'};
type Kind = keyof typeof labels;
type Entry = { id:string; tank:string; day:string; kind:Kind; method:string|null; females:number|null; males:number|null; eggs:number|null; fry:number|null; temp:number|null; flow:string|null; batch:string; space:string; notes:string };
const methods:Record<string,string> = {A:'A · Incubate eggs',B:'B · Natural hatch',empty:'Empty tank'};
function plus(day:string,n:number){return new Date(Date.parse(day+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);}
function describe(e:Entry){
  if(e.kind==='setup') return methods[e.method || '']+' · '+e.females+' females, '+e.males+' males';
  if(e.kind.startsWith('jar')) return e.temp+' °C · flow '+e.flow;
  if(e.kind==='check') return (e.eggs??0)+' eggs · '+(e.fry??0)+' fry collected';
  return (e.fry??0)+' fry';
}
export default function Hatchery(){
 const [db]=useState(feedingClient), [rows,setRows]=useState<Entry[]>([]),[role,setRole]=useState(''),[msg,setMsg]=useState(''),[error,setError]=useState(''),[kind,setKind]=useState<Kind>('setup'),[method,setMethod]=useState('A'),[tank,setTank]=useState('T1'),[period,setPeriod]=useState(7),[filter,setFilter]=useState('All'),[saving,busy]=useState(false),[version,refresh]=useState(0),[today,setToday]=useState('');
 const retry=useRef({payload:'',id:''});
 useEffect(()=>{
  if(!db){setError('Connection unavailable.');return;}
  let active=true, sequence=0;
  async function load(){
   if(!db||!active)return;
   const seq=++sequence;const current=()=>active&&seq===sequence;
   try{
    const session=await db.auth.getSession();if(session.error)throw session.error;
    const user=session.data.session?.user;
    const member=user?await db.from('feeding_members').select('role').eq('user_id',user.id).maybeSingle():null;
    if(member?.error)throw member.error;
    const access=member?.data?.role || 'guest';
    if(!current())return;
    setToday(kampalaToday());setRole(access);
    if(!['admin','editor','viewer'].includes(access)){setRows([]);return;}
    const all:Entry[]=[];
    for(let start=0;;start+=500){
     const result=await db.from('hatchery_log').select('*').order('day',{ascending:false}).order('created_at',{ascending:false}).order('id').range(start,start+499);
     if(result.error)throw result.error;
     all.push(...result.data);if(result.data.length<500)break;
    }
    if(current()){setRows(all);setError('');}
   }catch{if(current()){setError('Could not load the register. Check your connection and refresh.');setRows([]);setRole('');}}
  }
  void load();const onFocus=()=>void load();window.addEventListener('focus',onFocus);
  const timer=setInterval(()=>{if(!document.hidden)void load();},60000);
  return ()=>{active=false;clearInterval(timer);window.removeEventListener('focus',onFocus);};
 },[db,version]);
 const edit=['admin','editor'].includes(role);
 async function save(ev:FormEvent<HTMLFormElement>){
  ev.preventDefault();if(!db||!edit||saving)return;
  const form=ev.currentTarget, f=new FormData(form);
  const str=(n:string)=>String(f.get(n)??'').trim();const num=(n:string)=>str(n)===''?null:Number(str(n));
  const data={tank,day:str('day'),kind,method:kind==='setup'?method:null,females:num('females'),males:num('males'),eggs:num('eggs'),fry:num('fry'),flow:str('flow')||null,temp:num('temp'),batch:str('batch'),space:str('space'),notes:str('notes')};
  if(kind==='setup'&&method==='empty'){data.females=0;data.males=0;}
  if((data.eggs||data.fry)&&!data.batch){setMsg('Enter the batch ID for this collection.');return;}
  if(kind==='check'&&!rows.some(e=>e.tank===tank&&e.kind==='setup'&&e.day<=data.day)){setMsg('Record the breeder stock and method first.');return;}
  const payload=JSON.stringify(data);if(payload!==retry.current.payload)retry.current={payload,id:crypto.randomUUID()};
  busy(true);setMsg('');
  try{
   const result=await db.from('hatchery_log').insert({...data,id:retry.current.id});
   if(result.error&&result.error.code!=='23505')throw result.error;
   retry.current={payload:'',id:''};form.reset();setMsg('Saved to the shared register.');refresh(v=>v+1);
  }catch{setMsg('Save could not be confirmed. Check the entries below and retry the same entry if needed.');}
  finally{busy(false);}
 }
 const allowed=edit||role==='viewer';
 const report=rows.filter(e=>(filter==='All'||e.tank===filter)&&today&&e.day>=plus(today,1-period)&&e.day<=today);
 const total=(kind:Kind,field:'eggs'|'fry')=>report.reduce((a,e)=>a+(e.kind===kind?(e[field]??0):0),0);
 const activeBatches=rows.filter(e=>e.kind==='check'&&(e.eggs??0)>0).filter((e,i,a)=>a.findIndex(x=>x.tank===e.tank&&x.batch===e.batch)===i&&!rows.some(x=>x.tank===e.tank&&x.batch===e.batch&&x.kind==='hatch'&&x.day>=e.day));
 return <main className="hatch"><style>{`
 .hatch{max-width:1080px;margin:auto;padding:1.2rem;color:#173d37;font:1rem/1.55 system-ui,sans-serif}.hatch h1{font-size:clamp(2rem,5vw,3.2rem);line-height:1.1;margin:.5rem 0}.hatch section,.hatch header{border:1px solid #c9d8cf;border-radius:14px;padding:1.2rem;margin-bottom:1rem;background:#fff}.hatch header{background:#164d43;color:white}.hatch h2{margin:0 0 .8rem;font-size:1.45rem}.hatch label{display:grid;gap:.25rem}.hatch select,.hatch input,.hatch textarea,.hatch button{font:inherit;padding:.55rem;color:#163c36;background:white;border:1px solid #96afa6;border-radius:5px;max-width:100%;min-width:0}.hatch button{background:#195f50;color:white;cursor:pointer;margin:.65rem .5rem .25rem 0}.hatch a{text-decoration:underline}.hatch .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:.8rem}.hatch article{padding:.65rem;border:1px solid #d3ddd6;border-radius:6px}.hatch article p{margin:.3rem 0}.hatch .scroll{overflow-x:auto}.hatch table{border-collapse:collapse;width:100%;font-size:.95rem}.hatch td,.hatch th{padding:.5rem;text-align:left;border-bottom:1px solid #c9d8cf;vertical-align:top}.hatch .due{font-weight:700;color:#803e11}@media print{.hatch .entry,.hatch button{display:none}.hatch .scroll{overflow:visible}.hatch .grid{grid-template-columns:repeat(3,1fr)}}`}</style>
 <header>SANDS FISH FARM<h1>Hatchery register</h1>Tilapia breeders · T1–T6</header>
 {error&&<p role="alert">{error} <button onClick={()=>refresh(v=>v+1)}>Refresh</button></p>}
 {!allowed?<section>{role==='guest'?<><a href="/feeding">Sign in with your SANDS staff account</a>, then return to this register.</>:role?'Your account needs approved SANDS staff access.':error?'Register unavailable.':'Loading register…'}</section>:<>
 <section><h2>Tank timetable</h2><p>Breeder checks run every five days for incubation tanks and daily for natural hatch tanks. Dates follow Kampala time.</p><div className="grid">{tanks.map(t=>{
 const list=rows.filter(x=>x.tank===t), idx=list.findIndex(x=>x.kind==='setup'), setup=list[idx],last=list.slice(0,Math.max(0,idx)).find(x=>x.kind==='check');
 const due=setup&&setup.method!=='empty'?last?plus(last.day,setup.method==='A'?5:1):plus(setup.day,setup.method==='A'?5:0):'';
 return <article key={t}><strong>{t}</strong><p>{setup?methods[setup.method||'']:'Awaiting stock entry'}</p>{setup&&<p>{setup.females} females · {setup.males} males</p>}{due&&<p className={due<=today?'due':''}>{due<today?'Overdue':due===today?'Due today':'Next check'} · {due}</p>}{setup?.space&&<p>{setup.space}</p>}</article>})}</div>
 <h3>Incubator rounds today</h3>{activeBatches.length?activeBatches.map(e=><p key={e.id}>{e.tank} · {e.batch} · {['jar-am','jar-pm'].map(k=>k.slice(4).toUpperCase()+' '+(rows.some(x=>x.tank===e.tank&&x.batch===e.batch&&x.day===today&&x.kind===k)?'done':'due')).join(' / ')}</p>):<p>No open egg batches recorded.</p>}</section>
 {edit&&<section className="entry"><h2>Record an entry</h2><form onSubmit={save}><div className="grid"><label>Tank<select value={tank} onChange={e=>setTank(e.target.value)}>{tanks.map(t=><option key={t}>{t}</option>)}</select></label><label>Entry type<select value={kind} onChange={e=>setKind(e.target.value as Kind)}>{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><label>Date<input type="date" name="day" defaultValue={today} max={today} required/></label>
 {kind==='setup'?<><label>Method<select value={method} onChange={e=>setMethod(e.target.value)}>{Object.entries(methods).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>{method!=='empty'&&<><label>Female breeders<input name="females" type="number" min="0" required/></label><label>Male breeders<input name="males" type="number" min="0" required/></label></>}</>:<label>Batch ID<input name="batch" list="hatch-batches" maxLength={80} required={kind!=='check'}/><datalist id="hatch-batches">{[...new Set(rows.filter(x=>x.tank===tank&&x.batch).map(x=>x.batch))].map(b=><option key={b}>{b}</option>)}</datalist></label>}
 {kind==='check'&&<label>Eggs collected<input type="number" name="eggs" min="0" defaultValue="0" required/></label>}
 {['check','hatch','transfer'].includes(kind)&&<label>{kind==='check'?'Fry collected':kind==='hatch'?'Fry hatched':'Fry transferred'}<input key={kind} name="fry" type="number" min="0" defaultValue="0" required/></label>}
 {kind.startsWith('jar')&&<><label>Temperature °C<input type="number" name="temp" min="0" max="50" step=".1" required/></label><label>Water flow<select name="flow" required defaultValue=""><option disabled value="">Select</option><option>OK</option><option>Needs attention</option></select></label></>}
 <label>Jar, tray or nursery<input name="space" maxLength={120} required={kind==='transfer'}/></label></div><label>Notes<textarea name="notes" maxLength={600} placeholder="Breeder changes, eggs weighed, space needed or action taken"/></label><button disabled={saving}>{saving?'Saving…':'Save entry'}</button><span role="status">{msg}</span></form></section>}
 <section><h2>Production report</h2><div className="grid"><label>Reporting period<select value={period} onChange={e=>setPeriod(Number(e.target.value))}><option value={1}>Today</option><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select></label><label>Tank<select value={filter} onChange={e=>setFilter(e.target.value)}>{['All',...tanks].map(t=><option key={t}>{t}</option>)}</select></label></div>
 <p><strong>{total('check','eggs').toLocaleString()} eggs collected</strong> · {total('check','fry').toLocaleString()} fry collected from breeders · {total('hatch','fry').toLocaleString()} fry hatched in jars · {total('transfer','fry').toLocaleString()} fry transferred</p><button onClick={()=>window.print()}>Print report</button>
 <div className="scroll"><table><thead><tr>{['Date','Tank','Entry','Result','Batch / location','Notes'].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>{report.map(e=><tr key={e.id}><td>{e.day}</td><td>{e.tank}</td><td>{labels[e.kind]}</td><td>{describe(e)}</td><td>{[e.batch,e.space].filter(Boolean).join(' / ')}</td><td>{e.notes}</td></tr>)}</tbody></table></div>{!report.length&&<p>No entries in this period.</p>}</section></>}
 </main>;
}
