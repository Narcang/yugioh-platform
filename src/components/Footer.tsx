"use client";
import React from 'react';
import Link from 'next/link';
import { useLocale } from '@/context/LocaleContext';
import { WIZARDS_FAN_POLICY_URL } from '@/lib/legal';

const Footer: React.FC = () => {
    const { t } = useLocale();

    return (
        <footer className="site-footer">
            <div className="site-footer-links">
                <Link href="/come-funziona">{t.nav.howItWorks}</Link>
                <Link href="/terms">{t.footer.terms}</Link>
                <Link href="/privacy">{t.footer.privacy}</Link>
                <Link href="/cookies">{t.footer.cookies}</Link>
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
