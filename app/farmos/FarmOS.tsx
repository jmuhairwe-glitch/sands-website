'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './farmos.module.css';
import { catalog, examples, nutrientFields, numeric, weighted, parseCsv, guidance, referenceWarnings, type Ingredient, type CatalogItem } from './feed-data';

type Formula = { id: string; name: string; species: string; batch: string; stage?: string; note?: string; rows: Ingredient[] };
const key = 'sands-farmos-formulas-v1';
const emptyRow = (): Ingredient => ({ id: crypto.randomUUID(), name: '', price: '', protein: '', share: '' });
const number = numeric;
const validRows = (rows: Ingredient[]) => rows.length > 0 && rows.every(r => r.name.trim() && (!r.price || number(r.price)) && nutrientFields.every(f => !r[f] || (number(r[f]) && +r[f]! <= 100)) && (!r.max || (number(r.max) && +r.max <= 100)) && number(r.share) && +r.share <= 100);
function isFormula(value: unknown): value is Formula {
  if (!value || typeof value !== 'object') return false;
  const f = value as Formula;
  return typeof f.id === 'string' && typeof f.name === 'string' && typeof f.species === 'string' && typeof f.batch === 'string' && number(f.batch) && +f.batch > 0 && Array.isArray(f.rows) && f.rows.every(r => r && ['id','name','price','protein','share'].every(k => typeof r[k as keyof Ingredient] === 'string')) && validRows(f.rows);
}
const money = (n: number) => `UGX ${Math.round(n).toLocaleString('en-UG')}`;
const quote = (message: string) => `https://wa.me/256756188061?text=${encodeURIComponent(message)}`;

export default function FarmOS() {
  const [name, setName] = useState('My formula');
  const [species, setSpecies] = useState('Catfish');
  const [batch, setBatch] = useState('100');
  const [rows, setRows] = useState<Ingredient[]>([{id:'first',name:'',price:'',protein:'',share:''}]);
  const [saved, setSaved] = useState<Formula[]>([]);
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [custom, setCustom] = useState<CatalogItem[]>([]);
  const [draftNote, setDraftNote] = useState('');
  const [stage, setStage] = useState('Grower');
  const [pending, setPending] = useState<CatalogItem[]>([]);
  const ingredients = [...catalog,...custom];
  const filtered = ingredients.filter(i => (category==='All'||i.category===category) && i.name.toLowerCase().includes(search.toLowerCase()));
  function addItem(item: CatalogItem) {
    const r:Ingredient={...item,id:crypto.randomUUID(),protein:item.protein||'',share:''};
    setRows(current=>current.length===1&&!current[0].name&&!current[0].share ? [r] : [...current,r]);
    setNotice(`Added ${item.name}. Enter its quantity or percentage and your price.`);
  }
  function useExample(index:number){
    const ex=examples[index];setRows(ex.parts.map(([n,share])=>({...catalog[n],protein:catalog[n].protein||'',id:crypto.randomUUID(),share:String(share)})));
    setName(ex.name);setSpecies(ex.species);setBatch(index===2?'74':'100');setStage('Unspecified');setDraftNote(ex.note);setNotice('Example loaded. Enter current UGX prices and review the ingredient analysis.');
  }
  function fileDownload(content:string,filename:string,type:string){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function upload(file:File|undefined){if(!file)return;try{if(file.size>1000000)throw new Error('Use a CSV smaller than 1 MB.');setPending(parseCsv(await file.text()));setNotice('Review the imported ingredients below, then add them to your library.');}catch(e){setPending([]);setNotice(e instanceof Error?e.message:'Could not read CSV.');}}
  function saveLibrary(next:CatalogItem[]){try{localStorage.setItem('sands-farmos-library-v1',JSON.stringify(next));setCustom(next);setPending([]);setNotice('Ingredient library saved on this device.');}catch{setNotice('Could not save the ingredient library in this browser.');}}

  useEffect(() => {
    try { const raw = localStorage.getItem(key); if(raw) { const data: unknown = JSON.parse(raw); if(!Array.isArray(data) || !data.every(isFormula)) throw new Error(); setSaved(data); } }
    catch { setNotice('Saved formulas could not be read on this device. You can still use the calculator.'); }
    try { const raw=localStorage.getItem('sands-farmos-library-v1');if(raw){const items=JSON.parse(raw);if(Array.isArray(items)&&items.every(i=>i&&typeof i.name==='string'&&typeof i.category==='string'&&typeof i.price==='string'&&nutrientFields.every(f=>i[f]===undefined||typeof i[f]==='string')))setCustom(items);}} catch {setNotice('Could not read the custom ingredient library.');}
    setReady(true);
  }, []);
  const total = rows.reduce((sum,r) => sum + (number(r.share) ? +r.share : 0), 0);
  const valid = validRows(rows) && number(batch) && +batch > 0;
  const complete = valid && Math.abs(total - 100) < 0.000001;
  const cost = weighted(rows,'price');
  const protein = weighted(rows,'protein');
  const autoWarnings=referenceWarnings(rows,species,stage);
  function update(id: string, field: keyof Ingredient, value: string) { setRows(current => current.map(r => r.id === id ? {...r,[field]:value,...(nutrientFields.includes(field as typeof nutrientFields[number])||field==='name'?{note:'Edited by you. Verify these values against your supplier or laboratory analysis.'}:{})} : r)); }
  function persist(next: Formula[]) { try { localStorage.setItem(key,JSON.stringify(next)); setSaved(next); setNotice('Saved formulas updated on this device.'); } catch { setNotice('Your browser could not save this. Download a backup instead.'); } }
  function save() { if(!complete || !name.trim()) return; persist([...saved,{id:crypto.randomUUID(),name:name.trim(),species,batch,stage,note:draftNote,rows:rows.map(r=>({...r}))}]); }
  function normalize() {
    if(!valid || total <= 0) { setNotice('Enter ingredient names, a positive batch size and valid inclusion percentages first.'); return; }
    const shares = rows.map(r => Math.round(+r.share / total * 1000000) / 10000);
    const largest = shares.indexOf(Math.max(...shares));
    shares[largest] += 100 - shares.reduce((a,b)=>a+b,0);
    setRows(rows.map((r,i)=>({...r,share:shares[i].toFixed(4)})));
    setNotice('Percentages now total 100%. Nutritional suitability has not been assessed.');
  }
  const summary = complete ? `${name} — ${species} / ${stage}\n${draftNote}\nBatch: ${batch} kg\n${rows.map(r=>`${r.name}: ${(+r.share * +batch / 100).toFixed(2)} kg (${r.share}%)`).join('\n')}\nEstimated ingredient cost: ${cost===null?'price data missing':money(cost)+'/kg; '+money(cost * +batch)+' per batch.'}\nEstimated crude protein (as-fed): ${protein===null?'data missing':protein.toFixed(1)+'%'}.\n${autoWarnings.map(w=>`${w.name}: ${w.share.toFixed(1)}% reaches/exceeds ${w.guide.ceiling}% reference review level.`).join('\n')}\nPlease review suitability and quote for ingredients / milling / extrusion. My location: __. Required date: __.` : '';
  function download() {
    const data = {version:1,formula:{name,species,batch,stage,note:draftNote,rows}};
    const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a = document.createElement('a'); a.href=url; a.download='sands-feed-formula.json'; a.click(); URL.revokeObjectURL(url);
  }
  return <main className={styles.app}>
    <header className={styles.header}><Link href="/">← SANDS Fish Farm</Link><span>FARMER TOOLS · PILOT</span></header>
    <section className={styles.hero}><p>FARMOS BY SANDS</p><h1>Your feed.<br/>Your numbers.</h1><p>Plan a batch, understand ingredient costs and ask SANDS for a quote.</p><nav aria-label="Farm tools"><a href="#calculator">Feed calculator</a><Link href="/feeding">Feeding records ↗</Link><Link href="/costs">Project costs ↗</Link></nav><small>Feeding records and project costs require approved access.</small></section>
    <section id="calculator" className={styles.panel}><div className={styles.heading}><div><p>01 / FEED PLANNING</p><h2>Build your formula</h2></div><span className={styles.badge}>{total.toFixed(2)}% included</span></div>
      <p>Pick ingredients, enter quantities and prices, and let FarmOS estimate the mix. Use as-fed nutrient percentages throughout. Blank values mean unknown, not zero. This calculator estimates cost and composition; it does not establish a nutritionally complete diet.</p>
      <details className={styles.library} open><summary>Choose ingredients from the library</summary><p>Choose an ingredient and its reference protein estimate fills in automatically. Edit it if you have lab results. Prices remain yours to enter; premixes and concentrates need their product label.</p><div className={styles.fields}><label>Search ingredients<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Maize, mukene, soybean…"/></label><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{['All',...Array.from(new Set(ingredients.map(i=>i.category)))].map(c=><option key={c}>{c}</option>)}</select></label></div><div className={styles.catalog}>{filtered.map((item,i)=><article key={item.name+i}><strong>{item.name}</strong><small>{item.category} · {item.protein ? `${item.protein}% protein · estimate` : 'Analysis needed'}</small><button onClick={()=>addItem(item)}>Add {item.name}</button></article>)}</div>{!filtered.length&&<p>No matching ingredients. Add a custom ingredient below.</p>}
      <details><summary>Upload an ingredient list (CSV)</summary><p>Save an Excel or Google Sheets list as CSV. Prices are UGX/kg; nutrient columns are as-fed percentages. Blank nutrient cells stay unknown.</p><button onClick={()=>fileDownload('name,category,price,protein,fat,fibre,ash,moisture,calcium,phosphorus,lysine,methionine\nMy ingredient,Custom,,,,,,,,,,\n','ingredient-template.csv','text/csv')}>Download CSV template</button><label>Choose CSV file<input type="file" accept=".csv,text/csv" onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/></label>{pending.length>0&&<div><p>{pending.length} ingredients ready: {pending.slice(0,8).map(i=>i.name).join(', ')}{pending.length>8?'…':''}</p><button onClick={()=>saveLibrary([...custom,...pending])}>Add imported list to library</button><button onClick={()=>setPending([])}>Cancel import</button></div>}</details></details>
      <details className={styles.library}><summary>Start from an example mix</summary><p>These are editable calculation examples, not approved feed recipes. Prices and missing analysis must be supplied. Normalizing to 100% does not balance nutrition.</p><div className={styles.services}>{examples.map((ex,i)=><article key={ex.name}><h3>{ex.name}</h3><p>{ex.note}</p><button onClick={()=>useExample(i)}>Use example</button></article>)}</div></details>
      <button onClick={()=>{setRows([emptyRow()]);setName('My formula');setDraftNote('');setNotice('Started a blank formula. Previously saved formulas are unchanged.');}}>Start a blank formula</button>
      {draftNote&&<p className={styles.warning}>{draftNote}</p>}
      <div className={styles.fields}><label>Formula name<input maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label><label>Species<select value={species} onChange={e=>setSpecies(e.target.value)}><option>Catfish</option><option>Tilapia</option><option>Chicken</option><option>Duck</option><option>Other</option></select></label><label>Production stage<select value={stage} onChange={e=>setStage(e.target.value)}>{['Unspecified','Starter','Grower','Finisher','Broodstock','Layer'].map(s=><option key={s}>{s}</option>)}</select></label><label>Batch size (kg)<input type="number" min="0.01" step="any" value={batch} onChange={e=>setBatch(e.target.value)}/></label></div>
      <div className={styles.ingredients}>{rows.map((r,i)=><fieldset key={r.id}><legend>Ingredient {i+1}</legend><div className={styles.row}><label>Ingredient<input value={r.name} maxLength={100} placeholder="e.g. Soybean meal" onChange={e=>update(r.id,'name',e.target.value)}/></label><label>Price (UGX/kg)<input type="number" min="0" step="any" value={r.price} onChange={e=>update(r.id,'price',e.target.value)}/></label><label>Crude protein (%) — editable estimate<input type="number" min="0" max="100" step="any" value={r.protein} onChange={e=>update(r.id,'protein',e.target.value)}/></label><label>Inclusion (%)<input type="number" min="0" max="100" step="any" value={r.share} onChange={e=>update(r.id,'share',e.target.value)}/></label><label>Quantity (kg)<input type="number" min="0" step="any" disabled={!number(batch)||+batch<=0} value={number(r.share)&&number(batch)?String(Math.round(+r.share * +batch / 100 * 1000000)/1000000):''} onChange={e=>update(r.id,'share',e.target.value===''?'':String(+e.target.value / +batch * 100))}/></label><button aria-label={`Remove ingredient ${i+1}`} onClick={()=>setRows(rows.filter(row=>row.id!==r.id))} disabled={rows.length===1}>Remove</button></div><div className={styles.guide}>{guidance(r.name,species,stage)?<p><strong>{guidance(r.name,species,stage)!.label}: {guidance(r.name,species,stage)!.ceiling}%.</strong> {guidance(r.name,species,stage)!.detail} <a href={guidance(r.name,species,stage)!.source} target="_blank" rel="noreferrer">Source ↗</a></p>:<p>No numeric reference limit loaded for this ingredient and {species} / {stage}. This does not mean unlimited inclusion.</p>}</div><details><summary>Analysis, source & inclusion limit</summary>{catalog.find(c=>c.name===r.name)?.protein!==undefined&&<button onClick={()=>{const item=catalog.find(c=>c.name===r.name)!;setRows(current=>current.map(row=>row.id===r.id?{...row,protein:item.protein!,note:item.note,source:item.source}:row));setNotice('Reference protein estimate restored.');}}>Restore reference protein ({catalog.find(c=>c.name===r.name)!.protein}%)</button>}<p>{r.note||'Enter supplier or laboratory analysis on an as-fed basis.'}</p>{r.source?.startsWith('https://')&&<a href={r.source} target="_blank" rel="noreferrer">Reference source ↗</a>}<div className={styles.fields}>{nutrientFields.filter(f=>f!=='protein').map(f=><label key={f}>{f} (%)<input type="number" min="0" max="100" step="any" value={r[f]||''} onChange={e=>update(r.id,f,e.target.value)}/></label>)}<label>Your maximum inclusion (%)<input type="number" min="0" max="100" step="any" value={r.max||''} onChange={e=>update(r.id,'max',e.target.value)}/></label></div><small>Limits are user-entered for this formula, not species recommendations.</small><button disabled={!r.name.trim()} onClick={()=>saveLibrary([...custom,{name:r.name,category:'Custom',price:r.price,source:r.source||'User entry',note:r.note||'User-entered analysis; verify as-fed basis.',...Object.fromEntries(nutrientFields.map(f=>[f,r[f]||'']))}])}>Save ingredient to my library</button></details>{number(r.max)&&number(r.share)&&+r.share>+r.max&&<p className={styles.warning}>{r.name}: {(+r.share).toFixed(2)}% exceeds your {r.max}% limit.</p>}{complete && <small>Weigh {(+r.share * +batch / 100).toFixed(2)} kg</small>}</fieldset>)}</div>
      <div className={styles.actions}><button onClick={()=>setRows([...rows,emptyRow()])}>+ Add custom ingredient</button><button onClick={normalize}>Normalize to 100%</button><button onClick={()=>{setRows(current=>current.map(r=>{const item=catalog.find(c=>c.name.toLowerCase()===r.name.trim().toLowerCase());return !r.protein&&item?.protein!==undefined?{...r,protein:item.protein,source:item.source,note:item.note}:r;}));setNotice('Filled missing protein estimates for matching library ingredients. Existing values were kept.');}}>Fill missing protein estimates</button></div>
      {autoWarnings.length>0&&<section className={styles.warning} aria-label="Automatic inclusion warnings"><h3>Check these inclusion levels</h3>{autoWarnings.map(w=><p key={w.name}><strong>{w.name}: {w.share.toFixed(1)}% {w.share>w.guide.ceiling?'exceeds':'reaches'} the {w.guide.ceiling}% reference review level.</strong> {w.guide.detail} <a href={w.guide.source} target="_blank" rel="noreferrer">Source ↗</a></p>)}</section>}
      <div className={styles.results}><div><small>Ingredient cost / kg</small><strong>{complete && cost!==null ? money(cost) : 'Price data missing'}</strong></div><div><small>Batch ingredient cost</small><strong>{complete && cost!==null ? money(cost * +batch) : '—'}</strong></div><div><small>Estimated crude protein</small><strong>{complete && protein!==null ? `${protein.toFixed(1)}%` : 'Data missing'}</strong></div></div>
      <details className={styles.library}><summary>Full composition analysis</summary><p>As-fed weighted estimates. Missing data in any included ingredient makes that nutrient unavailable. Energy and available phosphorus are not estimated without species-specific digestibility data.</p><div className={styles.results}>{nutrientFields.map(f=>{const value=weighted(rows,f);return <div key={f}><small>{f}</small><strong>{complete&&value!==null?value.toFixed(2)+'%':'Data missing'}</strong></div>;})}</div></details>
      <p>{complete ? 'Percentages total 100%. Processing, transport and losses are excluded from the cost.' : 'Enter quantities adding up to the batch size, or percentages adding up to 100%. Add prices and nutrient data to see their estimates.'}</p>
      <div className={styles.actions}><button className={styles.primary} disabled={!ready || !complete || !name.trim()} onClick={save}>Save on this device</button><button disabled={!complete} onClick={()=>window.print()}>Print / Save PDF</button><button disabled={!complete} onClick={download}>Download formula backup</button>{complete && <a className={styles.primary} target="_blank" rel="noreferrer" href={quote(`Hello SANDS, please quote for this FarmOS formula:\n${summary}`)}>Review quote request in WhatsApp ↗</a>}</div>
      <p className={styles.status} role="status">{notice}</p>
    </section>
    <section className={styles.panel}><p>02 / YOUR FORMULAS</p><h2>Saved on this device</h2><p>These formulas stay in this browser. They are not synced to an account. Download backups before clearing browser data.</p>{saved.length === 0 ? <p>No saved formulas yet.</p> : saved.map(f=><div className={styles.saved} key={f.id}><span><strong>{f.name}</strong><br/>{f.species} · {f.batch} kg</span><button onClick={()=>{setName(f.name);setSpecies(f.species);setBatch(f.batch);setStage(f.stage||'Unspecified');setDraftNote(f.note||'');setRows(f.rows.map(r=>({...r})));setNotice(`Loaded ${f.name}.`);document.getElementById('calculator')?.scrollIntoView();}}>Load</button><button onClick={()=>persist(saved.filter(s=>s.id!==f.id))}>Delete</button></div>)}</section>
    <section className={styles.panel}><p>03 / WORK WITH SANDS</p><h2>Take the next step</h2><div className={styles.services}>{[['Source fingerlings or chicks','Please advise on availability of fingerlings or chicks. Species: __. Quantity: __. Location: __. Date: __.'],['Milling & extrusion enquiry','Please advise on milling or extrusion options. Feed type: __. Batch size: __. Location: __.'],['Register farmer or buyer interest','I would like to join the FarmOS pilot as a farmer / buyer. Name: __. Farm/business: __. Location: __. Products and quantities: __.']].map(([title,message])=><a key={title} target="_blank" rel="noreferrer" href={quote(`Hello SANDS, ${message}`)}><strong>{title} ↗</strong><span>Discuss on WhatsApp</span></a>)}</div><p>Requests open in WhatsApp for you to review and send. Availability, prices and fulfilment are confirmed by SANDS.</p></section>
    <footer className={styles.footer}>FarmOS by SANDS · Kanyanya, Kampala · <Link href="/">Return to website</Link></footer>
  </main>;
}
