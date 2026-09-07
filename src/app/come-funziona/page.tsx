import Link from 'next/link';

const FEATURES = [
  {
    title: 'Audio e video',
    body: 'Inquadra il playmat con la webcam o il telefono e resta in chiamata con gli altri giocatori. Niente client da installare: apri il browser e sei al tavolo.',
  },
  {
    title: 'Carte a portata di ricerca',
    body: 'Cerca una carta nei cataloghi e mostrala a tutti. Funziona su Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball e Riftbound.',
  },
  {
    title: 'LP, fasi e dadi',
    body: 'Punti vita, fasi del turno e tiri di dado restano visibili e sincronizzati. Meno «quanto hai di vita?» e più gioco.',
  },
  {
    title: 'Da 2 a 4 al tavolo',
    body: 'Scegli il layout a griglia o il primo piano sul giocatore attivo. Va bene per un duello o per un pod da quattro.',
  },
  {
    title: 'Di chi è il turno',
    body: 'Un indicatore di turno tiene il ritmo della partita. Quando passi, lo vedono tutti.',
  },
  {
    title: 'Mazzi per ogni gioco',
    body: 'Costruisci e condividi i mazzi con le regole del formato. Poi entri in stanza e giochi con quello che hai sul tavolo, di carta.',
  },
];

const STEPS = [
  {
    title: 'Entra',
    body: 'Registrati oppure vai come ospite. Non serve scaricare nulla.',
  },
  {
    title: 'Apri una stanza',
    body: 'Crea una custom game o unisciti con il codice. Scegli gioco, formato e numero di giocatori.',
  },
  {
    title: 'Inquadra e gioca',
    body: 'Punta la camera sul campo, sistema LP e fasi, e giocate come al tavolo vero. Le regole le applicate voi.',
  },
];

export default function ComeFunzionaPage() {
  return (
    <>
      <section className="how-hero">
        <h1>Il tavolo da gioco, da remoto.</h1>
        <p>
          PlayTCG.Online è un tavolo virtuale per TCG di carta: ti vedi, senti e tieni
          LP, fasi e carte sotto controllo, come se foste nella stessa stanza.
        </p>
        <div className="how-hero-actions">
          <a href="/?lobby=1" className="how-btn primary">
            Entra nella lobby
          </a>
          <Link href="/decks" className="how-btn ghost">
            Esplora i mazzi
          </Link>
        </div>
      </section>

      <p className="how-section-title">Cosa trovi</p>
      <section className="how-features">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="how-card">
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>

      <figure className="how-shot">
        <div className="how-shot-frame">
          Screenshot del tavolo a 4 giocatori — in arrivo dopo i primi test
        </div>
        <figcaption>
          Qui andrà l&apos;inquadratura della partita, come sul tavolo vero.
        </figcaption>
      </figure>

      <p className="how-section-title">Come si inizia</p>
      <section className="how-steps">
        {STEPS.map((step, index) => (
          <article key={step.title} className="how-step">
            <span className="how-step-num">{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </section>

      <p className="how-section-title">Domande rapide</p>
      <section className="how-faq">
        <details>
          <summary>Devo avere un account?</summary>
          <p>
            No. Puoi entrare come ospite per una partita. L&apos;account serve se vuoi
            tenere i mazzi e il profilo.
          </p>
        </details>
        <details>
          <summary>Quali giochi supportate?</summary>
          <p>
            Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball (Fusion World) e
            Riftbound. Stesso tavolo, cataloghi e regole mazzo diversi.
          </p>
        </details>
        <details>
          <summary>È un client ufficiale?</summary>
          <p>
            No. È un tavolo virtuale: le carte le avete voi, di carta, e le regole
            le applicate insieme, come su un tabletop classico.
          </p>
        </details>
      </section>

      <section className="how-cta">
        <h2>Pronto a sederti?</h2>
        <p>Apri una stanza, invita gli amici e inquadra il playmat.</p>
        <div className="how-hero-actions">
          <a href="/?lobby=1" className="how-btn primary">
            Entra nella lobby
          </a>
        </div>
      </section>

      <p className="how-note">
        PlayTCG.Online non è affiliato a Konami, Wizards of the Coast, The Pokémon
        Company, Bandai o Riot. I marchi appartengono ai rispettivi titolari.
      </p>
    </>
  );
}
