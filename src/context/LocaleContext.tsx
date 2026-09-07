"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Locale, LOCALE_STORAGE_KEY, MESSAGES } from '@/lib/i18n';
import { LOCALE_COOKIE } from '@/lib/localePath';

interface LocaleContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: typeof MESSAGES.it;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function persistLocale(next: Locale) {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
}

export const LocaleProvider: React.FC<{ children: React.ReactNode; initialLocale: Locale }> = ({
    children,
    initialLocale,
}) => {
    const [locale, setLocaleState] = useState<Locale>(initialLocale);

    useEffect(() => {
        setLocaleState(initialLocale);
        persistLocale(initialLocale);
    }, [initialLocale]);

    const setLocale = useCallback((next: Locale) => {
        setLocaleState(next);
        persistLocale(next);
    }, []);

    const value = useMemo<LocaleContextValue>(
        () => ({ locale, setLocale, t: MESSAGES[locale] }),
        [locale, setLocale],
    );

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export function useLocale(): LocaleContextValue {
    const ctx = useContext(LocaleContext);
    if (!ctx) throw new Error('useLocale must be used inside LocaleProvider');
    return ctx;
}
