"use client";
import LocaleLink from '@/components/LocaleLink';
import LegalShell from '@/components/LegalShell';
import { useLocale } from '@/context/LocaleContext';
import { COOKIES } from '@/lib/i18n-policies';

export default function CookiePolicy() {
    const { locale, t } = useLocale();
    const copy = COOKIES[locale];

    return (
        <LegalShell>
            <article className="legal-doc">
                <p className="legal-kicker">
                    <LocaleLink href="/">{t.nav.home}</LocaleLink>
                </p>
                <h1>{copy.title}</h1>
                <p className="legal-updated">{copy.updated}</p>

                {copy.sections.map((section, index) => (
                    <section key={section.h}>
                        <h2>{section.h}</h2>
                        {section.paragraphs.map((paragraph) => (
                            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                        ))}
                        {index === 0 && (
                            <p>
                                <LocaleLink href="/privacy">{t.footer.privacy}</LocaleLink>
                            </p>
                        )}
                        {section.list && (
                            <ul>
                                {section.list.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        )}
                    </section>
                ))}
            </article>
        </LegalShell>
    );
}
