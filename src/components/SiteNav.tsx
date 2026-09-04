"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';

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
     * Landing page and lobby already show the big centred logo, so the header
     * only brands itself on the deck pages, which have no other logo.
     */
    showLogo?: boolean;
    /**
     * The lobby header already carries the profile menu, with admin panel and
     * settings inside it, so the header does not repeat the control there.
     */
    showAccount?: boolean;
}

const LINKS = [
    { href: '/decks', label: 'Esplora' },
    { href: '/decks/mine', label: 'I tuoi deck', requiresAuth: true },
];

const SiteNav: React.FC<SiteNavProps> = ({ showLogo = false, showAccount = true }) => {
    const pathname = usePathname();
    const { user, profile } = useAuth();
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(`${href}/`);

    const initials =
        profile?.username?.substring(0, 2).toUpperCase() ??
        user?.email?.substring(0, 2).toUpperCase() ??
        '··';

    return (
        <nav className="site-nav">
            <div className="site-nav-inner">
                {showLogo && (
                    <Link href="/" className="site-nav-brand" aria-label="Torna al portale">
                        <img src="/logo.png?v=2" alt="PlayTCG.Online" />
                    </Link>
                )}

                <div className="site-nav-links">
                    {LINKS.filter((link) => !link.requiresAuth || user).map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={isActive(link.href) ? 'site-nav-link active' : 'site-nav-link'}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="site-nav-actions">
                    <Link href="/decks/new" className="site-nav-cta">Crea un mazzo</Link>

                    {showAccount && (user ? (
                        <Link href="/" className="site-nav-account" title={profile?.username ?? user.email ?? 'Profilo'}>
                            {profile?.avatar_url
                                ? <img src={profile.avatar_url} alt="" />
                                : <span>{initials}</span>}
                        </Link>
                    ) : (
                        <button className="site-nav-login" onClick={() => setIsAuthOpen(true)}>
                            Accedi
                        </button>
                    ))}
                </div>
            </div>

            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        </nav>
    );
};

export default SiteNav;
