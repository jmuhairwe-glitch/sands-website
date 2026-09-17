begin;
alter table public.feeding_entries
 add column feed_name text not null default '' check(length(feed_name)<=120),
 add column unit_price numeric(12,2) check(unit_price >= 0 and unit_price <> 'NaN'::numeric),
 add constraint priced_feed_named check(unit_price is null or length(trim(feed_name))>0);
grant insert(feed_name,unit_price), update(feed_name,unit_price) on public.feeding_entries to authenticated;

create table public.project_costs (
 id uuid primary key default gen_random_uuid(),
 day date not null check(day between date '2026-09-14' and date '2027-03-31'),
 category text not null check(category in ('Fingerlings','Feed purchase','Electricity','Labour','Transport','Treatments','Equipment','Other')),
 description text not null check(length(trim(description)) between 1 and 200),
 quantity numeric(12,3) not null check(quantity>0 and quantity <> 'NaN'::numeric),
 unit text not null check(length(trim(unit)) between 1 and 30),
 unit_price numeric(12,2) not null check(unit_price>=0 and unit_price <> 'NaN'::numeric),
 basis text not null check(basis in ('both','cash','production')),
 notes text not null default '' check(length(notes)<=500),
 voided boolean not null default false,
 revision integer not null default 1,
 updated_at timestamptz not null default now(),
 updated_by uuid not null references auth.users(id),
 check(category <> 'Feed purchase' or basis='cash')
);
alter table public.project_costs enable row level security;
create policy cost_read on public.project_costs for select to authenticated using ((select sands_private.feeding_role()) in ('viewer','editor','admin'));
create policy cost_insert on public.project_costs for insert to authenticated with check ((select sands_private.feeding_role()) in ('editor','admin'));
create policy cost_update on public.project_costs for update to authenticated using ((select sands_private.feeding_role()) in ('editor','admin')) with check ((select sands_private.feeding_role()) in ('editor','admin'));
revoke all on public.project_costs from anon, authenticated;
grant select on public.project_costs to authenticated;
grant insert(id,day,category,description,quantity,unit,unit_price,basis,notes), update(day,category,description,quantity,unit,unit_price,basis,notes,voided) on public.project_costs to authenticated;
create trigger stamp_project_cost before insert or update on public.project_costs for each row execute function sands_private.stamp_feeding_entry();

create table public.project_cost_history (
 id bigint generated always as identity primary key,
 source text not null, old_record jsonb, new_record jsonb not null,
 changed_by uuid not null, changed_at timestamptz not null default now()
);
alter table public.project_cost_history enable row level security;
create policy cost_history_owner on public.project_cost_history for select to authenticated using ((select sands_private.feeding_role())='admin');
revoke all on public.project_cost_history from anon,authenticated;
grant select on public.project_cost_history to authenticated;
create function sands_private.audit_project_cost() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 insert into public.project_cost_history(source,old_record,new_record,changed_by)
 values(tg_table_name,case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new),auth.uid());
 return new;
end $$;
revoke all on function sands_private.audit_project_cost() from public,anon,authenticated;
create trigger audit_project_cost after insert or update on public.project_costs for each row execute function sands_private.audit_project_cost();
create trigger audit_feed_cost after insert or update on public.feeding_entries for each row execute function sands_private.audit_project_cost();

-- One snapshot for the whole season; aggregates are not truncated by REST's row limit.
-- Invoker rights plus explicit membership guard: no privileged reporting endpoint.
create function public.project_cost_report(as_of date) returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null or coalesce(sands_private.feeding_role(),'') not in ('viewer','editor','admin') then raise exception 'Approved access required'; end if;
 if as_of is null or as_of < date '2026-09-14' or as_of > date '2027-03-31' then raise exception 'Choose a date within the project season'; end if;
 return jsonb_build_object(
 'expenses',coalesce((select jsonb_agg(to_jsonb(c) || jsonb_build_object('amount',round(c.quantity*c.unit_price,2)) order by c.day,c.id) from public.project_costs c where c.day<=as_of),'[]'::jsonb),
 'feeds',coalesce((select jsonb_agg(jsonb_build_object('day',f.day,'tank',f.tank,'kg',f.kg,'feed_name',f.feed_name,'unit_price',f.unit_price,'amount',case when f.unit_price is null then null else round(f.kg*f.unit_price,2) end) order by f.day,f.tank) from public.feeding_entries f where f.day between date '2026-09-14' and as_of),'[]'::jsonb));
end $$;
revoke all on function public.project_cost_report(date) from public,anon;
grant execute on function public.project_cost_report(date) to authenticated;
commit;
