-- Run once in a dedicated SANDS Supabase project. No changes to AHAVA.
begin;
create schema if not exists sands_private;
revoke all on schema sands_private from public, anon;
grant usage on schema sands_private to authenticated;

create table public.feeding_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null check (length(display_name) between 1 and 80),
  role text not null default 'pending' check (role in ('pending','viewer','editor','admin','revoked')),
  created_at timestamptz not null default now()
);
alter table public.feeding_members enable row level security;

-- Intentionally privileged, read-only lookup of the caller's own membership.
-- This private helper avoids recursive membership policies; it accepts no user ID.
create function sands_private.feeding_role() returns text
language sql stable security definer set search_path = '' as $$
  select m.role from public.feeding_members m
  where auth.uid() is not null and m.user_id = auth.uid()
$$;
revoke all on function sands_private.feeding_role() from public, anon;
grant execute on function sands_private.feeding_role() to authenticated;

create policy member_read on public.feeding_members for select to authenticated
using (user_id = (select auth.uid()) or (select sands_private.feeding_role()) = 'admin');
create policy member_request on public.feeding_members for insert to authenticated
with check (user_id = (select auth.uid()) and role = 'pending'
  and coalesce((select auth.jwt()->>'is_anonymous'),'false') = 'false'
  and email = (select auth.jwt()->>'email'));
create policy member_approve on public.feeding_members for update to authenticated
using ((select sands_private.feeding_role()) = 'admin' and user_id <> (select auth.uid()) and role <> 'admin')
with check (role in ('pending','viewer','editor','revoked') and user_id <> (select auth.uid()));
revoke all on public.feeding_members from anon, authenticated;
grant select on public.feeding_members to authenticated;
grant insert (user_id, email, display_name) on public.feeding_members to authenticated;
grant update (role) on public.feeding_members to authenticated;

create table public.feeding_entries (
  day date not null check (day >= date '2026-09-14'),
  tank text not null check (tank in ('T1','T2','T3','T4','T5','T6','L1','L2','L3','R1')),
  kg numeric(12,3) not null check (kg >= 0 and kg <> 'NaN'::numeric),
  notes text not null default '' check (length(notes) <= 500),
  revision integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id),
  primary key (day, tank)
);
alter table public.feeding_entries enable row level security;
create policy entry_read on public.feeding_entries for select to authenticated
using ((select sands_private.feeding_role()) in ('viewer','editor','admin'));
create policy entry_insert on public.feeding_entries for insert to authenticated
with check ((select sands_private.feeding_role()) in ('editor','admin'));
create policy entry_update on public.feeding_entries for update to authenticated
using ((select sands_private.feeding_role()) in ('editor','admin'))
with check ((select sands_private.feeding_role()) in ('editor','admin'));
revoke all on public.feeding_entries from anon, authenticated;
grant select on public.feeding_entries to authenticated;
grant insert (day,tank,kg,notes) on public.feeding_entries to authenticated;
grant update (kg,notes) on public.feeding_entries to authenticated;

create function sands_private.stamp_feeding_entry() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if new.day > (now() at time zone 'Africa/Kampala')::date then raise exception 'Cannot record future feeding'; end if;
  new.updated_by := auth.uid();
  new.updated_at := clock_timestamp();
  if tg_op = 'UPDATE' then new.revision := old.revision + 1; else new.revision := 1; end if;
  return new;
end $$;
revoke all on function sands_private.stamp_feeding_entry() from public, anon, authenticated;
create trigger stamp_feeding_entry before insert or update on public.feeding_entries
for each row execute function sands_private.stamp_feeding_entry();

-- An editor can correct a saved daily total. History cannot be changed by clients.
create table public.feeding_history (
  id bigint generated always as identity primary key,
  day date not null, tank text not null,
  old_kg numeric(12,3), new_kg numeric(12,3) not null,
  old_notes text, new_notes text not null,
  changed_by uuid not null, changed_at timestamptz not null default now()
);
alter table public.feeding_history enable row level security;
create policy history_admin on public.feeding_history for select to authenticated
using ((select sands_private.feeding_role()) = 'admin');
revoke all on public.feeding_history from anon, authenticated;
grant select on public.feeding_history to authenticated;
create function sands_private.audit_feeding_entry() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  insert into public.feeding_history(day,tank,old_kg,new_kg,old_notes,new_notes,changed_by)
  values (new.day,new.tank,case when tg_op='UPDATE' then old.kg else null end,new.kg,
    case when tg_op='UPDATE' then old.notes else null end,new.notes,auth.uid());
  return new;
end $$;
revoke all on function sands_private.audit_feeding_entry() from public, anon, authenticated;
create trigger audit_feeding_entry after insert or update on public.feeding_entries
for each row execute function sands_private.audit_feeding_entry();
commit;
