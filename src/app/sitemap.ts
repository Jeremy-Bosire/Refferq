import type { MetadataRoute } from 'next';

function getPublicBaseUrl(): URL | null {
  const domain = process.env.DOMAIN?.trim();
  if (!domain) return null;
  try {
    return new URL(domain.startsWith('http') ? domain : `https://${domain}`);
  } catch {
    return null;
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getPublicBaseUrl();
  if (!base) return [];
  const lastModified = new Date();
  return [
    { url: new URL('/', base).toString(), lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: new URL('/en-KE', base).toString(), lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: new URL('/sw-KE', base).toString(), lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: new URL('/en-KE/how-we-make-money', base).toString(), lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: new URL('/sw-KE/how-we-make-money', base).toString(), lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: new URL('/how-we-make-money', base).toString(), lastModified, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
