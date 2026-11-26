create table public.hatchery_log (
 id uuid primary key, created_at timestamptz not null default clock_timestamp(),
 staff_id uuid not null default auth.uid() references auth.users(id),
 tank text not null check(tank in ('T1','T2','T3','T4','T5','T6')),
 day date not null check(day <= (now() at time zone 'Africa/Kampala')::date),
 kind text not null check(kind in ('setup','check','jar-am','jar-pm','hatch','transfer')),
 method text check(method in ('A','B','empty')), females int check(females>=0), males int check(males>=0),
 eggs int check(eggs>=0), fry int check(fry>=0), batch text not null default '' check(length(batch)<=80),
 space text not null default '' check(length(space)<=120), notes text not null default '' check(length(notes)<=600),
 temp numeric check(temp between 0 and 50), flow text check(flow in ('OK','Needs attention')),
 check(kind <> 'setup' or (method is not null and females is not null and males is not null)),
 check(method is distinct from 'empty' or (females=0 and males=0)),
 check(kind not in ('jar-am','jar-pm') or (temp is not null and flow is not null and batch<>'')),
 check(kind not in ('hatch','transfer') or (fry is not null and batch<>'')),
 check(coalesce(eggs,0)+coalesce(fry,0)=0 or batch<>'')
);
create index hatchery_by_day on public.hatchery_log(day desc,created_at desc,id);
alter table public.hatchery_log enable row level security;
revoke all on public.hatchery_log from public,anon,authenticated;
grant select on public.hatchery_log to authenticated;
grant insert(id,tank,day,kind,method,females,males,eggs,fry,batch,space,notes,temp,flow) on public.hatchery_log to authenticated;
create policy hatchery_read on public.hatchery_log for select to authenticated using ((select sands_private.feeding_role()) in ('admin','editor','viewer'));
create policy hatchery_write on public.hatchery_log for insert to authenticated with check ((select sands_private.feeding_role()) in ('admin','editor') and staff_id=(select auth.uid()));