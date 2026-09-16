import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SANDS_SUPABASE_URL, SANDS_SUPABASE_PUBLISHABLE_KEY } from './feeding-public-config';
let client: SupabaseClient | undefined;
export function feedingClient() {
  const url = process.env.NEXT_PUBLIC_SANDS_SUPABASE_URL || SANDS_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SANDS_SUPABASE_PUBLISHABLE_KEY || SANDS_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { storageKey: 'sands-feeding-auth', flowType: 'implicit', detectSessionInUrl: true } });
  return client;
}
