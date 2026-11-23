const publicPaths = ['/', '/enquire', '/finance', '/catfish-fingerlings-uganda', '/tilapia-fingerlings-uganda', '/fish-feeds-uganda', '/fish-farming-uganda', '/fish-farming-training-uganda', '/fish-tanks-uganda'];
export function publicPath() {
  const path = location.pathname.replace(/\/$/, '') || '/';
  return publicPaths.includes(path) ? path : 'other';
}

type Visit = { landing: string; channel: string };
let current: Visit | undefined;
export function visitSource(): Visit {
  if (current) return current;
  try {
    const saved = sessionStorage.getItem('sands-visit-v1');
    if (saved) {
      const previous = JSON.parse(saved);
      if (typeof previous?.channel === 'string' && typeof previous?.landing === 'string') return current = previous;
    }
  } catch {}
  let host = '';
  try { host = new URL(document.referrer).hostname; } catch {}
  const params = new URLSearchParams(location.search);
  const paid = params.has('gclid') || params.has('msclkid') || /^(cpc|ppc|paid.*)$/i.test(params.get('utm_medium') || '');
  const google = /^(www\.)?google\.(com|co\.ug|co\.uk|[a-z]{2})$/.test(host);
  const channel = paid ? 'paid' : google ? 'google' : /^(www\.)?bing\.com$/.test(host) ? 'bing' :
    host && host !== location.hostname ? 'referral' : 'direct-or-unknown';
  current = { landing: publicPath(), channel };
  try { sessionStorage.setItem('sands-visit-v1', JSON.stringify(current)); } catch {}
  return current;
}
