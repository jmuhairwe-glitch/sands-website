'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { feedingClient } from '../../lib/feeding-client';
import { TANKS, SEASON_START, canView, daysBetween, kampalaToday, kg, type Entry, type Member, type Role } from '../../lib/feeding';
import styles from './feeding.module.css';

type Draft = { day: string; tank: string; kg: string; feed_name: string; unit_price: string; notes: string; revision: number };
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'Could not complete that request. Please try again.';

export default function FeedingApp() {
  const [client] = useState(feedingClient);
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState<'login'|'signup'|'reset'|'password'>('login');
  const [start, setStart] = useState(SEASON_START);
  const [end, setEnd] = useState('2026-10-14');
  const [lastLoaded, setLastLoaded] = useState('');
  const [draft, setDraft] = useState<Draft>({ day: SEASON_START, tank: 'T1', kg: '', feed_name: '', unit_price: '', notes: '', revision: 0 });
  const requestId = useRef(0);
  const [today, setToday] = useState(SEASON_START);
  const viewAllowed = canView(member?.role);
  const editAllowed = member?.role === 'editor' || member?.role === 'admin';
  const days = daysBetween(start, end);
  const validRange = start >= SEASON_START && days.length > 0 && days.length <= 31;

  useEffect(() => {
    setToday(kampalaToday());
    if (!client) { setLoading(false); return; }
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') setMode('password');
      if (!session) { requestId.current++; setMember(null); setEntries([]); setMembers([]); setLoading(false); }
    });
    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setError(sessionError.message);
      setUser(data.session?.user ?? null);
      if (!data.session) setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [client]);

  const refresh = useCallback(async () => {
    if (!client || !user) return;
    const id = ++requestId.current;
    try {
      const { data: own, error: ownError } = await client.from('feeding_members').select('*').eq('user_id', user.id).maybeSingle();
      if (ownError) throw new Error('Access could not be checked. Please try again.');
      if (id !== requestId.current) return;
      setMember(own);
      if (!own || !canView(own.role)) { setEntries([]); setMembers([]); return; }
      if (!validRange) { setEntries([]); return; }
      const [records, people] = await Promise.all([
        client.from('feeding_entries').select('*').gte('day', start).lte('day', end).order('day').order('tank').limit(1000),
        own.role === 'admin' ? client.from('feeding_members').select('*').order('created_at').limit(1000) : Promise.resolve({ data: [], error: null }),
      ]);
      if (records.error || people.error) throw new Error('Records could not be refreshed. Check your connection and try again.');
      if (id !== requestId.current) return;
      setEntries(records.data ?? []); setMembers(people.data ?? []);
      setLastLoaded(new Date().toLocaleTimeString('en-UG', { timeZone: 'Africa/Kampala', hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      if (id === requestId.current) { setError(messageOf(err)); setEntries([]); setMembers([]); setMember(null); }
    } finally { if (id === requestId.current) setLoading(false); }
  }, [client, user, start, end, validRange]);

  useEffect(() => {
    if (!user) return;
    setLoading(true); void refresh();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 30000);
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    return () => { requestId.current++; clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [user, refresh]);

  async function authSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!client) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    setBusy(true); setError(''); setNotice('');
    try {
      if (mode === 'password') {
        const result = await client.auth.updateUser({ password });
        if (result.error) throw result.error;
        setMode('login'); setNotice('Password updated.');
      } else if (mode === 'reset') {
        const result = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/feeding` });
        if (result.error) throw result.error;
        setNotice('If that email has an account, a password reset link will be sent.');
      } else if (mode === 'signup') {
        const result = await client.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/feeding` } });
        if (result.error) throw result.error;
        setNotice('Check your email to confirm your account, then sign in and request access. Registration does not give access to farm records.');
      } else {
        const result = await client.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
      }
    } catch (err) { setError(messageOf(err)); } finally { setBusy(false); }
  }

  async function requestAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!client || !user) return;
    const name = String(new FormData(event.currentTarget).get('name') ?? '').trim();
    setBusy(true); setError('');
    try {
      const { data: verified, error: verifyError } = await client.auth.getUser();
      if (verifyError || !verified.user?.email_confirmed_at) throw new Error('Confirm your email before requesting access.');
      const { error: insertError } = await client.from('feeding_members').insert({ user_id: user.id, email: verified.user.email, display_name: name });
      if (insertError && insertError.code !== '23505') throw insertError;
      await refresh();
    } catch (err) { setError(messageOf(err)); } finally { setBusy(false); }
  }

  function chooseEntry(day: string, tank: string) {
    const existing = entries.find(row => row.day === day && row.tank === tank);
    setDraft({ day, tank, kg: existing ? String(existing.kg) : '', notes: existing?.notes ?? '', feed_name: existing?.feed_name ?? '', unit_price: existing?.unit_price == null ? '' : String(existing.unit_price), revision: existing?.revision ?? 0 });
    setNotice('');
  }

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!client || !editAllowed) return;
    const amount = Number(draft.kg);
    if (!draft.kg.trim() || !Number.isFinite(amount) || amount < 0 || Math.abs(amount * 1000 - Math.round(amount * 1000)) > 0.00001) {
      setError('Enter a feed amount of zero or more, with up to three decimal places.'); return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      const price = draft.unit_price.trim() === '' ? null : Number(draft.unit_price);
      if (price !== null && (!Number.isFinite(price) || price < 0 || !draft.feed_name.trim())) throw new Error('Enter a feed name and a valid price per kg, or leave the price blank.');
      const values = { kg: amount, notes: draft.notes.trim(), feed_name: draft.feed_name.trim(), unit_price: price };
      const result = draft.revision
        ? await client.from('feeding_entries').update(values).eq('day', draft.day).eq('tank', draft.tank).eq('revision', draft.revision).select().maybeSingle()
        : await client.from('feeding_entries').insert({ ...values, day: draft.day, tank: draft.tank }).select().single();
      if (result.error?.code === '23505' || (!result.error && !result.data)) throw new Error('This record changed. Use “Load latest entry”, check the amount, then save again.');
      if (result.error) throw result.error;
      setDraft(previous => ({ ...previous, revision: result.data.revision }));
      setNotice(`Saved ${draft.tank}: ${kg(amount)} kg for ${draft.day}.`);
      await refresh();
    } catch (err) { setError(messageOf(err)); } finally { setBusy(false); }
  }

  async function changeRole(person: Member, role: Role) {
    if (!client || member?.role !== 'admin') return;
    if (role === 'revoked' && !window.confirm(`Remove feeding-record access for ${person.display_name}?`)) return;
    setBusy(true); setError('');
    try {
      const result = await client.from('feeding_members').update({ role }).eq('user_id', person.user_id).select().single();
      if (result.error) throw result.error;
      setNotice(`Access for ${person.display_name}: ${role}.`); await refresh();
    } catch (err) { setError(messageOf(err)); } finally { setBusy(false); }
  }

  async function signOut() {
    if (!client) return;
    const { error: logoutError } = await client.auth.signOut({ scope: 'local' });
    if (logoutError) { setError(logoutError.message); return; }
    requestId.current++; setUser(null); setMember(null); setEntries([]); setMembers([]); setNotice(''); setError('');
  }

  const entryMap = new Map(entries.map(row => [`${row.day}:${row.tank}`, row]));
  const total = entries.reduce((sum, row) => sum + Math.round(Number(row.kg) * 1000), 0) / 1000;
  function download() {
    const escape = (value: unknown) => {
      let text = String(value ?? '');
      if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    };
    const rows: unknown[][] = [['Date', ...TANKS, 'Recorded total kg', 'Notes']];
    for (const day of days) {
      const records = entries.filter(row => row.day === day);
      rows.push([day, ...TANKS.map(tank => entryMap.get(`${day}:${tank}`)?.kg ?? ''), records.length ? records.reduce((sum, row) => sum + Math.round(Number(row.kg)*1000),0)/1000 : '', records.filter(row => row.notes).map(row => `${row.tank}: ${row.notes}`).join('; ')]);
    }
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `SANDS-feeding-${start}-${end}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <main className={styles.app}>
    <header className={styles.header}>
      <a href="/" className={styles.brand}>SANDS <span>FISH FARM</span></a>
      <div className={styles.headerActions}><a href="/costs">Project costs</a><span className={styles.private}>Private records</span>{user && <button onClick={signOut}>Sign out</button>}</div>
    </header>
    <div className={styles.content}>
      <div className={styles.heading}><div><p className={styles.eyebrow}>PRODUCTION RECORDS</p><h1>Feeding log</h1><p>Season started 14 September 2026</p></div>{member && viewAllowed && <span className={styles.role}>{member.display_name} · {member.role}</span>}</div>
      {error && <div className={styles.error} role="alert">{error} {user && <button onClick={() => { setError(''); void refresh(); }}>Retry</button>}</div>}
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {!client ? <section className={styles.card}><h2>Private feeding records are being set up</h2><p>This section will be available once the farm’s secure records system is connected.</p><a href="/">Return to SANDS Fish Farm</a></section>
      : loading ? <p role="status">Loading your access…</p>
      : !user || mode === 'password' ? <section className={`${styles.card} ${styles.auth}`}>
        <h2>{mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : mode === 'password' ? 'Choose a new password' : 'Sign in to farm records'}</h2>
        <p>Only people approved by James can view these records. Staff editing access is approved separately.</p>
        <form onSubmit={authSubmit}>
          {mode !== 'password' && <label>Email<input name="email" type="email" required autoComplete="email" maxLength={254}/></label>}
          {mode !== 'reset' && <label>Password<input name="password" type="password" required minLength={mode === 'login' ? 1 : 12} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}/>{mode !== 'login' && <small>Use at least 12 characters.</small>}</label>}
          <button className={styles.primary} disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : mode === 'password' ? 'Save password' : 'Sign in'}</button>
        </form>
        {mode !== 'password' && <div className={styles.authLinks}><button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setNotice(''); }}>{mode === 'login' ? 'New here? Create an account' : 'Back to sign in'}</button>{mode === 'login' && <button onClick={() => setMode('reset')}>Forgot password?</button>}</div>}
      </section>
      : !member ? <section className={`${styles.card} ${styles.auth}`}><h2>Request access</h2><p>Signed in as {user.email}. James must approve your account before you can see any feeding records.</p><form onSubmit={requestAccess}><label>Your name<input name="name" required minLength={1} maxLength={80}/></label><button className={styles.primary} disabled={busy}>Request access</button></form></section>
      : !viewAllowed ? <section className={styles.card}><h2>{member.role === 'revoked' ? 'Access has been removed' : 'Waiting for approval'}</h2><p>{member.role === 'revoked' ? 'Contact James if you need access again.' : 'Your request has been received. James can approve viewing or staff editing access.'}</p><button onClick={() => void refresh()}>Check access</button></section>
      : <>
        <section className={`${styles.card} ${styles.filters}`} aria-label="Date range">
          <label>From<input type="date" min={SEASON_START} value={start} onChange={e => { setEntries([]); setStart(e.target.value); }}/></label>
          <label>To<input type="date" min={start} value={end} onChange={e => { setEntries([]); setEnd(e.target.value); }}/></label>
          <div className={styles.filterActions}><button onClick={() => { setError(''); void refresh(); }}>Refresh</button><button disabled={!validRange || !entries.length} onClick={download}>Download CSV</button><button disabled={!validRange} onClick={() => window.print()}>Print / PDF</button></div>
          <small>Choose up to 31 days. Refreshes every 30 seconds. {lastLoaded && `Last checked ${lastLoaded} EAT.`}</small>
        </section>
        {!validRange ? <p className={styles.error}>Choose a date range of 1–31 days, starting on or after 14 September 2026.</p> : <>
          <div className={styles.summary}><div><span>Recorded feed</span><strong>{entries.length ? kg(total) : '—'} <small>kg</small></strong></div><div><span>Tank-day entries</span><strong>{entries.length} <small>/ {days.length * TANKS.length}</small></strong></div><p>Blank cells mean no record.<br/>A saved zero means no feed given.</p></div>
          {editAllowed && <section className={`${styles.card} ${styles.editor}`}><h2>Record daily feed</h2><p>Enter the total given to this tank for the whole day. Saving an existing entry replaces its daily total.</p><form onSubmit={saveEntry}>
            <label>Date<input type="date" value={draft.day} min={start} max={end < today ? end : today} required onChange={e => chooseEntry(e.target.value, draft.tank)}/></label>
            <label>Tank<select value={draft.tank} onChange={e => chooseEntry(draft.day,e.target.value)}>{TANKS.map(tank => <option key={tank}>{tank}</option>)}</select></label>
            <label>Daily feed (kg)<input type="number" inputMode="decimal" min="0" max="999999999.999" step="0.001" required value={draft.kg} onChange={e => setDraft({...draft,kg:e.target.value})} placeholder="e.g. 0.250"/></label>
            <label>Feed name<input maxLength={120} value={draft.feed_name} onChange={e => setDraft({...draft,feed_name:e.target.value})} placeholder="e.g. Perla 0.5 mm"/></label><label>Price per kg (UGX)<input type="number" min="0" max="9999999999.99" step="0.01" value={draft.unit_price} onChange={e => setDraft({...draft,unit_price:e.target.value})} placeholder="Leave blank if unknown"/></label><label className={styles.notesInput}>Notes<input maxLength={500} value={draft.notes} onChange={e => setDraft({...draft,notes:e.target.value})} placeholder="Feed size, appetite or observations"/></label>
            <button className={styles.primary} disabled={busy}>{busy ? 'Saving…' : draft.revision ? 'Save corrected total' : 'Save feed'}</button>
            <button type="button" disabled={busy} onClick={async () => { if (!client) return; const r = await client.from('feeding_entries').select('*').eq('day',draft.day).eq('tank',draft.tank).maybeSingle(); if(r.error) {setError(r.error.message);return;} setDraft({...draft,kg:r.data ? String(r.data.kg) : '',notes:r.data?.notes ?? '',feed_name:r.data?.feed_name ?? '',unit_price:r.data?.unit_price == null ? '' : String(r.data.unit_price),revision:r.data?.revision ?? 0}); }}>Load latest entry</button>
          </form><small>100 g = 0.100 kg. Feed cost = daily kg × price per kg. Blank prices are flagged in Project costs. For mixed feeds, enter a weighted average price and list the mix in notes. Starting production: T1, T2, T5 and T6.</small></section>}
          <section className={styles.records}><div className={styles.tableHeading}><h2>Daily feeding chart</h2><span>{start} to {end} · kg</span></div><div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Feeding chart, scroll horizontally to see all tanks"><table>
            <thead><tr><th scope="col">Date</th>{TANKS.map(tank => <th key={tank} scope="col">{tank}</th>)}<th scope="col">Total kg</th></tr></thead>
            <tbody>{days.map(day => { const daily = entries.filter(row => row.day === day); return <tr key={day}><th scope="row">{new Date(day+'T12:00:00Z').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit',timeZone:'UTC'})}</th>{TANKS.map(tank => {const row = entryMap.get(`${day}:${tank}`); return <td key={tank}>{editAllowed && day <= today ? <button onClick={() => { chooseEntry(day,tank); document.querySelector(`.${styles.editor}`)?.scrollIntoView({behavior:'smooth',block:'center'}); }} aria-label={`Edit ${tank} on ${day}${row ? `, ${kg(row.kg)} kg` : ', unrecorded'}`} title={row?.notes}>{row ? kg(row.kg) : '—'}</button> : <span title={row?.notes}>{row ? kg(row.kg) : '—'}</span>}</td>;})}<td className={styles.total}>{daily.length ? kg(daily.reduce((sum,row)=>sum+Math.round(Number(row.kg)*1000),0)/1000) : '—'}</td></tr>;})}</tbody>
            <tfoot><tr><th scope="row">Period total</th>{TANKS.map(tank => { const tankRows = entries.filter(row=>row.tank===tank); return <td key={tank}>{tankRows.length ? kg(tankRows.reduce((sum,row)=>sum+Math.round(Number(row.kg)*1000),0)/1000) : '—'}</td>;})}<td>{entries.length ? kg(total) : '—'}</td></tr></tfoot>
          </table></div></section>
          {entries.some(row=>row.notes) && <section className={styles.card}><h2>Feeding notes</h2>{entries.filter(row=>row.notes).map(row=><p key={`${row.day}:${row.tank}`}><strong>{row.day} · {row.tank}:</strong> {row.notes}</p>)}</section>}
        </>}
        {member.role === 'admin' && <section className={`${styles.card} ${styles.access}`}><h2>People and access</h2><p>Share this page with someone you want to add. After they confirm their email and request access, approve them here. Viewers can read and download; editors can also record feed.</p>{members.map(person => <div className={styles.person} key={person.user_id}><div><strong>{person.display_name}</strong><span>{person.email}</span></div>{person.role === 'admin' ? <span className={styles.role}>Owner</span> : <label>Access<select aria-label={`Access for ${person.email}`} disabled={busy} value={person.role} onChange={e=>void changeRole(person,e.target.value as Role)}><option value="pending">Pending approval</option><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="revoked">Removed</option></select></label>}</div>)}</section>}
      </>}
    </div>
  </main>;
}
