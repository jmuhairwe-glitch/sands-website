import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only include public, indexable pages. Feeding and costs are internal tools.
  return [{ url: "https://sands.co.ug/" }];
}
