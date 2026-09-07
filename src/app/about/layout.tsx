import type { Metadata } from 'next';
import SiteNav from '@/components/SiteNav';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import { SEO } from '@/lib/i18n-seo';
import { ABOUT } from '@/lib/i18n-about';
import { getRequestLocale } from '@/lib/getRequestLocale';
import { SITE_NAME, SITE_URL, absUrl, pageAlternates, OG_LOCALE } from '@/lib/seo';
import { withLocalePrefix } from '@/lib/localePath';
import { BE2BIT_URL } from '@/lib/about';
import './about.css';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const seo = SEO[locale].about;
  const path = withLocalePrefix('/about', locale);
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: pageAlternates('/about', locale),
    openGraph: {
      title: `${seo.title} | ${SITE_NAME}`,
      description: seo.description,
      url: absUrl(path),
      locale: OG_LOCALE[locale],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${seo.title} | ${SITE_NAME}`,
      description: seo.description,
    },
  };
}

export default async function AboutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  const seo = SEO[locale].about;
  const copy = ABOUT[locale];
  const pageUrl = absUrl(withLocalePrefix('/about', locale));

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        name: `${seo.title} | ${SITE_NAME}`,
        url: pageUrl,
        description: seo.description,
        inLanguage: locale,
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
      },
      {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        parentOrganization: {
          '@type': 'Organization',
          name: 'Be2Bit',
          url: BE2BIT_URL,
        },
        description: copy.tagline,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absUrl(withLocalePrefix('/', locale)) },
          { '@type': 'ListItem', position: 2, name: seo.title, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <div className="about-shell">
      <JsonLd data={structuredData} />
      <SiteNav showLogo />
      <main className="about-main">{children}</main>
      <Footer />
    </div>
  );
}
