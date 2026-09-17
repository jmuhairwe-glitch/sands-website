export const PROJECT_END = '2027-03-31';
export const CATEGORIES = ['Fingerlings','Feed purchase','Electricity','Labour','Transport','Treatments','Equipment','Other'] as const;
export type Cost = { id: string; day: string; category: string; description: string; quantity: number; unit: string; unit_price: number; basis: 'both'|'cash'|'production'; notes: string; voided: boolean; revision: number; amount: number };
export type FeedCost = { day: string; tank: string; kg: number; feed_name: string; unit_price: number|null; amount: number|null };
export type Report = { expenses: Cost[]; feeds: FeedCost[] };
export const money = (n: number) => new Intl.NumberFormat('en-UG',{style:'currency',currency:'UGX',minimumFractionDigits:0,maximumFractionDigits:2}).format(n);
export function summarize(report: Report) {
 const daily = new Map<string,{day:string;cash:number;production:number;unpriced:number}>();
 const categories = new Map<string,{cash:number;production:number}>();
 const day = (d:string) => { if(!daily.has(d)) daily.set(d,{day:d,cash:0,production:0,unpriced:0}); return daily.get(d)!; };
 const cat = (c:string) => { if(!categories.has(c)) categories.set(c,{cash:0,production:0}); return categories.get(c)!; };
 for(const c of report.expenses) { if(c.voided) continue; const cents=Math.round(Number(c.amount)*100); const d=day(c.day), k=cat(c.category); if(c.basis!=='production'){d.cash+=cents;k.cash+=cents;} if(c.basis!=='cash'){d.production+=cents;k.production+=cents;} }
 for(const f of report.feeds) {const d=day(f.day);if(f.amount==null && Number(f.kg)>0)d.unpriced++;else {const cents=Math.round(Number(f.amount ?? 0)*100);d.production+=cents;cat('Feed consumed').production+=cents;} }
 let cash=0,production=0;
 const rows=[...daily.values()].sort((a,b)=>a.day.localeCompare(b.day)).map(d=>{cash+=d.cash;production+=d.production;return {...d,cash:d.cash/100,production:d.production/100,cumulativeCash:cash/100,cumulativeProduction:production/100};});
 return {rows,cash:cash/100,production:production/100,unpriced:report.feeds.filter(f=>f.amount==null&&Number(f.kg)>0),categories:[...categories].map(([name,v])=>({name,cash:v.cash/100,production:v.production/100}))};
}
