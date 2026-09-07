import type { Metadata } from 'next';
import SiteNav from '@/components/SiteNav';
import Footer from '@/components/Footer';
import './come-funziona.css';

export const metadata: Metadata = {
  title: 'Come funziona | PlayTCG.Online',
  description:
    'Gioca ai TCG di carta da remoto: video, LP, fasi, dadi, ricerca carte e mazzi. Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball e Riftbound.',
};

export default function ComeFunzionaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="how-shell">
      <SiteNav showLogo />
      <main className="how-main">{children}</main>
      <Footer />
    </div>
  );
}
