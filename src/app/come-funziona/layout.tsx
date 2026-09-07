import type { Metadata } from 'next';
import SiteNav from '@/components/SiteNav';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import { MESSAGES } from '@/lib/i18n';
import { SEO } from '@/lib/i18n-seo';
import { getRequestLocale } from '@/lib/getRequestLocale';
import { SITE_NAME, SITE_URL, absUrl, pageAlternates, OG_LOCALE } from '@/lib/seo';
import { withLocalePrefix } from '@/lib/localePath';
import './come-funziona.css';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const seo = SEO[locale].how;
  const path = withLocalePrefix('/come-funziona', locale);
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: pageAlternates('/come-funziona', locale),
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

export default async function ComeFunzionaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  const seo = SEO[locale].how;
  const faqs = MESSAGES[locale].how.faqs;
  const pageUrl = absUrl(withLocalePrefix('/come-funziona', locale));

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `${seo.title} | ${SITE_NAME}`,
        url: pageUrl,
        description: seo.description,
        inLanguage: locale,
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
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
    <div className="how-shell">
      <JsonLd data={structuredData} />
      <SiteNav showLogo />
      <main className="how-main">{children}</main>
      <Footer />
    </div>
  );
}
