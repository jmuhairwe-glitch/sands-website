'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './farmos.module.css';

type Ingredient = { id: string; name: string; price: string; protein: string; share: string };
type Formula = { id: string; name: string; species: string; batch: string; rows: Ingredient[] };
const key = 'sands-farmos-formulas-v1';
const emptyRow = (): Ingredient => ({ id: crypto.randomUUID(), name: '', price: '', protein: '', share: '' });
const number = (s: string) => s.trim() !== '' && Number.isFinite(Number(s)) && Number(s) >= 0;
const validRows = (rows: Ingredient[]) => rows.length > 0 && rows.every(r => r.name.trim() && number(r.price) && number(r.protein) && +r.protein <= 100 && number(r.share) && +r.share <= 100);
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
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if(raw) { const data: unknown = JSON.parse(raw); if(!Array.isArray(data) || !data.every(isFormula)) throw new Error(); setSaved(data); } }
    catch { setNotice('Saved formulas could not be read on this device. You can still use the calculator.'); }
    setReady(true);
  }, []);
  const total = rows.reduce((sum,r) => sum + (number(r.share) ? +r.share : 0), 0);
  const valid = validRows(rows) && number(batch) && +batch > 0;
  const complete = valid && Math.abs(total - 100) < 0.000001;
  const cost = valid && total > 0 ? rows.reduce((sum,r) => sum + +r.price * +r.share,0) / total : 0;
  const protein = valid && total > 0 ? rows.reduce((sum,r) => sum + +r.protein * +r.share,0) / total : 0;
  function update(id: string, field: keyof Ingredient, value: string) { setRows(current => current.map(r => r.id === id ? {...r,[field]:value} : r)); }
  function persist(next: Formula[]) { try { localStorage.setItem(key,JSON.stringify(next)); setSaved(next); setNotice('Saved formulas updated on this device.'); } catch { setNotice('Your browser could not save this. Download a backup instead.'); } }
  function save() { if(!complete || !name.trim()) return; persist([...saved,{id:crypto.randomUUID(),name:name.trim(),species,batch,rows:rows.map(r=>({...r}))}]); }
  function normalize() {
    if(!valid || total <= 0) { setNotice('Enter ingredient names, prices, protein values and positive inclusion percentages first.'); return; }
    const shares = rows.map(r => Math.round(+r.share / total * 1000000) / 10000);
    const largest = shares.indexOf(Math.max(...shares));
    shares[largest] += 100 - shares.reduce((a,b)=>a+b,0);
    setRows(rows.map((r,i)=>({...r,share:shares[i].toFixed(4)})));
    setNotice('Percentages now total 100%. Nutritional suitability has not been assessed.');
  }
  const summary = complete ? `${name} — ${species}\nBatch: ${batch} kg\n${rows.map(r=>`${r.name}: ${(+r.share * +batch / 100).toFixed(2)} kg (${r.share}%)`).join('\n')}\nEstimated ingredient cost: ${money(cost)}/kg; ${money(cost * +batch)} per batch.\nEstimated crude protein: ${protein.toFixed(1)}%.\nPlease review suitability and quote for ingredients / milling / extrusion. My location: __. Required date: __.` : '';
  function download() {
    const data = {version:1,formula:{name,species,batch,rows}};
    const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a = document.createElement('a'); a.href=url; a.download='sands-feed-formula.json'; a.click(); URL.revokeObjectURL(url);
  }
  return <main className={styles.app}>
    <header className={styles.header}><Link href="/">← SANDS Fish Farm</Link><span>FARMER TOOLS · PILOT</span></header>
    <section className={styles.hero}><p>FARMOS BY SANDS</p><h1>Your feed.<br/>Your numbers.</h1><p>Plan a batch, understand ingredient costs and ask SANDS for a quote.</p><nav aria-label="Farm tools"><a href="#calculator">Feed calculator</a><Link href="/feeding">Feeding records ↗</Link><Link href="/costs">Project costs ↗</Link></nav><small>Feeding records and project costs require approved access.</small></section>
    <section id="calculator" className={styles.panel}><div className={styles.heading}><div><p>01 / FEED PLANNING</p><h2>Build your formula</h2></div><span className={styles.badge}>{total.toFixed(2)}% included</span></div>
      <p>Enter your own prices and ingredient analysis. All ingredients must use the same moisture basis. This calculator estimates cost and crude protein; it does not establish a nutritionally complete diet.</p>
      <div className={styles.fields}><label>Formula name<input maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label><label>Species<select value={species} onChange={e=>setSpecies(e.target.value)}><option>Catfish</option><option>Tilapia</option><option>Chicken</option><option>Duck</option><option>Other</option></select></label><label>Batch size (kg)<input type="number" min="0.01" step="any" value={batch} onChange={e=>setBatch(e.target.value)}/></label></div>
      <div className={styles.ingredients}>{rows.map((r,i)=><fieldset key={r.id}><legend>Ingredient {i+1}</legend><div className={styles.row}><label>Ingredient<input value={r.name} maxLength={100} placeholder="e.g. Soybean meal" onChange={e=>update(r.id,'name',e.target.value)}/></label><label>Price (UGX/kg)<input type="number" min="0" step="any" value={r.price} onChange={e=>update(r.id,'price',e.target.value)}/></label><label>Crude protein (%)<input type="number" min="0" max="100" step="any" value={r.protein} onChange={e=>update(r.id,'protein',e.target.value)}/></label><label>Inclusion (%)<input type="number" min="0" max="100" step="any" value={r.share} onChange={e=>update(r.id,'share',e.target.value)}/></label><button aria-label={`Remove ingredient ${i+1}`} onClick={()=>setRows(rows.filter(row=>row.id!==r.id))} disabled={rows.length===1}>Remove</button></div>{complete && <small>Weigh {(+r.share * +batch / 100).toFixed(2)} kg</small>}</fieldset>)}</div>
      <div className={styles.actions}><button onClick={()=>setRows([...rows,emptyRow()])}>+ Add ingredient</button><button onClick={normalize}>Normalize to 100%</button></div>
      <div className={styles.results}><div><small>Ingredient cost / kg</small><strong>{complete ? money(cost) : '—'}</strong></div><div><small>Batch ingredient cost</small><strong>{complete ? money(cost * +batch) : '—'}</strong></div><div><small>Estimated crude protein</small><strong>{complete ? `${protein.toFixed(1)}%` : '—'}</strong></div></div>
      <p>{complete ? 'Percentages total 100%. Processing, transport and losses are excluded from the cost.' : 'Complete every ingredient field and make inclusion percentages total 100% to see batch results.'}</p>
      <div className={styles.actions}><button className={styles.primary} disabled={!ready || !complete || !name.trim()} onClick={save}>Save on this device</button><button disabled={!complete} onClick={download}>Download formula backup</button>{complete && <a className={styles.primary} target="_blank" rel="noreferrer" href={quote(`Hello SANDS, please quote for this FarmOS formula:\n${summary}`)}>Review quote request in WhatsApp ↗</a>}</div>
      <p className={styles.status} role="status">{notice}</p>
    </section>
    <section className={styles.panel}><p>02 / YOUR FORMULAS</p><h2>Saved on this device</h2><p>These formulas stay in this browser. They are not synced to an account. Download backups before clearing browser data.</p>{saved.length === 0 ? <p>No saved formulas yet.</p> : saved.map(f=><div className={styles.saved} key={f.id}><span><strong>{f.name}</strong><br/>{f.species} · {f.batch} kg</span><button onClick={()=>{setName(f.name);setSpecies(f.species);setBatch(f.batch);setRows(f.rows.map(r=>({...r})));setNotice(`Loaded ${f.name}.`);document.getElementById('calculator')?.scrollIntoView();}}>Load</button><button onClick={()=>persist(saved.filter(s=>s.id!==f.id))}>Delete</button></div>)}</section>
    <section className={styles.panel}><p>03 / WORK WITH SANDS</p><h2>Take the next step</h2><div className={styles.services}>{[['Source fingerlings or chicks','Please advise on availability of fingerlings or chicks. Species: __. Quantity: __. Location: __. Date: __.'],['Milling & extrusion enquiry','Please advise on milling or extrusion options. Feed type: __. Batch size: __. Location: __.'],['Register farmer or buyer interest','I would like to join the FarmOS pilot as a farmer / buyer. Name: __. Farm/business: __. Location: __. Products and quantities: __.']].map(([title,message])=><a key={title} target="_blank" rel="noreferrer" href={quote(`Hello SANDS, ${message}`)}><strong>{title} ↗</strong><span>Discuss on WhatsApp</span></a>)}</div><p>Requests open in WhatsApp for you to review and send. Availability, prices and fulfilment are confirmed by SANDS.</p></section>
    <footer className={styles.footer}>FarmOS by SANDS · Kanyanya, Kampala · <Link href="/">Return to website</Link></footer>
  </main>;
}
