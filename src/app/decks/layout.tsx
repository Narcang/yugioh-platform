import type { Metadata } from 'next';
import SiteNav from '@/components/SiteNav';
import './decks.css';

export const metadata: Metadata = {
  title: 'Mazzi | PlayTCG.Online',
  description:
    'Costruisci i tuoi mazzi Yu-Gi-Oh!, controlla la legalità del formato e scopri i mazzi condivisi dalla community.',
};

export default function DecksLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="decks-shell">
      <SiteNav showLogo />
      <main className="decks-main">{children}</main>
    </div>
  );
}
