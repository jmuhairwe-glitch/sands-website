-- Private lead records. Visitors can submit only; they cannot read or change any record.
create table if not exists public.customer_enquiries (
 id uuid primary key,
 created_at timestamptz not null default now(),
 topic text not null check (topic in ('Training','Fingerlings','Fish feeds','Tanks & recycling','Something else')),
 customer_name text not null check (length(customer_name) between 1 and 160),
 phone text not null check (phone ~ '^\+?[0-9 ()-]{7,25}$'),
 location text not null check (length(location) between 1 and 300),
 preferred_date date,
 details jsonb not null check (jsonb_typeof(details)='object' and octet_length(details::text) <= 12000),
 message text not null check (length(message) between 1 and 10000),
 source text not null default 'website' check (source in ('website','whatsapp_manual')),
 status text not null default 'new' check (status in ('new','contacted','quoted','booked','closed')),
 is_test boolean not null default false
);
create index if not exists customer_enquiries_created_at_idx on public.customer_enquiries(created_at);
alter table public.customer_enquiries enable row level security;
revoke all on public.customer_enquiries from public, anon, authenticated;
grant insert (id,topic,customer_name,phone,location,preferred_date,details,message) on public.customer_enquiries to anon, authenticated;
create policy "Visitors may submit enquiries" on public.customer_enquiries for insert to anon, authenticated with check (source='website' and status='new' and is_test=false);
grant all on public.customer_enquiries to service_role;
create table if not exists public.enquiry_report_settings (
 id boolean primary key default true check (id),
 timezone text not null default 'Africa/Kampala',
 email_recipient text,
 email_confirmed boolean not null default false,
 whatsapp_recipient text,
 whatsapp_confirmed boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.enquiry_report_settings enable row level security;
revoke all on public.enquiry_report_settings from public, anon, authenticated;
grant all on public.enquiry_report_settings to service_role;
insert into public.enquiry_report_settings(id) values(true) on conflict do nothing;
