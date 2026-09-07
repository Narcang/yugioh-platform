import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import "./globals.css";
import { MediaProvider } from "@/context/MediaContext";
import { LayoutProvider } from "@/context/LayoutContext";
import { AuthProvider } from "@/context/AuthContext";
import { LocaleProvider } from "@/context/LocaleContext";
import JsonLd from "@/components/JsonLd";
import { SEO } from "@/lib/i18n-seo";
import { getRequestLocale } from "@/lib/getRequestLocale";
import {
  SITE_NAME,
  SITE_URL,
  absUrl,
  pageAlternates,
  OG_LOCALE,
} from "@/lib/seo";
import { LOCALES } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const seo = SEO[locale].home;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: seo.title,
      template: `%s | ${SITE_NAME}`,
    },
    description: seo.description,
    keywords: seo.keywords,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "games",
    alternates: pageAlternates("/", locale),
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((code) => code !== locale).map((code) => OG_LOCALE[code]),
      url: absUrl(locale === "it" ? "/" : `/${locale}`),
      siteName: SITE_NAME,
      title: seo.title,
      description: seo.description,
      images: [
        {
          url: "/landing-bg.jpg",
          width: 1200,
          height: 630,
          alt: seo.title,
        },
        { url: "/logo.png", alt: SITE_NAME },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: ["/landing-bg.jpg"],
    },
    icons: {
      icon: "/logo.png",
      apple: "/logo.png",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const seo = SEO[locale].home;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: seo.description,
        inLanguage: LOCALES,
      },
      {
        "@type": "WebApplication",
        name: SITE_NAME,
        url: SITE_URL,
        applicationCategory: "GameApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires HTML5 and WebRTC",
        inLanguage: locale,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
        },
        description: seo.description,
        image: absUrl("/logo.png"),
      },
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: absUrl("/logo.png"),
      },
    ],
  };

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable}`}>
        <JsonLd data={structuredData} />
        <AuthProvider>
          <LocaleProvider initialLocale={locale}>
            <MediaProvider>
              <LayoutProvider>
                {children}
              </LayoutProvider>
            </MediaProvider>
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
