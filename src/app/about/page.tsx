"use client";
import { useState } from 'react';
import LocaleLink from '@/components/LocaleLink';
import { useLocale } from '@/context/LocaleContext';
import { ABOUT } from '@/lib/i18n-about';
import {
  ARTEMATICA_HERITAGE_URL,
  ARTEMATICA_LOGO,
  BE2BIT_LOGO,
  BE2BIT_URL,
  BE2BIT_WORKS_URL,
} from '@/lib/about';

function BrandMark({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span className="about-wordmark">{name}</span>;
  }
  return (
    <img
      src={src}
      alt={name}
      className="about-logo"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function AboutPage() {
  const { locale } = useLocale();
  const t = ABOUT[locale];

  return (
    <>
      <section className="about-hero">
        <p className="about-kicker">{t.kicker}</p>
        <h1 className="about-tagline">{t.tagline}</h1>
        <p className="about-lead">{t.lead}</p>
      </section>

      <p className="about-section-title">{t.fromTitle}</p>
      <ol className="about-timeline">
        <li className="about-era">
          <span className="about-year">{t.year1996}</span>
          <h3>{t.era1996Title}</h3>
          <p>{t.era1996Body}</p>
          <span className="about-arrow" aria-hidden="true" />
        </li>
        <li className="about-era">
          <span className="about-year">{t.year2013}</span>
          <h3>{t.era2013Title}</h3>
          <p>{t.era2013Body}</p>
          <span className="about-arrow" aria-hidden="true" />
        </li>
        <li className="about-era">
          <span className="about-year">{t.year2026}</span>
          <h3>{t.era2026Title}</h3>
          <p>{t.era2026Body}</p>
        </li>
      </ol>

      <section className="about-thread" id="heritage">
        <h2>{t.threadTitle}</h2>
        <p>{t.threadBody}</p>
      </section>

      <p className="about-section-title">{t.studioKicker}</p>
      <section className="about-studios">
        <article className="about-studio">
          <p className="about-studio-role">{t.be2bitRole}</p>
          <div className="about-mark">
            <BrandMark src={BE2BIT_LOGO} name="Be2Bit" />
          </div>
          <p>{t.be2bitBody}</p>
          <div className="about-studio-links">
            <a href={BE2BIT_URL} target="_blank" rel="noopener noreferrer">
              {t.discoverBe2bit}
            </a>
            <a href={BE2BIT_WORKS_URL} target="_blank" rel="noopener noreferrer">
              {t.seeWorks}
            </a>
          </div>
        </article>
        <article className="about-studio">
          <p className="about-studio-role">{t.artematicaRole}</p>
          <div className="about-mark">
            <BrandMark src={ARTEMATICA_LOGO} name="Artematica" />
          </div>
          <p>{t.artematicaBody}</p>
          <a href={ARTEMATICA_HERITAGE_URL} target="_blank" rel="noopener noreferrer">
            {t.discoverHeritage}
          </a>
        </article>
      </section>

      <section className="about-cta">
        <h2>{t.closeTitle}</h2>
        <p>{t.closeBody}</p>
        <LocaleLink href="/?lobby=1" className="about-cta-link">
          {t.enterLobby}
        </LocaleLink>
      </section>
    </>
  );
}
