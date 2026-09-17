'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { feedingClient } from '../../lib/feeding-client';
import { SEASON_START, canView, kampalaToday, type Member } from '../../lib/feeding';
import { CATEGORIES, PROJECT_END, money, summarize, type Cost, type Report } from '../../lib/project-costs';
import styles from '../feeding/feeding.module.css';

type Draft = {id:string;day:string;category:string;description:string;quantity:string;unit:string;unit_price:string;basis:Cost['basis'];notes:string;revision:number};
const blank = (day:string):Draft => ({id:'',day,category:'Fingerlings',description:'',quantity:'',unit:'fish',unit_price:'',basis:'production',notes:'',revision:0});
const failure = (e:unknown) => e && typeof e==='object' && 'message' in e ? String(e.message) : 'Could not complete the request.';

export default function CostsApp() {
 const [client]=useState(feedingClient);
 const [userId,setUserId]=useState<string|null>(null);
 const [member,setMember]=useState<Member|null>(null);
 const [report,setReport]=useState<Report|null>(null);
 const [asOf,setAsOf]=useState(SEASON_START);
 const [today,setToday]=useState(SEASON_START);
 const [draft,setDraft]=useState<Draft>(()=>blank(SEASON_START));
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const sequence=useRef(0);
 const canEdit=member?.role==='admin'||member?.role==='editor';
 const valid=asOf>=SEASON_START&&asOf<=PROJECT_END;
 const totals=report?summarize(report):null;
 useEffect(()=>{
  const date=kampalaToday();setToday(date);setAsOf(date>PROJECT_END?PROJECT_END:date<SEASON_START?SEASON_START:date);
  if(!client){setLoading(false);return;}
  const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{
   setUserId(session?.user.id??null);
   if(!session){sequence.current++;setReport(null);setMember(null);setLoading(false);}
  });
  client.auth.getSession().then(({data,error:e})=>{if(e)setError(e.message);setUserId(data.session?.user.id??null);if(!data.session)setLoading(false);});
  return ()=>subscription.unsubscribe();
 },[client]);
 const refresh=useCallback(async()=>{
  if(!client||!userId)return;
  const seq=++sequence.current;
  try{
   const own=await client.from('feeding_members').select('*').eq('user_id',userId).maybeSingle();
   if(own.error)throw own.error;
   if(seq!==sequence.current)return;
   setMember(own.data);
   if(!canView(own.data?.role)||!valid){setReport(null);return;}
   const result=await client.rpc('project_cost_report',{as_of:asOf});
   if(result.error)throw result.error;
   if(seq===sequence.current){setReport(result.data);setError('');}
  }catch(e){if(seq===sequence.current){setReport(null);setMember(null);setError(failure(e));}}
  finally{if(seq===sequence.current)setLoading(false);}
 },[client,userId,asOf,valid]);
 useEffect(()=>{
  if(!userId)return;
  setLoading(true);void refresh();
  const focus=()=>{void refresh();};
  const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},30000);
  window.addEventListener('focus',focus);
  return ()=>{sequence.current++;clearInterval(timer);window.removeEventListener('focus',focus);};
 },[userId,refresh]);
 function edit(c:Cost){setDraft({id:c.id,day:c.day,category:c.category,description:c.description,quantity:String(c.quantity),unit:c.unit,unit_price:String(c.unit_price),basis:c.basis,notes:c.notes,revision:c.revision});setNotice('');document.getElementById('cost-editor')?.scrollIntoView({behavior:'smooth'});}
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!client||!canEdit||busy)return;
  setBusy(true);setError('');setNotice('');
  try{
   const quantity=Number(draft.quantity),price=Number(draft.unit_price);
   if(!draft.quantity.trim()||!draft.unit_price.trim()||!Number.isFinite(quantity)||!Number.isFinite(price)||quantity<=0||price<0)throw new Error('Enter a positive quantity and a price of zero or more.');
   const id=draft.id||crypto.randomUUID();setDraft(d=>({...d,id}));
   const values={day:draft.day,category:draft.category,description:draft.description.trim(),quantity,unit:draft.unit.trim(),unit_price:price,basis:draft.category==='Feed purchase'?'cash':draft.basis,notes:draft.notes.trim()};
   const result=draft.revision ? await client.from('project_costs').update(values).eq('id',id).eq('revision',draft.revision).select().maybeSingle() : await client.from('project_costs').insert({id,...values}).select().single();
   if(result.error?.code==='23505')throw new Error('This entry may already have been saved. Refresh and check the ledger before adding another.');
   if(result.error)throw result.error;
   if(!result.data)throw new Error('This entry changed. Refresh, then select Edit on the latest version.');
   setNotice('Cost saved.');setDraft(blank(draft.day));await refresh();
  }catch(e){setError(failure(e));}finally{setBusy(false);}
 }
 async function voidEntry(c:Cost){
  if(!client||!canEdit||!window.confirm(`Void “${c.description}”? It will be excluded from totals but retained in history.`))return;
  setBusy(true);setError('');
  try{const r=await client.from('project_costs').update({voided:true}).eq('id',c.id).eq('revision',c.revision).select().maybeSingle();if(r.error)throw r.error;if(!r.data)throw new Error('Entry changed. Refresh and try again.');await refresh();setNotice('Entry voided; totals updated.');}catch(e){setError(failure(e));}finally{setBusy(false);}
 }
 function csv(){
  if(!report||!totals)return;
  const rows:unknown[][]=[['SANDS 10-tonne project','As of',asOf,'Currency','UGX'],['Date','Category','Description / tank','Quantity','Unit','Unit price UGX','Cash UGX','Production UGX','Status','Notes']];
  for(const c of report.expenses)rows.push([c.day,c.category,c.description,c.quantity,c.unit,c.unit_price,c.voided||c.basis==='production'?0:c.amount,c.voided||c.basis==='cash'?0:c.amount,c.voided?'VOID':'Active',c.notes]);
  for(const f of report.feeds)rows.push([f.day,'Feed consumed',`${f.tank} ${f.feed_name}`,f.kg,'kg',f.unit_price??'',0,f.amount??'',f.amount==null&&Number(f.kg)>0?'UNPRICED':'Priced','']);
  rows.push([],['Daily totals'],['Date','Cash','Production','Running cash','Running production','Unpriced feed records']);
  for(const d of totals.rows)rows.push([d.day,d.cash,d.production,d.cumulativeCash,d.cumulativeProduction,d.unpriced]);
  const encode=(value:unknown)=>{let s=String(value??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
  const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(encode).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=`SANDS-project-costs-${asOf}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <main className={styles.app}>
  <header className={styles.header}><a href="/" className={styles.brand}>SANDS <span>FISH FARM</span></a><div className={styles.headerActions}><a href="/feeding">Feeding log & access</a><span className={styles.private}>Private records</span></div></header>
  <div className={styles.content}>
   <div className={styles.heading}><div><p className={styles.eyebrow}>10-TONNE PROJECT · UGX</p><h1>Project costs</h1><p>14 September 2026 – 31 March 2027</p></div>{member&&<span className={styles.role}>{member.display_name} · {member.role}</span>}</div>
   {error&&<p className={styles.error} role="alert">{error} <button onClick={()=>void refresh()}>Retry</button></p>}
   {notice&&<p className={styles.notice} role="status">{notice}</p>}
   {!userId&&!loading?<section className={styles.card}><h2>Sign in to view project costs</h2><p>Uses the same approved account as the feeding log.</p><a href="/feeding">Sign in or request access</a></section>:<>
    <section className={`${styles.card} ${styles.filters}`}><label>Costs up to and including<input type="date" min={SEASON_START} max={PROJECT_END} value={asOf} onChange={e=>{setReport(null);setAsOf(e.target.value);}}/></label><div className={styles.filterActions}><button onClick={()=>void refresh()}>Refresh</button><button disabled={!report} onClick={csv}>Download CSV</button><button disabled={!report} onClick={()=>window.print()}>Print / PDF</button></div><small>Totals always start on 14 September. Future dates show recorded costs only. Refreshes every 30 seconds.</small></section>
    {!valid&&<p className={styles.error}>Choose a date within the project season.</p>}
    {loading?<p role="status">Loading project costs…</p>:!canView(member?.role)?<section className={styles.card}><h2>Approved access required</h2><a href="/feeding">Check or request access</a></section>:report&&totals&&<>
     <p><strong>Recorded totals as of {asOf}.</strong> These reflect entries saved so far, not a forecast.</p>
     <div className={styles.summary}><div><span>Cash spent</span><strong>{money(totals.cash)}</strong></div><div><span>{totals.unpriced.length?'Known production cost (incomplete)':'Recorded production cost'}</span><strong>{money(totals.production)}</strong></div></div>
     <section className={styles.card}><p>Cash spent includes feed purchases and payments. Production cost includes feed consumed and other costs assigned to this project. A cost marked “Both” appears in each separate total; the two totals must not be added together.</p><p>For your own hatchery’s fingerlings, choose “Production only” to record their assigned value. Record purchased fingerlings as “Both” if paid for on the stocking date. Feed purchases count as cash only; consumed feed is calculated from the feeding log.</p></section>
     {totals.unpriced.length>0&&<section className={styles.error}><h2>{totals.unpriced.length} feeding records need prices</h2><p>Production cost excludes these amounts until a price is entered. Open the feeding log, choose the date range, then select the tank cell to add its feed name and price per kg.</p><a href="/feeding">Add feed prices</a><details><summary>Show unpriced records</summary>{totals.unpriced.map(f=><p key={f.day+f.tank}>{f.day} · {f.tank} · {f.kg} kg</p>)}</details></section>}
     {canEdit&&<section id="cost-editor" className={`${styles.card} ${styles.editor}`}><h2>{draft.revision?'Correct cost entry':'Add project cost'}</h2><p>For a bill, enter quantity 1, unit “bill”, and the bill amount as unit price. Actual figures only; no sample costs have been added.</p><form onSubmit={save}>
      <label>Date<input type="date" required min={SEASON_START} max={today<PROJECT_END?today:PROJECT_END} value={draft.day} onChange={e=>setDraft({...draft,day:e.target.value})}/></label>
      <label>Category<select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value,basis:e.target.value==='Feed purchase'||e.target.value==='Equipment'?'cash':e.target.value==='Fingerlings'?'production':'both',unit:e.target.value==='Feed purchase'?'kg':e.target.value==='Fingerlings'?'fish':'bill'})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label>
      <label>Description<input required maxLength={200} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} placeholder="What was stocked or paid for?"/></label>
      <label>Quantity<input type="number" required min="0.001" max="999999999.999" step="0.001" value={draft.quantity} onChange={e=>setDraft({...draft,quantity:e.target.value})}/></label>
      <label>Unit<input required maxLength={30} value={draft.unit} onChange={e=>setDraft({...draft,unit:e.target.value})}/></label>
      <label>Unit cost (UGX)<input type="number" required min="0" max="9999999999.99" step="0.01" value={draft.unit_price} onChange={e=>setDraft({...draft,unit_price:e.target.value})}/></label>
      <label>Count toward<select disabled={draft.category==='Feed purchase'} value={draft.basis} onChange={e=>setDraft({...draft,basis:e.target.value as Cost['basis']})}><option value="both">Both cash and production</option><option value="cash">Cash only</option><option value="production">Production only (no payment)</option></select></label>
      <label className={styles.notesInput}>Notes<input maxLength={500} value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})}/></label>
      <button className={styles.primary} disabled={busy}>{busy?'Saving…':'Save cost'}</button><button type="button" disabled={busy} onClick={()=>setDraft(blank(SEASON_START))}>Clear / new entry</button>
     </form><small>Line total: {money((Number(draft.quantity)||0)*(Number(draft.unit_price)||0))}. Entries after the selected “as of” date appear when you extend that date.</small></section>}
     <section className={styles.records}><h2>Daily costs and running totals</h2><div className={styles.tableScroll}><table><thead><tr><th>Date</th><th>Daily cash</th><th>Daily production</th><th>Running cash</th><th>Running production</th><th>Unpriced feeds</th></tr></thead><tbody>{totals.rows.map(d=><tr key={d.day}><th>{d.day}</th><td>{money(d.cash)}</td><td>{money(d.production)}</td><td>{money(d.cumulativeCash)}</td><td>{money(d.cumulativeProduction)}</td><td>{d.unpriced||'—'}</td></tr>)}</tbody></table></div>{!totals.rows.length&&<p>No costs or feed recorded up to this date.</p>}<p><small>Dates with no entries are omitted; the running total carries forward. Unpriced feed makes production totals incomplete.</small></p></section>
     <section className={`${styles.card} ${styles.records}`}><h2>By category</h2><div className={styles.tableScroll}><table><thead><tr><th>Category</th><th>Cash spent</th><th>Production cost</th></tr></thead><tbody>{totals.categories.map(c=><tr key={c.name}><th>{c.name}</th><td>{money(c.cash)}</td><td>{money(c.production)}</td></tr>)}</tbody></table></div></section>
     <section className={styles.records}><h2>Cost entries</h2><div className={styles.tableScroll}><table><thead><tr><th>Date</th><th>Category / description</th><th>Quantity</th><th>Unit cost</th><th>Total</th><th>Count toward</th><th>Status / actions</th></tr></thead><tbody>{report.expenses.map(c=><tr key={c.id}><th>{c.day}</th><td style={{whiteSpace:'normal',minWidth:180}}>{c.category}<br/>{c.description}{c.notes&&<small><br/>{c.notes}</small>}</td><td>{c.quantity} {c.unit}</td><td>{money(c.unit_price)}</td><td>{money(c.amount)}</td><td>{c.basis==='both'?'Both':c.basis==='cash'?'Cash only':'Production only'}</td><td>{c.voided?'Voided':canEdit?<><button disabled={busy} onClick={()=>edit(c)}>Edit</button><button disabled={busy} onClick={()=>void voidEntry(c)}>Void</button></>:'Active'}</td></tr>)}</tbody></table></div></section>
    </>}
   </>}
  </div>
 </main>;
}
