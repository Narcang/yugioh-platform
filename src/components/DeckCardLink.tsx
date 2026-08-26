import React from 'react';
import Link from 'next/link';
import { coverImageUrl } from '@/lib/decks';

/**
 * One deck in a grid. No hooks and no client state, so the same component
 * renders on the server for /decks and in the browser for /decks/mine.
 */

interface DeckCardLinkProps {
  id: string;
  name: string;
  gameType: string;
  format: string;
  isLegal: boolean;
  coverCardId: string | null;
  isPublic?: boolean;
  author?: string | null;
  cardCount?: number | null;
}

const DeckCardLink: React.FC<DeckCardLinkProps> = ({
  id,
  name,
  gameType,
  format,
  isLegal,
  coverCardId,
  isPublic,
  author,
  cardCount,
}) => (
  <Link href={`/decks/${id}`} className="deck-card">
    <div className="deck-card-cover">
      {coverCardId ? (
        <img src={coverImageUrl(gameType, coverCardId)} alt="" loading="lazy" />
      ) : (
        <span className="placeholder">🂠</span>
      )}
    </div>
    <div className="deck-card-body">
      <h3>{name}</h3>
      <div className="deck-card-meta">
        <span>{gameType}</span>
        <span>·</span>
        <span>{format}</span>
        {typeof cardCount === 'number' && (
          <>
            <span>·</span>
            <span>{cardCount} carte</span>
          </>
        )}
      </div>
      <div className="deck-card-meta">
        <span className={isLegal ? 'deck-badge legal' : 'deck-badge illegal'}>
          {isLegal ? 'Legale' : 'Non legale'}
        </span>
        {isPublic === false && <span className="deck-badge private">Privato</span>}
        {author && <span>di {author}</span>}
      </div>
    </div>
  </Link>
);

export default DeckCardLink;
