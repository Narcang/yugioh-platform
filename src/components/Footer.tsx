"use client";
import React from 'react';
import Link from 'next/link';
import { useLocale } from '@/context/LocaleContext';

const Footer: React.FC = () => {
    const { t } = useLocale();

    return (
        <footer style={{
            marginTop: 'auto',
            padding: '20px',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: '#888',
            width: '100%',
        }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <Link href="/come-funziona" style={{ color: '#888', textDecoration: 'none' }}>{t.nav.howItWorks}</Link>
                <Link href="/privacy" style={{ color: '#888', textDecoration: 'none' }}>{t.footer.privacy}</Link>
                <Link href="/cookies" style={{ color: '#888', textDecoration: 'none' }}>{t.footer.cookies}</Link>
            </div>
            <div>
                © {new Date().getFullYear()} PlayTCG.Online. {t.footer.rights}
            </div>
        </footer>
    );
};

export default Footer;
