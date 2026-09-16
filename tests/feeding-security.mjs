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
await assert.rejects(as('anon','select * from public.feeding_entries'));
assert.equal((await as('pending','select * from public.feeding_entries')).length,0);
await assert.rejects(as('viewer',`insert into public.feeding_entries(day,tank,kg) values ('2026-09-14','T1',1)`));
await assert.rejects(as('pending',`update public.feeding_members set role='admin' where user_id='${ids[3].id}' returning *`).then(rows=>{ if(!rows.length)throw new Error('denied'); }));
await assert.rejects(as('outsider',`insert into public.feeding_members(user_id,email,display_name,role) values ('${ids[4].id}','outsider@example.test','outsider','admin')`));
await as('outsider',`insert into public.feeding_members(user_id,email,display_name) values ('${ids[4].id}','outsider@example.test','outsider')`);
assert.equal((await as('outsider','select * from public.feeding_members')).length,1);
await as('editor',`insert into public.feeding_entries(day,tank,kg) values ('2026-09-14','T1',0.250),('2026-09-14','R1',0)`);
const seen=await as('viewer','select * from public.feeding_entries order by tank');
assert.equal(seen.length,2); assert.equal(Number(seen[0].kg),0); assert.equal(seen[1].updated_by,ids[1].id);
assert.equal((await as('viewer',`update public.feeding_entries set kg=9 where tank='T1' returning *`)).length,0);
await assert.rejects(as('editor',`insert into public.feeding_entries(day,tank,kg) values ('2026-09-14','L',1)`));
await assert.rejects(as('editor',`insert into public.feeding_entries(day,tank,kg) values ('2026-09-14','L1',-1)`));
await assert.rejects(as('editor',`insert into public.feeding_entries(day,tank,kg) values ('2026-09-14','L1','NaN')`));
await assert.rejects(as('editor',`insert into public.feeding_entries(day,tank,kg) values ('2026-09-13','L1',1)`));
await assert.rejects(as('editor',`insert into public.feeding_entries(day,tank,kg) values ('2099-09-14','L1',1)`));
await as('editor',`update public.feeding_entries set kg=0.500 where tank='T1' and revision=1`);
assert.equal((await as('editor',`update public.feeding_entries set kg=0.750 where tank='T1' and revision=1 returning *`)).length,0);
await assert.rejects(as('editor',`update public.feeding_entries set updated_by='${ids[0].id}'`));
await assert.rejects(as('admin',`delete from public.feeding_history`));
assert.equal((await as('admin','select * from public.feeding_history')).length,3);
assert.equal((await as('viewer','select * from public.feeding_history')).length,0);
assert.equal((await as('editor',`update public.feeding_members set role='admin' where user_id='${ids[2].id}' returning *`)).length,0);
await as('admin',`update public.feeding_members set role='viewer' where user_id='${ids[3].id}'`);
assert.equal((await as('pending','select * from public.feeding_entries')).length,2);
await as('admin',`update public.feeding_members set role='revoked' where user_id='${ids[1].id}'`);
assert.equal((await as('editor','select * from public.feeding_entries')).length,0);
await assert.rejects(as('editor',`insert into public.feeding_entries(day,tank,kg) values ('2026-09-14','T2',1)`));
assert.equal((await as('admin',`update public.feeding_members set role='revoked' where user_id='${ids[0].id}' returning *`)).length,0);
await assert.rejects(as('admin',`update public.feeding_members set role='admin' where user_id='${ids[2].id}'`));
console.log('PASS: anonymous and pending privacy; viewer read-only; self-promotion blocked; admin approvals; immediate revocation; zero vs missing; invalid tanks/dates/amounts; stale-update conflict; protected owner and audit history.');
await db.close();
