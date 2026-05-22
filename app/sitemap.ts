import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://rapidconsultancy.in';

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/loan-products`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/terms-of-service`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/grievance-redressal`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/fair-practices-code`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
