import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // Allow crawling so Google can also read the internal pages' noindex tags.
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://sands.co.ug/sitemap.xml",
  };
}
