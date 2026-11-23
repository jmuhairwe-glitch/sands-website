'use client';

import { useEffect, useState } from 'react';

function upcomingSaturdays() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7));
  next.setUTCDate(next.getUTCDate() + (6 - next.getUTCDay() + 7) % 7);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 7);
  return Array.from({ length: 4 }, (_, week) => {
    const date = new Date(next.getTime() + week * 7 * 86400000);
    return { value: date.toISOString().slice(0, 10), label: date.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric', timeZone:'Africa/Kampala' }) };
  });
}

export default function SaturdayTraining() {
  const [dates, setDates] = useState<ReturnType<typeof upcomingSaturdays>>([]);
  useEffect(() => { const refresh = () => setDates(upcomingSaturdays()); refresh(); window.addEventListener('focus', refresh); return () => window.removeEventListener('focus', refresh); }, []);
  return <section id="saturday-training"><h2>Saturday practical at SANDS Fish Farm</h2>
    <p>Join us in Kanyanya every Saturday at 10:00 a.m. Kampala time. Each session has space for 20 people. One place costs UGX 100,000. A group of 4–10 costs UGX 350,000 in total.</p>
    <p>Choose a Saturday to view your individual ticket on AHAVA. For the group rate, request a booking directly with SANDS.</p>
    <ul>{dates.map(date => <li key={date.value}><a href={'https://ahava.ug/training/sands/' + date.value}>{date.label} · View ticket on AHAVA</a></li>)}</ul>
    <a href="/enquire?topic=Training">Request another date or group training</a>
  </section>;
}
