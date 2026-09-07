"use client";
import React, { useState } from 'react';
import LocaleLink from './LocaleLink';
import { useLayout } from '@/context/LayoutContext';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';
import Footer from './Footer';
import SiteNav from './SiteNav';
import { useLocale } from '@/context/LocaleContext';
import { HOME_STORY } from '@/lib/i18n-about';

const LandingPage: React.FC = () => {
    const { setAppView } = useLayout();
    const { user } = useAuth();
    const { locale, t } = useLocale();
    const story = HOME_STORY[locale];
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // If user is already logged in, maybe redirect to Lobby?
    // For now we'll let them click "Gioca"

    return (
        <div className="landing-container">
            <SiteNav />
            <div className="landing-hero">
            <div style={{ marginBottom: '2rem' }}>
                <img
                    src="/logo.png?v=2"
                    alt="PlayTCG.Online"
                    style={{
                        maxWidth: '400px',
                        width: '100%',
                        height: 'auto'
                    }}
                />
            </div>
            <p className="landing-copy">
                {t.landing.welcome} <strong>PlayTCG.Online</strong>.
                {' '}{t.landing.copy}
            </p>

            <div className="landing-actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '300px' }}>
                {user ? (
                    <button
                        className="btn-primary"
                        style={{
                            padding: '15px',
                            fontSize: '1.1rem',
                            backgroundColor: '#3B82F6', // Blue
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontFamily: "'Cinzel', serif", // Premium font
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}
                        onClick={() => setAppView('lobby')}
                    >
                        {t.landing.enterLobby}
                    </button>
                ) : (
                    <>
                        <button
                            className="btn-primary"
                            style={{
                                padding: '15px',
                                fontSize: '1.1rem',
                                background: '#F4C430',
                                color: '#000',
                                fontWeight: 'bold',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '8px'
                            }}
                            onClick={() => setIsAuthModalOpen(true)}
                        >
                            {t.landing.loginRegister}
                        </button>
                        <button
                            className="btn-secondary"
                            style={{ padding: '15px', fontSize: '1.1rem' }}
                            onClick={() => setAppView('lobby')}
                        >
                            {t.landing.guest}
                        </button>
                    </>
                )}
            </div>
            <LocaleLink href="/come-funziona" className="landing-how-link">
                {t.landing.howItWorks}
            </LocaleLink>

                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            </div>
            <p className="landing-story">
                <strong>{story.line}</strong>
                <span>{story.byline}</span>
                <LocaleLink href="/about">{story.link} →</LocaleLink>
            </p>
            <Footer />
        </div>
    );
};

export default LandingPage;
