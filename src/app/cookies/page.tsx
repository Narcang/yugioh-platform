import React from 'react';
import LegalShell from '@/components/LegalShell';

export default function CookiePolicy() {
    return (
        <LegalShell>
            <article className="legal-doc">
                <h1>Cookie Policy - PlayTCG.Online</h1>
                <p className="legal-updated">Ultimo aggiornamento: 23 Marzo 2026</p>

                <h2>Cosa sono i cookie?</h2>
                <p>
                    I cookie sono piccoli file di testo che i siti visitati inviano al terminale dell&apos;utente, dove vengono memorizzati, per poi essere ritrasmessi agli stessi siti alla visita successiva.
                </p>

                <h2>Quali cookie utilizziamo?</h2>
                <p>
                    PlayTCG.Online utilizza esclusivamente <strong>cookie tecnici e strettamente necessari</strong> al funzionamento della piattaforma. Non utilizziamo cookie di profilazione o tracciamento pubblicitario di terze parti.
                </p>
                <ul>
                    <li><strong>Autenticazione:</strong> Utilizzati per mantenere la sessione utente attiva e sicura tra le pagine.</li>
                    <li><strong>Preferenze:</strong> Per memorizzare le impostazioni visive o di gioco salvate localmente sul dispositivo dell&apos;utente.</li>
                </ul>

                <h2>Gestione dei cookie</h2>
                <p>
                    Puoi impostare il tuo browser per rifiutare tutti i cookie o per indicare quando un cookie viene inviato. Tuttavia, alcune funzionalità del nostro servizio (come il login) potrebbero non funzionare correttamente senza i cookie tecnici abilitati.
                </p>
            </article>
        </LegalShell>
    );
}
