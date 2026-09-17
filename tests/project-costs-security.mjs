import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims',true),'')::json->>'sub')::uuid $$;
`);
await db.exec(`create function auth.jwt() returns jsonb language sql stable as $$ select nullif(current_setting('request.jwt.claims',true),'')::jsonb $$;
grant usage on schema auth to anon,authenticated; grant execute on all functions in schema auth to anon,authenticated;`);
await db.exec(await readFile(new URL('../database/feeding.sql',import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../database/project-costs.sql',import.meta.url),'utf8'));
const ids = ['admin','editor','viewer','pending','outsider'].map((name,i)=>({name,id:`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`}));
for(const {id,name} of ids) {
  await db.query('insert into auth.users values ($1)',[id]);
  if(name!=='outsider') await db.query('insert into public.feeding_members(user_id,email,display_name,role) values ($1,$2,$3,$3)',[id,`${name}@example.test`,name]);
}
async function as(name,sql) {
  const person=ids.find(x=>x.name===name);
  await db.exec('begin');
  try {
    await db.exec(`set local role ${name==='anon'?'anon':'authenticated'}`);
    await db.query(`select set_config('request.jwt.claims',$1,true)`,[JSON.stringify({sub:person?.id,email:person?`${name}@example.test`:null,is_anonymous:false})]);
    const result=await db.query(sql); await db.exec('commit'); return result.rows;
  } catch(error) { await db.exec('rollback');throw error; }
}

const insert = (category,basis,quantity,price) => `insert into public.project_costs(day,category,description,quantity,unit,unit_price,basis) values ('2026-09-14','${category}','Test entry',${quantity},'units',${price},'${basis}') returning *`;
await assert.rejects(as('anon',`select public.project_cost_report('2026-09-14')`));
await assert.rejects(as('pending',`select public.project_cost_report('2026-09-14')`));
await assert.rejects(as('viewer',insert('Fingerlings','production',20000,500)));
const stock=(await as('editor',insert('Fingerlings','production',20000,500)))[0];
await as('editor',insert('Feed purchase','cash',100,5000));
await as('editor',insert('Electricity','both',1,25000));
await assert.rejects(as('editor',insert('Feed purchase','both',1,5000)));
await assert.rejects(as('editor',insert('Other','both',-1,500)));
await assert.rejects(as('editor',insert('Other','both',1,"'NaN'")));
await as('editor',`insert into public.feeding_entries(day,tank,kg,feed_name,unit_price) values ('2026-09-14','T1',2,'Feed batch A',5000),('2026-09-15','T1',3,'Feed batch B',6000)`);
await as('editor',`insert into public.feeding_entries(day,tank,kg) values ('2026-09-14','T2',1)`);
let report=(await as('viewer',`select public.project_cost_report('2026-09-14') as r`))[0].r;
assert.equal(report.expenses.length,3);assert.equal(report.feeds.length,2);
assert.equal(Number(report.expenses.find(x=>x.category==='Fingerlings').amount),10000000);
assert.equal(Number(report.feeds.find(x=>x.tank==='T1').amount),10000);
assert.equal(report.feeds.find(x=>x.tank==='T2').amount,null);
assert.equal((await as('viewer',`update public.project_costs set unit_price=1 returning *`)).length,0);
await as('editor',`update public.project_costs set quantity=19000 where id='${stock.id}' and revision=1`);
assert.equal((await as('editor',`update public.project_costs set quantity=10 where id='${stock.id}' and revision=1 returning *`)).length,0);
await as('editor',`update public.project_costs set voided=true where id='${stock.id}' and revision=2`);
assert.equal((await as('admin','select * from public.project_cost_history')).length,8);
await assert.rejects(as('editor','delete from public.project_costs'));
await assert.rejects(as('admin','delete from public.project_cost_history'));
await as('editor',`insert into public.project_costs(day,category,description,quantity,unit,unit_price,basis) select '2026-09-14','Other','Pagination test',1,'bill',1,'both' from generate_series(1,1100)`);
report=(await as('viewer',`select public.project_cost_report('2026-09-15') as r`))[0].r;
assert.equal(report.expenses.length,1103);
assert.equal(Number(report.feeds.find(x=>x.day==='2026-09-14'&&x.tank==='T1').unit_price),5000);
await as('admin',`update public.feeding_members set role='revoked' where user_id='${ids[1].id}'`);
await assert.rejects(as('editor',`select public.project_cost_report('2026-09-15')`));
await assert.rejects(as('editor',insert('Other','both',1,1)));
await assert.rejects(as('viewer',`select public.project_cost_report('2027-04-01')`));
console.log('PASS: costs approval/RLS, noncash stocking, feed purchase separation, historic rates, unknown price, revisions, void/audit protection, full report beyond 1,000 records, revocation and season bounds.');
await db.close();
