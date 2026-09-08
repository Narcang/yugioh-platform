"use client";
import LocaleLink from '@/components/LocaleLink';
import LegalShell from '@/components/LegalShell';
import { useLocale } from '@/context/LocaleContext';
import {
    BE2BIT_CONTACTS_URL,
    BE2BIT_LEGAL_NAME,
    BE2BIT_SEAT,
    BE2BIT_URL,
    BE2BIT_VAT,
} from '@/lib/about';
import { PRIVACY } from '@/lib/i18n-policies';

export default function PrivacyPolicy() {
    const { locale, t } = useLocale();
    const copy = PRIVACY[locale];

    return (
        <LegalShell>
            <article className="legal-doc">
                <p className="legal-kicker">
                    <LocaleLink href="/">{t.nav.home}</LocaleLink>
                </p>
                <h1>{copy.title}</h1>
                <p className="legal-updated">{copy.updated}</p>

                {copy.sections.slice(0, 1).map((section) => (
                    <section key={section.h}>
                        <h2>{section.h}</h2>
                        {section.paragraphs.map((paragraph) => (
                            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                        ))}
                    </section>
                ))}

                <section>
                    <h2>{copy.controllerH}</h2>
                    <p>
                        {copy.controllerIntro}
                        <br />
                        <strong>{BE2BIT_LEGAL_NAME}</strong>
                        <br />
                        {BE2BIT_SEAT}
                        <br />
                        VAT {BE2BIT_VAT}
                    </p>
                    <p>
                        {copy.websiteLabel}:{' '}
                        <a href={BE2BIT_URL} target="_blank" rel="noopener noreferrer">
                            be2bit.com
                        </a>
                        <br />
                        {copy.contactsLabel}:{' '}
                        <a href={BE2BIT_CONTACTS_URL} target="_blank" rel="noopener noreferrer">
                            be2bit.com/contatti
                        </a>
                    </p>
                </section>

                {copy.sections.slice(1).map((section) => (
                    <section key={section.h} id={section.id}>
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
            </article>
        </LegalShell>
    );
}
