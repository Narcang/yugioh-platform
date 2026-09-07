import { Locale, isLocale } from './i18n';

export const DEFAULT_LOCALE: Locale = 'it';
export const LOCALE_HEADER = 'x-playtcg-locale';
export const LOCALE_COOKIE = 'playtcg-locale';

export function isPrefixLocale(value: string | null | undefined): value is Locale {
    return !!value && value !== DEFAULT_LOCALE && isLocale(value);
}

export function pathLocale(pathname: string): Locale {
    const first = pathname.split('/').filter(Boolean)[0];
    return isPrefixLocale(first) ? first : DEFAULT_LOCALE;
}

/** `/en/come-funziona` → `/come-funziona`; `/it/come-funziona` → `/come-funziona`; `/en` → `/` */
export function stripLocalePrefix(pathname: string): string {
    const parts = pathname.split('/');
    if (isLocale(parts[1])) {
        const rest = `/${parts.slice(2).join('/')}`;
        if (rest === '/') return '/';
        return rest.replace(/\/$/, '') || '/';
    }
    return pathname || '/';
}

/** Prefix a path for a locale. Italian has no prefix. Query and hash are kept. */
export function withLocalePrefix(href: string, locale: Locale): string {
    if (!href.startsWith('/') || href.startsWith('//')) return href;

    const hashIndex = href.indexOf('#');
    const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
    const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
    const queryIndex = withoutHash.indexOf('?');
    const query = queryIndex >= 0 ? withoutHash.slice(queryIndex) : '';
    const path = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;

    const stripped = stripLocalePrefix(path || '/');
    const prefixed =
        locale === DEFAULT_LOCALE
            ? stripped
            : stripped === '/'
              ? `/${locale}`
              : `/${locale}${stripped}`;

    return `${prefixed}${query}${hash}`;
}
