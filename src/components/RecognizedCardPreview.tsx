'use client';
import Image from 'next/image';
import { useState } from 'react';
import styles from './RecognizedCardPreview.module.css';

/** Mount with key={artId} so loading/error state resets when the artwork changes. */
export default function RecognizedCardPreview({ artId, name }: { artId: string; name: string }) {
 const [loaded, setLoaded] = useState(false);
 const [failed, setFailed] = useState(false);
 const src = `/api/scanner/image/${encodeURIComponent(artId)}`;
 return <figure className={styles.figure}>
  <div className={styles.frame}>
   {!loaded && !failed && <p className={styles.message} role="status">Caricamento anteprima…</p>}
   {failed ? <p className={styles.message}>Anteprima non disponibile. La carta è stata riconosciuta.</p> :
    <a href={src} target="_blank" rel="noopener noreferrer" aria-label={`Apri l’immagine completa di ${name}`}>
     <Image src={src} alt={`Carta riconosciuta: ${name}`} width={421} height={614} unoptimized
      className={loaded ? styles.image : styles.loading} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
    </a>}
  </div>
  <figcaption>Immagine di riferimento del catalogo · tocca per ingrandire</figcaption>
 </figure>;
}
