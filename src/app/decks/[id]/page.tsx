import type { Metadata } from 'next';
import DeckBuilder from '@/components/DeckBuilder';
import { supabaseServer } from '@/lib/supabaseServer';
import { loadDeck } from '@/lib/decks';
import { countSection } from '@/lib/deckRules';

interface PageProps {
  params: Promise<{ id: string }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The anonymous client only ever sees public decks, so this returns null for a
 * private one and the browser loads it with the owner's session instead.
 */
async function loadPublicDeck(id: string) {
  if (!UUID_RE.test(id)) return null;
  try {
    return await loadDeck(supabaseServer, id);
  } catch (err) {
    console.error('[decks/:id] server load failed', err);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const loaded = await loadPublicDeck(id);

  if (!loaded) {
    return { title: 'Mazzo | PlayTCG.Online', robots: { index: false } };
  }

  const { meta, deck } = loaded;
  const size = countSection(deck, 'main');
  const description =
    meta.description?.slice(0, 160) ||
    `Mazzo ${meta.game_type} per il formato ${meta.format}, ${size} carte nel Main Deck.`;

  return {
    title: `${meta.name} — ${meta.format} | PlayTCG.Online`,
    description,
    openGraph: { title: meta.name, description },
  };
}

export default async function DeckPage({ params }: PageProps) {
  const { id } = await params;
  const loaded = await loadPublicDeck(id);

  return <DeckBuilder deckId={id} initialData={loaded} />;
}
