import { NextRequest, NextResponse } from 'next/server';
import { isLocale, Locale } from '@/lib/i18n';
import {
    DEFAULT_LOCALE,
    LOCALE_COOKIE,
    LOCALE_HEADER,
    isPrefixLocale,
    stripLocalePrefix,
    withLocalePrefix,
} from '@/lib/localePath';

const BOT_UA =
    /googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|linkedinbot|slackbot|discordbot|applebot|semrush|ahrefs|dotbot|duckduckbot/i;

function isBot(request: NextRequest): boolean {
    return BOT_UA.test(request.headers.get('user-agent') ?? '');
}

function localeFromAcceptLanguage(header: string | null): Locale {
    if (!header) return DEFAULT_LOCALE;
    for (const part of header.split(',')) {
        const tag = part.split(';')[0]?.trim().toLowerCase();
        if (!tag) continue;
        const base = tag.split('-')[0];
        if (isLocale(base)) return base;
    }
    return DEFAULT_LOCALE;
}

function cookieLocale(request: NextRequest): Locale | null {
    const value = request.cookies.get(LOCALE_COOKIE)?.value;
    return isLocale(value) ? value : null;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const first = pathname.split('/').filter(Boolean)[0];

    if (first === DEFAULT_LOCALE) {
        const url = request.nextUrl.clone();
        url.pathname = stripLocalePrefix(pathname);
        return NextResponse.redirect(url, 308);
    }

    let locale: Locale = DEFAULT_LOCALE;
    let rewritePath: string | null = null;

    if (isPrefixLocale(first)) {
        locale = first;
        rewritePath = stripLocalePrefix(pathname);
    } else {
        const stored = cookieLocale(request);
        const detected = localeFromAcceptLanguage(request.headers.get('accept-language'));
        const preferred = stored ?? detected;
        const htmlNav =
            !isBot(request) &&
            request.headers.get('rsc') !== '1' &&
            !request.headers.get('next-router-prefetch') &&
            (request.headers.get('accept') ?? '').includes('text/html');

        if (htmlNav && preferred !== DEFAULT_LOCALE) {
            const url = request.nextUrl.clone();
            url.pathname = withLocalePrefix(pathname, preferred);
            const redirect = NextResponse.redirect(url);
            redirect.cookies.set(LOCALE_COOKIE, preferred, {
                path: '/',
                maxAge: 60 * 60 * 24 * 365,
                sameSite: 'lax',
            });
            return redirect;
        }

        locale = DEFAULT_LOCALE;
    }

    const headers = new Headers(request.headers);
    headers.set(LOCALE_HEADER, locale);

    // Do not Set-Cookie on every HTML response: it busts CDN caching and a
    // prefetch of an unprefixed path would overwrite the user's language.
    // Cookie is written on the human language redirect above, and by the
    // client when the URL locale is applied.
    return rewritePath
        ? NextResponse.rewrite(new URL(rewritePath + request.nextUrl.search, request.url), {
              request: { headers },
          })
        : NextResponse.next({ request: { headers } });
}

export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)'],
};
