"use client";
import Link from 'next/link';
import LegalShell from '@/components/LegalShell';
import { useLocale } from '@/context/LocaleContext';
import { TERMS } from '@/lib/i18n-legal';
import { WIZARDS_FAN_POLICY_URL } from '@/lib/legal';

export default function TermsPage() {
  const { locale, t } = useLocale();
  const copy = TERMS[locale];

  return (
    <LegalShell>
      <article className="legal-doc">
        <p className="legal-kicker">
          <Link href="/">{t.nav.home}</Link>
        </p>
        <h1>{copy.title}</h1>
        <p className="legal-updated">{copy.updated}</p>

        {copy.sections.map((section) => (
          <section key={section.h}>
            <h2>{section.h}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
            {section.list && (
              <ul>
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <p className="legal-policy-link">
          <a href={WIZARDS_FAN_POLICY_URL} target="_blank" rel="noopener noreferrer">
            {t.footer.wizardsPolicy}
          </a>
        </p>
      </article>
    </LegalShell>
  );
}
