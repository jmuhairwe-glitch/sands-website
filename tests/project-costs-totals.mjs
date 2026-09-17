import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../lib/project-costs.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {summarize}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const report={expenses:[
 {day:'2026-09-14',category:'Fingerlings',basis:'production',amount:10000000},
 {day:'2026-09-14',category:'Feed purchase',basis:'cash',amount:500000},
 {day:'2026-09-14',category:'Electricity',basis:'both',amount:25000},
 {day:'2026-09-15',category:'Other',basis:'both',amount:999999,voided:true}
],feeds:[
 {day:'2026-09-14',tank:'T1',kg:2,unit_price:5000,amount:10000},
 {day:'2026-09-15',tank:'T1',kg:3,unit_price:6000,amount:18000},
 {day:'2026-09-15',tank:'T2',kg:1,unit_price:null,amount:null},
 {day:'2026-09-15',tank:'T3',kg:0,unit_price:null,amount:null}
]};
const t=summarize(report);
assert.equal(t.cash,525000);assert.equal(t.production,10053000);
assert.equal(t.rows[0].cumulativeProduction,10035000);
assert.equal(t.rows[1].production,18000);assert.equal(t.rows[1].cumulativeCash,525000);
assert.equal(t.unpriced.length,1);
assert.equal(t.categories.find(x=>x.name==='Feed consumed').production,28000);
assert.equal(t.categories.find(x=>x.name==='Feed purchase').production,0);
assert.deepEqual(summarize({expenses:[],feeds:[]}).rows,[]);
console.log('PASS: cumulative dates, separate cash/production, own stock valuation, feed purchases not double-counted, voided entries excluded, unpriced vs zero feed.');
