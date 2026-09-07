"use client";
import Link from 'next/link';
import { useLocale } from '@/context/LocaleContext';

export default function ComeFunzionaPage() {
  const { t } = useLocale();
  const how = t.how;

  return (
    <>
      <section className="how-hero">
        <h1>{how.title}</h1>
        <p>{how.lead}</p>
        <div className="how-pills" aria-label={how.pillsLabel}>
          <span className="how-pill">{how.pillNoApp}</span>
          <span className="how-pill">{how.pillDevices}</span>
          <span className="how-pill">{how.pillPlayers}</span>
        </div>
        <div className="how-hero-actions">
          <a href="/?lobby=1" className="how-btn primary">
            {how.enterLobby}
          </a>
          <Link href="/decks" className="how-btn ghost">
            {how.exploreDecks}
          </Link>
        </div>
      </section>

      <section className="how-highlight">
        <h2>{how.mobileTitle}</h2>
        <p>{how.mobileBody}</p>
      </section>

      <p className="how-section-title">{how.whatYouGet}</p>
      <section className="how-features">
        {how.features.map((feature) => (
          <article key={feature.title} className="how-card">
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>

      <figure className="how-shot">
        <div className="how-shot-frame">
          {how.shotPlaceholder}
        </div>
        <figcaption>{how.shotCaption}</figcaption>
      </figure>

      <p className="how-section-title">{how.howToStart}</p>
      <section className="how-steps">
        {how.steps.map((step, index) => (
          <article key={step.title} className="how-step">
            <span className="how-step-num">{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </section>

      <p className="how-section-title">{how.faq}</p>
      <section className="how-faq">
        {how.faqs.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <section className="how-cta">
        <h2>{how.ctaTitle}</h2>
        <p>{how.ctaBody}</p>
        <div className="how-hero-actions">
          <a href="/?lobby=1" className="how-btn primary">
            {how.enterLobby}
          </a>
        </div>
      </section>

      <p className="how-note">{how.legal}</p>
    </>
  );
}
