"use client";
import React from 'react';
import LocaleLink from './LocaleLink';
import { useLocale } from '@/context/LocaleContext';
import { WIZARDS_FAN_POLICY_URL } from '@/lib/legal';

const Footer: React.FC = () => {
    const { t } = useLocale();

    return (
        <footer className="site-footer">
            <div className="site-footer-links">
                <LocaleLink href="/come-funziona">{t.nav.howItWorks}</LocaleLink>
                <LocaleLink href="/about">{t.nav.about}</LocaleLink>
                <LocaleLink href="/terms">{t.footer.terms}</LocaleLink>
                <LocaleLink href="/privacy">{t.footer.privacy}</LocaleLink>
                <LocaleLink href="/cookies">{t.footer.cookies}</LocaleLink>
            </div>
            <p className="site-footer-copy">
                © {new Date().getFullYear()} PlayTCG.Online. {t.footer.rights}
            </p>
            <div className="site-footer-legal">
                <p>{t.footer.unofficial}</p>
                <p>
                    {t.footer.wizardsNotice}{' '}
                    <a
                        href={WIZARDS_FAN_POLICY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {t.footer.wizardsPolicy}
                    </a>
                    .
                </p>
                <p>{t.footer.riotDisclaimer}</p>
                <p>{t.footer.sources}</p>
            </div>
        </footer>
    );
};

export default Footer;
