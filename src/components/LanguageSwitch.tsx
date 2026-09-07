"use client";
import React, { useEffect, useRef, useState } from 'react';
import { LOCALES, LOCALE_META, Locale } from '@/lib/i18n';
import { useLocale } from '@/context/LocaleContext';

const Flag: React.FC<{ locale: Locale }> = ({ locale }) => {
    if (locale === 'it') {
        return (
            <svg viewBox="0 0 3 2" width="22" height="15" aria-hidden="true">
                <rect width="1" height="2" fill="#009246" />
                <rect x="1" width="1" height="2" fill="#fff" />
                <rect x="2" width="1" height="2" fill="#ce2b37" />
            </svg>
        );
    }
    if (locale === 'en') {
        return (
            <svg viewBox="0 0 60 30" width="22" height="15" aria-hidden="true">
                <rect width="60" height="30" fill="#012169" />
                <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
                <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
                <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 3 2" width="22" height="15" aria-hidden="true">
            <rect width="3" height="2" fill="#c60b1e" />
            <rect y="0.5" width="3" height="1" fill="#ffc400" />
        </svg>
    );
};

const LanguageSwitch: React.FC = () => {
    const { locale, setLocale, t } = useLocale();
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (event: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [open]);

    return (
        <div className="lang-switch" ref={wrapRef}>
            <button
                type="button"
                className="lang-switch-btn"
                aria-label={t.nav.language}
                aria-haspopup="listbox"
                aria-expanded={open}
                title={t.nav.language}
                onClick={() => setOpen((value) => !value)}
            >
                <Flag locale={locale} />
            </button>
            {open && (
                <ul className="lang-switch-menu" role="listbox">
                    {LOCALES.map((code) => (
                        <li key={code}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={code === locale}
                                className={code === locale ? 'active' : undefined}
                                onClick={() => {
                                    setLocale(code);
                                    setOpen(false);
                                }}
                            >
                                <Flag locale={code} />
                                <span>{LOCALE_META[code].label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LanguageSwitch;
