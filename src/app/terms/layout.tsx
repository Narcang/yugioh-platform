import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | PlayTCG.Online',
  description:
    'Unofficial fan tabletop for paper TCGs. Not affiliated with Konami, Wizards of the Coast, The Pokémon Company, Bandai or Riot Games.',
};

export default function TermsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
