import type { Metadata } from 'next';
import Link from 'next/link';
import DeckCardLink from '@/components/DeckCardLink';
import { supabaseServer } from '@/lib/supabaseServer';
import { PublicDeckSummary } from '@/lib/decks';

export const metadata: Metadata = {
  title: 'Esplora i mazzi | PlayTCG.Online',
  description:
    'Sfoglia i mazzi condivisi dalla community: lista carte, formato e controllo di legalità.',
};

// Rendered on the server and refreshed periodically so search engines see the
// deck list without running JavaScript.
export const revalidate = 60;

export default async function ExploreDecksPage() {
  const { data, error } = await supabaseServer
    .from('public_decks')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(48);

  if (error) {
    console.error('[decks] explore query failed', error);
  }

  const decks = (data ?? []) as PublicDeckSummary[];

  return (
    <>
      <header className="decks-header">
        <div>
          <h1>Esplora i mazzi</h1>
          <p>
            I mazzi che la community ha reso pubblici. Aprine uno per vedere la
            lista completa e se rispetta il formato.
          </p>
        </div>
        <Link href="/decks/new" className="deck-btn primary">Crea il tuo</Link>
      </header>

      {error ? (
        <div className="decks-error">
          Non riusciamo a leggere l&apos;elenco dei mazzi in questo momento.
          Riprova tra qualche istante.
        </div>
      ) : decks.length === 0 ? (
        <div className="decks-empty">
          <h2>Ancora nessun mazzo pubblico</h2>
          <p>Puoi essere il primo: crea un mazzo e rendilo pubblico.</p>
          <Link href="/decks/new" className="deck-btn primary">Crea un mazzo</Link>
        </div>
      ) : (
        <div className="deck-grid">
          {decks.map((deck) => (
            <DeckCardLink
              key={deck.id}
              id={deck.id}
              name={deck.name}
              gameType={deck.game_type}
              format={deck.format}
              isLegal={deck.is_legal}
              coverCardId={deck.cover_card_id}
              author={deck.owner_username}
              cardCount={deck.main_count}
            />
          ))}
        </div>
      )}
    </>
  );
}
