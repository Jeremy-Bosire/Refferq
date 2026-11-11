import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const domain = process.env.DOMAIN?.trim();
  const sitemap = domain
    ? `${domain.startsWith('http') ? domain.replace(/\/$/, '') : `https://${domain}`}/sitemap.xml`
    : undefined;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/affiliate', '/api', '/login', '/register'],
    },
    ...(sitemap ? { sitemap } : {}),
  };
}
