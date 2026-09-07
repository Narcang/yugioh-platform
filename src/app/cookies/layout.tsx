import type { Metadata } from 'next';
import { SEO } from '@/lib/i18n-seo';
import { getRequestLocale } from '@/lib/getRequestLocale';
import { SITE_NAME, pageAlternates } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const seo = SEO[locale].cookies;
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: pageAlternates('/cookies', locale),
    twitter: {
      card: 'summary',
      title: `${seo.title} | ${SITE_NAME}`,
      description: seo.description,
    },
  };
}

export default function CookiesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
