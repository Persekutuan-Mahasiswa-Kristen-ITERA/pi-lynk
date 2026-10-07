import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const releaseDate = new Date('2026-10-07T00:00:00.000Z');

  return [
    {
      url: BASE_URL,
      lastModified: releaseDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/ketentuan`,
      lastModified: releaseDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/laporkan`,
      lastModified: releaseDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
