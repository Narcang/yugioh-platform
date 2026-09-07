import { headers } from 'next/headers';
import { isLocale, Locale } from './i18n';
import { DEFAULT_LOCALE, LOCALE_HEADER } from './localePath';

export async function getRequestLocale(): Promise<Locale> {
    const value = (await headers()).get(LOCALE_HEADER);
    return isLocale(value) ? value : DEFAULT_LOCALE;
}
