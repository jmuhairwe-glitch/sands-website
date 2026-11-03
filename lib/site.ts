import type { Metadata } from 'next';

export const siteUrl = 'https://sands.co.ug';
export const farmAddress = 'Plot 3A, Drake Lane, Kanyanya, off Bahai Road, Kampala, Uganda';
export const whatsappUrl = (message: string) => `https://wa.me/256756188061?text=${encodeURIComponent(message)}`;
export const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`SANDS FISH FARM ${farmAddress}`)}`;

export function pageMetadata(title: string, description: string, path = '/'): Metadata {
  const url = new URL(path, siteUrl).href;
  return {
    title, description, alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', siteName: 'SANDS Fish Farm', locale: 'en_UG', images: [{ url: `${siteUrl}/sands-logo.jpeg`, alt: 'SANDS Fish Farm' }] },
    twitter: { card: 'summary', title, description, images: [`${siteUrl}/sands-logo.jpeg`] },
  };
}

export const businessData = {
  '@context': 'https://schema.org', '@type': 'LocalBusiness', '@id': `${siteUrl}/#farm`,
  name: 'SANDS Fish Farm', legalName: 'SANDS FISH FARM (U) LIMITED', url: siteUrl,
  description: 'Catfish and tilapia fingerlings, practical fish-farming training, fish feeds and tank systems in Kanyanya, Kampala, Uganda.',
  telephone: '+256772402924', email: 'james@sands.co.ug',
  logo: `${siteUrl}/sands-logo.jpeg`, image: `${siteUrl}/sands-logo.jpeg`,
  address: { '@type': 'PostalAddress', streetAddress: 'Plot 3A, Drake Lane, Kanyanya, off Bahai Road', addressLocality: 'Kampala', addressCountry: 'UG' },
  areaServed: { '@type': 'Country', name: 'Uganda' },
  contactPoint: { '@type': 'ContactPoint', telephone: '+256756188061', contactType: 'customer enquiries' },
};
