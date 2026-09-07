import React from 'react';
import LegalShell from '@/components/LegalShell';

export default function PrivacyPolicy() {
    return (
        <LegalShell>
            <article className="legal-doc">
                <h1>Informativa sulla Privacy - PlayTCG.Online</h1>
                <p className="legal-updated">Ultimo aggiornamento: 23 Marzo 2026</p>

                <h2>1. Introduzione e Impegno alla Conformità</h2>
                <p>
                    PlayTCG.Online (&quot;noi&quot;, &quot;ci&quot; o &quot;nostro&quot;) pone la protezione dei dati al centro della propria tecnologia. La presente Informativa descrive come gestiamo i dati sulla piattaforma di gioco PlayTCG.Online.
                    Dichiariamo esplicitamente che i nostri servizi sono progettati per essere pienamente conformi alle seguenti normative dell&apos;Unione Europea: GDPR (Regolamento UE 2016/679) e Digital Services Act (DSA - Regolamento UE 2022/2065).
                </p>

                <h2>2. Titolare del Trattamento</h2>
                <p>
                    Il titolare del trattamento è:<br />
                    <strong>[NOME TITOLARE provvisorio]</strong><br />
                    Email: [INSERIRE EMAIL]
                </p>

                <h2>3. Architettura &quot;Privacy-by-Design&quot;: Modalità di Accesso</h2>
                <p>Offriamo diverse modalità di accesso su PlayTCG.Online:</p>
                <ul>
                    <li><strong>Accesso come Ospite:</strong> Non viene richiesto alcun dato associato ad un profilo persistente. I dati della sessione sono temporanei.</li>
                    <li><strong>Accesso Registrato:</strong> L&apos;utente si registra per conservare avatar e preferenze, fornendo i dati strettamente necessari all&apos;autenticazione tramite Supabase.</li>
                </ul>

                <h2>4. Dati di Gioco e Finalità del Trattamento</h2>
                <p>Registriamo dati esclusivamente per finalità funzionali al servizio di gioco (Art. 6 GDPR, esecuzione di un contratto):</p>
                <ul>
                    <li>Impostazioni del profilo: Avatar, Nickname scelti dall&apos;utente.</li>
                    <li>Svolgimento partita: Azioni di gioco e inviti in lobby.</li>
                </ul>

                <h2>5. Diritti dell&apos;Utente e Diritto all&apos;Oblio</h2>
                <p>
                    In conformità agli Artt. 15-22 del GDPR, l&apos;utente può esercitare i propri diritti di accesso ed eliminazione account (diritto all&apos;oblio) contattandoci direttamente all&apos;indirizzo email indicato sopra.
                </p>
            </article>
        </LegalShell>
    );
}
