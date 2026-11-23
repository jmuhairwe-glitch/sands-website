'use client';
import { useEffect } from 'react';
import { publicPath, visitSource } from '../../lib/visit-source';
import { SANDS_SUPABASE_URL, SANDS_SUPABASE_PUBLISHABLE_KEY } from '../../lib/feeding-public-config';

export default function WhatsAppTracking() {
  useEffect(() => {
    visitSource();
    function track(event: MouseEvent) {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!link || event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
      const url = new URL(link.href);
      if (url.hostname !== 'wa.me' || !window.crypto?.randomUUID) return;
      const id = crypto.randomUUID();
      const message = (url.searchParams.get('text') || '').replace(/\nSANDS ref: [0-9a-f-]{36}$/, '');
      url.searchParams.set('text', message + '\nSANDS ref: ' + id);
      link.href = url.toString();
      void fetch(SANDS_SUPABASE_URL + '/rest/v1/whatsapp_taps', {
        method: 'POST', keepalive: true,
        headers: { apikey: SANDS_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ id, ...visitSource(), page: publicPath(), enquiry_ref: link.dataset.enquiryRef || null })
      }).catch(() => {});
    }
    document.addEventListener('click', track, true);
    document.addEventListener('auxclick', track, true);
    return () => {
      document.removeEventListener('click', track, true);
      document.removeEventListener('auxclick', track, true);
    };
  }, []);
  return null;
}
