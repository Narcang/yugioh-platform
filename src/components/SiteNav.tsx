"use client";
import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';
import UserAccountSettings from './UserAccountSettings';
import AdminPanel from './AdminPanel';
import LanguageSwitch from './LanguageSwitch';
import LocaleLink from './LocaleLink';
import { useLocale } from '@/context/LocaleContext';
import { stripLocalePrefix } from '@/lib/localePath';

/**
 * Slim site header.
 *
 * Deliberately not mounted in the root layout: that also wraps the match,
 * which runs full screen and cannot afford a bar stealing vertical space.
 *
 * Styles live in globals.css rather than in a <style jsx> block, because
 * styled-jsx does not add its scope class to a custom component such as Link,
 * so any rule reaching inside one silently never matches.
 */

interface SiteNavProps {
    /**
     * Landing already shows the big centred logo. Lobby and deck pages put
     * the mark in the middle of this bar instead.
     */
    showLogo?: boolean;
    /**
     * Hide the account control when a parent already renders its own.
     */
    showAccount?: boolean;
}

const SiteNav: React.FC<SiteNavProps> = ({ showLogo = false, showAccount = true }) => {
    const pathname = usePathname();
    const { user, profile, isAdmin, signOut } = useAuth();
    const { t } = useLocale();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const links = [
        { href: '/come-funziona', label: t.nav.howItWorks },
        { href: '/decks', label: t.nav.explore },
        { href: '/decks/mine', label: t.nav.myDecks, requiresAuth: true },
    ];

    const isActive = (href: string) => {
        const current = stripLocalePrefix(pathname || '/');
        return current === href || (href !== '/' && current.startsWith(`${href}/`));
    };

    const initials =
        profile?.username?.substring(0, 2).toUpperCase() ??
        user?.email?.substring(0, 2).toUpperCase() ??
        '··';

    useEffect(() => {
        if (!isMenuOpen) return;

        const onPointerDown = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [isMenuOpen]);

    return (
        <nav className="site-nav">
            <div className={`site-nav-inner${showLogo ? ' site-nav-inner--branded' : ''}`}>
                <div className="site-nav-links">
                    {links.filter((link) => !link.requiresAuth || user).map((link) => (
                        <LocaleLink
                            key={link.href}
                            href={link.href}
                            className={isActive(link.href) ? 'site-nav-link active' : 'site-nav-link'}
                        >
                            {link.label}
                        </LocaleLink>
                    ))}
                </div>

                {showLogo && (
                    <LocaleLink href="/" className="site-nav-brand" aria-label={t.nav.home}>
                        <img src="/logo.png?v=2" alt="PlayTCG.Online" />
                    </LocaleLink>
                )}

                <div className="site-nav-actions">
                    <LocaleLink href="/decks/new" className="site-nav-cta">{t.nav.createDeck}</LocaleLink>

                    {showAccount && (user ? (
                        <div className="site-nav-account-wrap" ref={menuRef}>
                            <button
                                type="button"
                                className="site-nav-account"
                                title={profile?.username ?? user.email ?? 'Profilo'}
                                aria-haspopup="menu"
                                aria-expanded={isMenuOpen}
                                onClick={() => setIsMenuOpen((open) => !open)}
                            >
                                {profile?.avatar_url
                                    ? <img src={profile.avatar_url} alt="" />
                                    : <span>{initials}</span>}
                            </button>

                            {isMenuOpen && (
                                <div className="site-nav-dropdown" role="menu">
                                    <div className="site-nav-dropdown-label">
                                        {profile?.username || user.email}
                                    </div>
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={() => {
                                                setIsAdminPanelOpen(true);
                                                setIsMenuOpen(false);
                                            }}
                                        >
                                            <span>🛡️</span> {t.nav.admin}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={() => {
                                            setIsUserSettingsOpen(true);
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        <span>⚙️</span> {t.nav.settings}
                                    </button>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className="danger"
                                        onClick={() => {
                                            signOut();
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        <span>🚪</span> {t.nav.signOut}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className="site-nav-login" onClick={() => setIsAuthOpen(true)}>
                            {t.nav.login}
                        </button>
                    ))}
                    <LanguageSwitch />
                </div>
            </div>

            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
            <UserAccountSettings isOpen={isUserSettingsOpen} onClose={() => setIsUserSettingsOpen(false)} />
            <AdminPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />
        </nav>
    );
};

export default SiteNav;
