"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Top navigation for the pages outside the game.
 *
 * Deliberately not mounted in the root layout: that also wraps the match,
 * which runs full screen and cannot afford a bar stealing vertical space.
 */

interface NavLink {
    href: string;
    label: string;
    requiresAuth?: boolean;
}

const LINKS: NavLink[] = [
    { href: '/', label: 'Gioca' },
    { href: '/decks', label: 'Esplora' },
    { href: '/decks/mine', label: 'I tuoi mazzi', requiresAuth: true },
];

const SiteNav: React.FC = () => {
    const pathname = usePathname();
    const { user } = useAuth();

    const isActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

    return (
        <nav className="site-nav">
            <Link href="/" className="brand">
                <img src="/logo.png" alt="PlayTCG.Online" />
            </Link>

            <div className="nav-links">
                {LINKS.filter((link) => !link.requiresAuth || user).map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={isActive(link.href) ? 'nav-link active' : 'nav-link'}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

            <Link href="/decks/new" className="nav-cta">
                Crea un mazzo
            </Link>

            <style jsx>{`
                .site-nav {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    padding: 12px 24px;
                    background: #0d0d0d;
                    border-bottom: 1px solid #262626;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                }
                .brand {
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                }
                .brand img {
                    height: 34px;
                    width: auto;
                }
                .nav-links {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    flex: 1;
                    min-width: 0;
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                .nav-links::-webkit-scrollbar {
                    display: none;
                }
                .nav-link {
                    padding: 8px 14px;
                    border-radius: 6px;
                    color: #a3a3a3;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 500;
                    white-space: nowrap;
                    transition: background 0.15s, color 0.15s;
                }
                .nav-link:hover {
                    background: #1f1f1f;
                    color: #fff;
                }
                .nav-link.active {
                    background: #1f1f1f;
                    color: #f4c430;
                }
                .nav-cta {
                    flex-shrink: 0;
                    padding: 9px 16px;
                    border-radius: 6px;
                    background: #f4c430;
                    color: #000;
                    font-size: 14px;
                    font-weight: 700;
                    text-decoration: none;
                    white-space: nowrap;
                }
                .nav-cta:hover {
                    background: #ffd85c;
                }

                @media (max-width: 640px) {
                    .site-nav {
                        gap: 12px;
                        padding: 10px 12px;
                    }
                    .brand img {
                        height: 26px;
                    }
                    .nav-link {
                        padding: 6px 10px;
                        font-size: 13px;
                    }
                    .nav-cta {
                        padding: 8px 12px;
                        font-size: 13px;
                    }
                }
            `}</style>
        </nav>
    );
};

export default SiteNav;
