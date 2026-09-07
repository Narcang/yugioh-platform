import type { MetadataRoute } from 'next';
import { supabaseServer } from '@/lib/supabaseServer';
import { absUrl, languageAlternates } from '@/lib/seo';
import { LOCALES } from '@/lib/i18n';
import { withLocalePrefix } from '@/lib/localePath';

function localizedEntry(
  unprefixedPath: string,
  extra: Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'>,
): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: absUrl(withLocalePrefix(unprefixedPath, locale)),
    alternates: { languages: languageAlternates(unprefixedPath) },
    ...extra,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    ...localizedEntry('/', { lastModified: now, changeFrequency: 'weekly', priority: 1 }),
    ...localizedEntry('/come-funziona', {
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    }),
    ...localizedEntry('/decks', { lastModified: now, changeFrequency: 'daily', priority: 0.8 }),
    ...localizedEntry('/terms', { lastModified: now, changeFrequency: 'yearly', priority: 0.4 }),
    ...localizedEntry('/privacy', { lastModified: now, changeFrequency: 'yearly', priority: 0.3 }),
    ...localizedEntry('/cookies', { lastModified: now, changeFrequency: 'yearly', priority: 0.3 }),
  ];

  try {
    const { data } = await supabaseServer
      .from('public_decks')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(500);

    for (const row of data ?? []) {
      const lastModified = row.updated_at ? new Date(row.updated_at) : now;
      pages.push(
        ...localizedEntry(`/decks/${row.id}`, {
          lastModified,
          changeFrequency: 'monthly',
          priority: 0.5,
        }),
      );
    }
  } catch (err) {
    console.error('[sitemap] public decks skipped', err);
  }

  return pages;
}
