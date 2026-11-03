import type { MetadataRoute } from "next";
import { servicePages } from '../lib/service-pages';
import { siteUrl } from '../lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  // Only include public, indexable pages. Feeding and costs are internal tools.
  return [
    { url: `${siteUrl}/` },
    ...servicePages.map(page => ({ url: `${siteUrl}/${page.slug}` })),
    { url: `${siteUrl}/enquire` },
    { url: `${siteUrl}/finance` },
  ];
}
