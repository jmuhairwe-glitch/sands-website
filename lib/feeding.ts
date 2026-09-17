export const TANKS = ['T1','T2','T3','T4','T5','T6','L1','L2','L3','R1'] as const;
export const SEASON_START = '2026-09-14';
export type Role = 'pending' | 'viewer' | 'editor' | 'admin' | 'revoked';
export type Member = { user_id: string; email: string; display_name: string; role: Role; created_at: string };
export type Entry = { day: string; tank: string; kg: number; feed_name: string; unit_price: number | null; notes: string; revision: number; updated_at: string; updated_by: string };
export function kampalaToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function daysBetween(start: string, end: string) {
  const result: string[] = [];
  for (let n = Date.parse(start + 'T00:00:00Z'); n <= Date.parse(end + 'T00:00:00Z') && result.length < 32; n += 86400000) result.push(new Date(n).toISOString().slice(0, 10));
  return result;
}
export function kg(value: number) { return Number(value).toLocaleString('en-UG', { minimumFractionDigits: 3, maximumFractionDigits: 3 }); }
export function canView(role?: Role) { return role === 'viewer' || role === 'editor' || role === 'admin'; }
