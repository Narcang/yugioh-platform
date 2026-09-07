"use client";
import React from 'react';
import SiteNav from './SiteNav';
import Footer from './Footer';

const LegalShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="legal-shell">
        <SiteNav showLogo />
        <main className="legal-main">{children}</main>
        <Footer />
    </div>
);

export default LegalShell;
