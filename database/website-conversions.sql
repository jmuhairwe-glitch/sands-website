create table public.whatsapp_taps (
  id uuid primary key,
  created_at timestamptz not null default now(),
  channel text not null check (channel in ('google','bing','paid','referral','direct-or-unknown')),
  landing text not null check (landing in ('/','/enquire','/finance','/catfish-fingerlings-uganda','/tilapia-fingerlings-uganda','/fish-feeds-uganda','/fish-farming-uganda','/fish-farming-training-uganda','/fish-tanks-uganda','other')),
  page text not null check (page in ('/','/enquire','/finance','/catfish-fingerlings-uganda','/tilapia-fingerlings-uganda','/fish-feeds-uganda','/fish-farming-uganda','/fish-farming-training-uganda','/fish-tanks-uganda','other')),
  enquiry_ref uuid
);
alter table public.whatsapp_taps enable row level security;
revoke all on public.whatsapp_taps from public,anon,authenticated;
grant insert (id,channel,landing,page,enquiry_ref) on public.whatsapp_taps to anon,authenticated;
create policy "Record WhatsApp taps" on public.whatsapp_taps for insert to anon,authenticated with check(true);
grant all on public.whatsapp_taps to service_role;

create table public.enquiry_outcomes (
  reference text primary key check (length(trim(reference)) between 1 and 120),
  confirmed_at timestamptz not null default now(),
  kind text not null check (kind in ('feed_sale','fingerling_sale','training_booking')),
  enquiry_id uuid references public.customer_enquiries(id),
  whatsapp_id uuid references public.whatsapp_taps(id),
  check (num_nonnulls(enquiry_id,whatsapp_id)=1)
);
alter table public.enquiry_outcomes enable row level security;
revoke all on public.enquiry_outcomes from public,anon,authenticated;
grant all on public.enquiry_outcomes to service_role;

create view public.website_conversion_report with (security_invoker=true) as
with leads as (
  select id,created_at,coalesce(details#>>'{visit,channel}','unattributed') channel,
    coalesce(details#>>'{visit,landing}','unattributed') landing
  from public.customer_enquiries where not is_test and source='website'
), events as (
  select created_at,channel,landing,'whatsapp_tap' event from public.whatsapp_taps
  union all select created_at,channel,landing,'submitted_enquiry' from leads
  union all select o.confirmed_at,coalesce(l.channel,w.channel),coalesce(l.landing,w.landing),o.kind
  from public.enquiry_outcomes o
  left join leads l on l.id=o.enquiry_id
  left join public.whatsapp_taps w on w.id=o.whatsapp_id
  where l.id is not null or w.id is not null
)
select (created_at at time zone 'Africa/Kampala')::date as day,channel,landing,event,count(*) as total
from events group by 1,2,3,4;
revoke all on public.website_conversion_report from public,anon,authenticated;
grant select on public.website_conversion_report to service_role;