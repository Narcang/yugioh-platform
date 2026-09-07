import type { Metadata } from 'next';
import { LOCALES, Locale } from './i18n';
import { withLocalePrefix } from './localePath';

export const SITE_URL = 'https://playtcg.online';
export const SITE_NAME = 'PlayTCG.Online';

export const OG_LOCALE: Record<Locale, string> = {
    it: 'it_IT',
    en: 'en_US',
    es: 'es_ES',
    fr: 'fr_FR',
    de: 'de_DE',
    pt: 'pt_BR',
};

export const DEFAULT_TITLE =
  'PlayTCG.Online — tavolo virtuale per TCG di carta';

export const DEFAULT_DESCRIPTION =
  'Tavolo virtuale non ufficiale per TCG di carta: video, LP, fasi, dadi e mazzi. Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball e Riftbound. Dal PC o dal telefono, nel browser.';

export const DEFAULT_KEYWORDS = [
  'PlayTCG',
  'tavolo virtuale TCG',
  'Yu-Gi-Oh online',
  'Magic the Gathering remoto',
  'Pokémon TCG webcam',
  'One Piece Card Game',
  'Dragon Ball Fusion World',
  'Riftbound',
  'deck builder TCG',
  'giocare TCG a distanza',
];

export function absUrl(path = '/'): string {
  if (path.startsWith('http')) return path;
  return new URL(path, SITE_URL).toString();
}

/** hreflang map for a path without locale prefix (`/` or `/come-funziona`). */
export function languageAlternates(unprefixedPath: string): NonNullable<Metadata['alternates']>['languages'] {
  const languages: Record<string, string> = {
    'x-default': absUrl(unprefixedPath),
  };
  for (const locale of LOCALES) {
    languages[locale] = absUrl(withLocalePrefix(unprefixedPath, locale));
  }
  return languages;
}

export function pageAlternates(unprefixedPath: string, locale: Locale): Metadata['alternates'] {
  return {
    canonical: absUrl(withLocalePrefix(unprefixedPath, locale)),
    languages: languageAlternates(unprefixedPath),
  };
}
