import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://cheetaxi.africa', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://cheetaxi.africa/#drivers', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://cheetaxi.africa/#passengers', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://cheetaxi.africa/#plans', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ];
}
