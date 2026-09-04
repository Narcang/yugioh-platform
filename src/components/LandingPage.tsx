"use client";
import React, { useState } from 'react';
import { useLayout } from '@/context/LayoutContext';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';
import Footer from './Footer';
import SiteNav from './SiteNav';

const LandingPage: React.FC = () => {
    const { setAppView } = useLayout();
    const { user } = useAuth();
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
                Benvenuto su <strong>PlayTCG.Online</strong>.
                Gioca online con i tuoi amici, gestisci i tuoi LP e lancia i dadi in tempo reale.
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
                        Entra nella Lobby
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
                            Accedi / Registrati
                        </button>
                        <button
                            className="btn-secondary"
                            style={{ padding: '15px', fontSize: '1.1rem' }}
                            onClick={() => setAppView('lobby')}
                        >
                            Entra come Ospite
                        </button>
                    </>
                )}
            </div>

                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            </div>
            <Footer />
        </div>
    );
};

export default LandingPage;
