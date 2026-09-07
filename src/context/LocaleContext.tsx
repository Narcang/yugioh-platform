"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    detectBrowserLocale,
    Locale,
    LOCALE_STORAGE_KEY,
    MESSAGES,
    readStoredLocale,
} from '@/lib/i18n';

interface LocaleContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: typeof MESSAGES.it;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocaleState] = useState<Locale>('it');

    useEffect(() => {
        const initial = readStoredLocale() ?? detectBrowserLocale();
        setLocaleState(initial);
        document.documentElement.lang = initial;
    }, []);

    const setLocale = useCallback((next: Locale) => {
        setLocaleState(next);
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
        document.documentElement.lang = next;
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
