import type { Locale } from './i18n';

export interface PolicySection {
    id?: string;
    h: string;
    paragraphs: string[];
    list?: string[];
}

export interface PrivacyCopy {
    title: string;
    updated: string;
    controllerH: string;
    controllerIntro: string;
    websiteLabel: string;
    contactsLabel: string;
    sections: PolicySection[];
}

export interface CookiesCopy {
    title: string;
    updated: string;
    sections: PolicySection[];
}

const privacyIt: PrivacyCopy = {
    title: 'Informativa sulla Privacy - PlayTCG.Online',
    updated: 'Ultimo aggiornamento: 8 settembre 2026',
    controllerH: '2. Titolare del trattamento',
    controllerIntro: 'Il titolare del trattamento dei dati personali è:',
    websiteLabel: 'Sito',
    contactsLabel: 'Contatti',
    sections: [
        {
            h: '1. Introduzione e impegno alla conformità',
            paragraphs: [
                'PlayTCG.Online (“noi”, “ci” o “nostro”) pone la protezione dei dati al centro della propria tecnologia. La presente informativa descrive come gestiamo i dati sulla piattaforma di gioco PlayTCG.Online. Dichiariamo esplicitamente che i nostri servizi sono progettati per essere pienamente conformi alle seguenti normative dell’Unione Europea: GDPR (Regolamento UE 2016/679) e Digital Services Act (DSA — Regolamento UE 2022/2065).',
            ],
        },
        {
            h: '3. Architettura “privacy-by-design”: modalità di accesso',
            paragraphs: ['Offriamo diverse modalità di accesso su PlayTCG.Online:'],
            list: [
                'Accesso come ospite: non viene richiesto alcun dato associato a un profilo persistente. I dati della sessione sono temporanei.',
                'Accesso registrato: l’utente si registra per conservare avatar e preferenze, fornendo i dati strettamente necessari all’autenticazione tramite Supabase.',
            ],
        },
        {
            h: '4. Dati di gioco e finalità del trattamento',
            paragraphs: [
                'Registriamo dati esclusivamente per finalità funzionali al servizio di gioco (Art. 6 GDPR, esecuzione di un contratto):',
            ],
            list: [
                'Impostazioni del profilo: avatar e nickname scelti dall’utente.',
                'Svolgimento partita: azioni di gioco e inviti in lobby.',
            ],
        },
        {
            h: '5. Diritti dell’utente e diritto all’oblio',
            paragraphs: [
                'In conformità agli artt. 15-22 del GDPR, l’utente può esercitare i propri diritti di accesso, rettifica, limitazione, opposizione e cancellazione (diritto all’oblio) contattando il titolare tramite la pagina contatti indicata sopra. Possiamo chiederti di confermare l’identità prima di dare seguito alla richiesta.',
            ],
        },
        {
            id: 'ai',
            h: '6. Trasparenza sull’uso di strumenti di intelligenza artificiale',
            paragraphs: [
                'PlayTCG.Online utilizza anche strumenti di intelligenza artificiale generativa a supporto della creazione, modifica, traduzione e revisione di alcuni testi e immagini del sito (ad esempio pagine informative, testi di aiuto e materiali visivi).',
                'Questi strumenti non prendono decisioni automatizzate che producono effetti giuridici o incidono in modo significativo sugli utenti. I contenuti così prodotti sono soggetti a revisione editoriale umana prima della pubblicazione.',
            ],
        },
    ],
};

const privacyEn: PrivacyCopy = {
    title: 'Privacy Policy - PlayTCG.Online',
    updated: 'Last updated: 8 September 2026',
    controllerH: '2. Data controller',
    controllerIntro: 'The controller of personal data is:',
    websiteLabel: 'Website',
    contactsLabel: 'Contact',
    sections: [
        {
            h: '1. Introduction and compliance',
            paragraphs: [
                'PlayTCG.Online (“we”, “us” or “our”) puts data protection at the core of the service. This notice describes how we handle data on the PlayTCG.Online platform. The service is designed to comply with EU GDPR (Regulation 2016/679) and the Digital Services Act (Regulation 2022/2065).',
            ],
        },
        {
            h: '3. Privacy-by-design access',
            paragraphs: ['PlayTCG.Online offers these ways to join:'],
            list: [
                'Guest access: no data tied to a lasting profile is required. Session data is temporary.',
                'Registered access: you sign up to keep an avatar and preferences, providing only what is needed for authentication via Supabase.',
            ],
        },
        {
            h: '4. Game data and purposes',
            paragraphs: [
                'We record data only as needed to run the game service (GDPR Art. 6, performance of a contract):',
            ],
            list: [
                'Profile settings: avatar and nickname you choose.',
                'Gameplay: in-match actions and lobby invites.',
            ],
        },
        {
            h: '5. Your rights, including erasure',
            paragraphs: [
                'Under GDPR Arts. 15–22 you may request access, rectification, restriction, objection and erasure (the right to be forgotten) by contacting the controller via the contact page above. We may need to confirm your identity before acting.',
            ],
        },
        {
            id: 'ai',
            h: '6. Transparency on artificial intelligence tools',
            paragraphs: [
                'PlayTCG.Online also uses generative artificial intelligence tools to help create, edit, translate and review some texts and images on the site (for example informational pages, help copy and visual materials).',
                'These tools do not take automated decisions that produce legal effects or similarly significant effects on users. Content produced this way is reviewed by a person before publication.',
            ],
        },
    ],
};

const privacyEs: PrivacyCopy = {
    title: 'Política de privacidad - PlayTCG.Online',
    updated: 'Última actualización: 8 de septiembre de 2026',
    controllerH: '2. Responsable del tratamiento',
    controllerIntro: 'El responsable del tratamiento de los datos personales es:',
    websiteLabel: 'Sitio',
    contactsLabel: 'Contacto',
    sections: [
        {
            h: '1. Introducción y cumplimiento',
            paragraphs: [
                'PlayTCG.Online (“nosotros”) sitúa la protección de datos en el centro del servicio. Esta política describe cómo tratamos los datos en la plataforma PlayTCG.Online. El servicio está pensado para cumplir el RGPD (Reglamento UE 2016/679) y el Reglamento de Servicios Digitales (UE 2022/2065).',
            ],
        },
        {
            h: '3. Acceso con privacy-by-design',
            paragraphs: ['PlayTCG.Online ofrece estas formas de acceso:'],
            list: [
                'Invitado: no se pide ningún dato ligado a un perfil persistente. Los datos de sesión son temporales.',
                'Registro: te das de alta para conservar avatar y preferencias, facilitando solo lo necesario para autenticarte con Supabase.',
            ],
        },
        {
            h: '4. Datos de juego y finalidades',
            paragraphs: [
                'Registramos datos solo para prestar el servicio de juego (art. 6 RGPD, ejecución de un contrato):',
            ],
            list: [
                'Ajustes de perfil: avatar y apodo que eliges.',
                'Partida: acciones de juego e invitaciones al lobby.',
            ],
        },
        {
            h: '5. Derechos, incluido el de supresión',
            paragraphs: [
                'Conforme a los arts. 15-22 del RGPD puedes ejercer acceso, rectificación, limitación, oposición y supresión (derecho al olvido) contactando al responsable en la página de contacto indicada arriba. Podemos pedirte que confirmes tu identidad.',
            ],
        },
        {
            id: 'ai',
            h: '6. Transparencia sobre herramientas de inteligencia artificial',
            paragraphs: [
                'PlayTCG.Online también usa herramientas de inteligencia artificial generativa para apoyar la creación, edición, traducción y revisión de algunos textos e imágenes del sitio (por ejemplo páginas informativas, textos de ayuda y materiales visuales).',
                'Estas herramientas no toman decisiones automatizadas que produzcan efectos jurídicos o afecten de forma significativa a los usuarios. Los contenidos así producidos se revisan editorialmente antes de publicarse.',
            ],
        },
    ],
};

const privacyFr: PrivacyCopy = {
    title: 'Politique de confidentialité - PlayTCG.Online',
    updated: 'Dernière mise à jour : 8 septembre 2026',
    controllerH: '2. Responsable du traitement',
    controllerIntro: 'Le responsable du traitement des données personnelles est :',
    websiteLabel: 'Site',
    contactsLabel: 'Contact',
    sections: [
        {
            h: '1. Introduction et conformité',
            paragraphs: [
                'PlayTCG.Online (« nous ») place la protection des données au cœur du service. Cette notice décrit comment nous traitons les données sur la plateforme PlayTCG.Online. Le service est conçu pour être conforme au RGPD (règlement UE 2016/679) et au Digital Services Act (règlement UE 2022/2065).',
            ],
        },
        {
            h: '3. Accès privacy-by-design',
            paragraphs: ['PlayTCG.Online propose plusieurs modes d’accès :'],
            list: [
                'Invité : aucune donnée liée à un profil persistant n’est demandée. Les données de session sont temporaires.',
                'Compte : tu t’inscris pour garder avatar et préférences, en fournissant uniquement ce qui est nécessaire à l’authentification via Supabase.',
            ],
        },
        {
            h: '4. Données de jeu et finalités',
            paragraphs: [
                'Nous enregistrons des données uniquement pour fournir le service de jeu (art. 6 RGPD, exécution d’un contrat) :',
            ],
            list: [
                'Paramètres de profil : avatar et pseudo que tu choisis.',
                'Partie : actions de jeu et invitations au lobby.',
            ],
        },
        {
            h: '5. Tes droits, y compris l’effacement',
            paragraphs: [
                'Conformément aux art. 15-22 du RGPD, tu peux exercer tes droits d’accès, de rectification, de limitation, d’opposition et d’effacement (droit à l’oubli) en contactant le responsable via la page de contact indiquée ci-dessus. Nous pouvons te demander de confirmer ton identité.',
            ],
        },
        {
            id: 'ai',
            h: '6. Transparence sur les outils d’intelligence artificielle',
            paragraphs: [
                'PlayTCG.Online utilise aussi des outils d’intelligence artificielle générative pour aider à créer, modifier, traduire et réviser certains textes et images du site (par exemple pages d’information, textes d’aide et visuels).',
                'Ces outils ne prennent pas de décisions automatisées produisant des effets juridiques ou affectant de façon similaire les utilisateurs. Les contenus ainsi produits sont relus par une personne avant publication.',
            ],
        },
    ],
};

const privacyDe: PrivacyCopy = {
    title: 'Datenschutzerklärung - PlayTCG.Online',
    updated: 'Zuletzt aktualisiert: 8. September 2026',
    controllerH: '2. Verantwortlicher',
    controllerIntro: 'Verantwortlicher für die Verarbeitung personenbezogener Daten ist:',
    websiteLabel: 'Website',
    contactsLabel: 'Kontakt',
    sections: [
        {
            h: '1. Einleitung und Compliance',
            paragraphs: [
                'PlayTCG.Online („wir“) stellt den Datenschutz in den Mittelpunkt des Dienstes. Diese Erklärung beschreibt, wie wir Daten auf der PlayTCG.Online-Plattform verarbeiten. Der Dienst ist auf die Einhaltung der DSGVO (Verordnung 2016/679) und des Digital Services Act (Verordnung 2022/2065) ausgelegt.',
            ],
        },
        {
            h: '3. Privacy-by-Design-Zugang',
            paragraphs: ['PlayTCG.Online bietet folgende Zugangsarten:'],
            list: [
                'Gastzugang: Es werden keine Daten für ein dauerhaftes Profil verlangt. Sitzungsdaten sind vorübergehend.',
                'Registrierter Zugang: Du meldest dich an, um Avatar und Einstellungen zu behalten, und gibst nur das für die Authentifizierung über Supabase Nötige an.',
            ],
        },
        {
            h: '4. Spieldaten und Zwecke',
            paragraphs: [
                'Wir speichern Daten nur, soweit sie für den Spieldienst nötig sind (Art. 6 DSGVO, Vertragserfüllung):',
            ],
            list: [
                'Profileinstellungen: Avatar und Nickname, die du wählst.',
                'Spielverlauf: Spielaktionen und Lobby-Einladungen.',
            ],
        },
        {
            h: '5. Deine Rechte, einschließlich Löschung',
            paragraphs: [
                'Nach Art. 15–22 DSGVO kannst du Auskunft, Berichtigung, Einschränkung, Widerspruch und Löschung (Recht auf Vergessenwerden) verlangen, indem du den Verantwortlichen über die oben genannte Kontaktseite erreichst. Wir können eine Identitätsprüfung verlangen.',
            ],
        },
        {
            id: 'ai',
            h: '6. Transparenz zu KI-Werkzeugen',
            paragraphs: [
                'PlayTCG.Online nutzt auch generative KI-Werkzeuge zur Erstellung, Bearbeitung, Übersetzung und Prüfung einiger Texte und Bilder auf der Seite (zum Beispiel Infoseiten, Hilfetexte und visuelle Materialien).',
                'Diese Werkzeuge treffen keine automatisierten Entscheidungen mit Rechtswirkung oder ähnlich erheblicher Wirkung für Nutzer. So erstellte Inhalte werden vor der Veröffentlichung redaktionell geprüft.',
            ],
        },
    ],
};

const privacyPt: PrivacyCopy = {
    title: 'Política de privacidade - PlayTCG.Online',
    updated: 'Última atualização: 8 de setembro de 2026',
    controllerH: '2. Controlador',
    controllerIntro: 'O controlador dos dados pessoais é:',
    websiteLabel: 'Site',
    contactsLabel: 'Contato',
    sections: [
        {
            h: '1. Introdução e conformidade',
            paragraphs: [
                'PlayTCG.Online (“nós”) coloca a proteção de dados no centro do serviço. Esta política descreve como tratamos dados na plataforma PlayTCG.Online. O serviço é pensado para cumprir o RGPD (Regulamento UE 2016/679) e o Digital Services Act (Regulamento UE 2022/2065).',
            ],
        },
        {
            h: '3. Acesso com privacy-by-design',
            paragraphs: ['O PlayTCG.Online oferece estas formas de acesso:'],
            list: [
                'Convidado: não pedimos dados ligados a um perfil persistente. Os dados da sessão são temporários.',
                'Conta: você se cadastra para guardar avatar e preferências, fornecendo só o necessário para autenticação via Supabase.',
            ],
        },
        {
            h: '4. Dados de jogo e finalidades',
            paragraphs: [
                'Registramos dados só para prestar o serviço de jogo (art. 6.º do RGPD, execução de um contrato):',
            ],
            list: [
                'Ajustes de perfil: avatar e apelido que você escolhe.',
                'Partida: ações de jogo e convites no lobby.',
            ],
        },
        {
            h: '5. Direitos, incluindo o de apagamento',
            paragraphs: [
                'Nos termos dos arts. 15 a 22 do RGPD, você pode exercer acesso, retificação, limitação, oposição e apagamento (direito ao esquecimento) contactando o controlador pela página de contato indicada acima. Podemos pedir confirmação de identidade.',
            ],
        },
        {
            id: 'ai',
            h: '6. Transparência sobre ferramentas de inteligência artificial',
            paragraphs: [
                'O PlayTCG.Online também usa ferramentas de inteligência artificial generativa para apoiar a criação, edição, tradução e revisão de alguns textos e imagens do site (por exemplo páginas informativas, textos de ajuda e materiais visuais).',
                'Essas ferramentas não tomam decisões automatizadas que produzam efeitos jurídicos ou afetem de forma significativa os usuários. Os conteúdos assim produzidos passam por revisão editorial humana antes da publicação.',
            ],
        },
    ],
};

const cookiesIt: CookiesCopy = {
    title: 'Cookie Policy - PlayTCG.Online',
    updated: 'Ultimo aggiornamento: 8 settembre 2026',
    sections: [
        {
            h: 'Titolare',
            paragraphs: [
                'Il titolare del trattamento dei dati eventualmente raccolti tramite cookie tecnici è Be2Bit Ltd (Malta, VAT MT21599411), che opera PlayTCG.Online. Per i diritti e i recapiti vedi l’Informativa sulla privacy.',
            ],
        },
        {
            h: 'Cosa sono i cookie?',
            paragraphs: [
                'I cookie sono piccoli file di testo che i siti visitati inviano al terminale dell’utente, dove vengono memorizzati, per poi essere ritrasmessi agli stessi siti alla visita successiva.',
            ],
        },
        {
            h: 'Quali cookie utilizziamo?',
            paragraphs: [
                'PlayTCG.Online utilizza esclusivamente cookie tecnici e strettamente necessari al funzionamento della piattaforma. Non utilizziamo cookie di profilazione o tracciamento pubblicitario di terze parti.',
            ],
            list: [
                'Autenticazione: per mantenere la sessione utente attiva e sicura tra le pagine.',
                'Preferenze: per memorizzare le impostazioni visive o di gioco salvate localmente sul dispositivo.',
            ],
        },
        {
            h: 'Gestione dei cookie',
            paragraphs: [
                'Puoi impostare il browser per rifiutare tutti i cookie o per indicare quando un cookie viene inviato. Alcune funzionalità del servizio (come il login) potrebbero non funzionare correttamente senza i cookie tecnici abilitati.',
            ],
        },
    ],
};

const cookiesEn: CookiesCopy = {
    title: 'Cookie Policy - PlayTCG.Online',
    updated: 'Last updated: 8 September 2026',
    sections: [
        {
            h: 'Controller',
            paragraphs: [
                'The controller of any data collected through strictly necessary cookies is Be2Bit Ltd (Malta, VAT MT21599411), which operates PlayTCG.Online. For your rights and contact details see the Privacy Policy.',
            ],
        },
        {
            h: 'What are cookies?',
            paragraphs: [
                'Cookies are small text files that sites send to your device, where they are stored and then sent back on later visits.',
            ],
        },
        {
            h: 'Which cookies we use',
            paragraphs: [
                'PlayTCG.Online uses only technical cookies that are strictly necessary for the platform to work. We do not use profiling cookies or third-party advertising trackers.',
            ],
            list: [
                'Authentication: to keep your session active and secure between pages.',
                'Preferences: to store visual or game settings locally on your device.',
            ],
        },
        {
            h: 'Managing cookies',
            paragraphs: [
                'You can set your browser to refuse all cookies or to tell you when a cookie is sent. Some features (such as login) may not work properly without technical cookies.',
            ],
        },
    ],
};

const cookiesEs: CookiesCopy = {
    title: 'Política de cookies - PlayTCG.Online',
    updated: 'Última actualización: 8 de septiembre de 2026',
    sections: [
        {
            h: 'Responsable',
            paragraphs: [
                'El responsable del tratamiento de los datos que, en su caso, se recogen con cookies técnicas es Be2Bit Ltd (Malta, VAT MT21599411), que opera PlayTCG.Online. Derechos y contacto: Política de privacidad.',
            ],
        },
        {
            h: 'Qué son las cookies',
            paragraphs: [
                'Las cookies son pequeños archivos de texto que los sitios envían al dispositivo, donde se guardan y se reenvían en visitas posteriores.',
            ],
        },
        {
            h: 'Qué cookies usamos',
            paragraphs: [
                'PlayTCG.Online usa solo cookies técnicas estrictamente necesarias para el funcionamiento. No usamos cookies de perfilado ni rastreadores publicitarios de terceros.',
            ],
            list: [
                'Autenticación: para mantener la sesión activa y segura entre páginas.',
                'Preferencias: para guardar ajustes visuales o de juego en el dispositivo.',
            ],
        },
        {
            h: 'Gestión de cookies',
            paragraphs: [
                'Puedes configurar el navegador para rechazar todas las cookies o avisar cuando se envíe una. Algunas funciones (como el inicio de sesión) pueden no funcionar sin cookies técnicas.',
            ],
        },
    ],
};

const cookiesFr: CookiesCopy = {
    title: 'Politique cookies - PlayTCG.Online',
    updated: 'Dernière mise à jour : 8 septembre 2026',
    sections: [
        {
            h: 'Responsable',
            paragraphs: [
                'Le responsable du traitement des données éventuellement collectées via des cookies techniques est Be2Bit Ltd (Malte, VAT MT21599411), qui exploite PlayTCG.Online. Droits et contact : politique de confidentialité.',
            ],
        },
        {
            h: 'Qu’est-ce qu’un cookie ?',
            paragraphs: [
                'Les cookies sont de petits fichiers texte que les sites envoient à ton appareil, où ils sont stockés puis renvoyés lors des visites suivantes.',
            ],
        },
        {
            h: 'Quels cookies nous utilisons',
            paragraphs: [
                'PlayTCG.Online n’utilise que des cookies techniques strictement nécessaires au fonctionnement. Nous n’utilisons pas de cookies de profilage ni de traceurs publicitaires tiers.',
            ],
            list: [
                'Authentification : pour garder la session active et sûre d’une page à l’autre.',
                'Préférences : pour mémoriser les réglages visuels ou de jeu sur l’appareil.',
            ],
        },
        {
            h: 'Gestion des cookies',
            paragraphs: [
                'Tu peux configurer le navigateur pour refuser tous les cookies ou signaler leur envoi. Certaines fonctions (comme la connexion) peuvent ne pas marcher sans cookies techniques.',
            ],
        },
    ],
};

const cookiesDe: CookiesCopy = {
    title: 'Cookie-Richtlinie - PlayTCG.Online',
    updated: 'Zuletzt aktualisiert: 8. September 2026',
    sections: [
        {
            h: 'Verantwortlicher',
            paragraphs: [
                'Verantwortlicher für Daten, die über technisch notwendige Cookies erhoben werden, ist Be2Bit Ltd (Malta, VAT MT21599411), Betreiber von PlayTCG.Online. Rechte und Kontakt: Datenschutzerklärung.',
            ],
        },
        {
            h: 'Was sind Cookies?',
            paragraphs: [
                'Cookies sind kleine Textdateien, die Websites an dein Gerät senden, dort speichern und bei späteren Besuchen zurücksenden.',
            ],
        },
        {
            h: 'Welche Cookies wir nutzen',
            paragraphs: [
                'PlayTCG.Online nutzt ausschließlich technisch notwendige Cookies. Wir verwenden keine Profiling-Cookies und keine Werbe-Tracker Dritter.',
            ],
            list: [
                'Authentifizierung: damit die Sitzung zwischen Seiten aktiv und sicher bleibt.',
                'Einstellungen: um visuelle oder Spieloptionen lokal auf dem Gerät zu speichern.',
            ],
        },
        {
            h: 'Cookies verwalten',
            paragraphs: [
                'Du kannst den Browser so einstellen, dass er alle Cookies ablehnt oder dich benachrichtigt. Ohne technische Cookies funktionieren manche Funktionen (etwa der Login) möglicherweise nicht.',
            ],
        },
    ],
};

const cookiesPt: CookiesCopy = {
    title: 'Política de cookies - PlayTCG.Online',
    updated: 'Última atualização: 8 de setembro de 2026',
    sections: [
        {
            h: 'Controlador',
            paragraphs: [
                'O controlador dos dados eventualmente recolhidos por cookies técnicos é a Be2Bit Ltd (Malta, VAT MT21599411), que opera o PlayTCG.Online. Direitos e contato: Política de privacidade.',
            ],
        },
        {
            h: 'O que são cookies?',
            paragraphs: [
                'Cookies são pequenos arquivos de texto que os sites enviam ao seu dispositivo, onde ficam guardados e depois são reenviados nas visitas seguintes.',
            ],
        },
        {
            h: 'Quais cookies usamos',
            paragraphs: [
                'O PlayTCG.Online usa só cookies técnicos estritamente necessários ao funcionamento. Não usamos cookies de perfilamento nem rastreadores publicitários de terceiros.',
            ],
            list: [
                'Autenticação: para manter a sessão ativa e segura entre páginas.',
                'Preferências: para guardar ajustes visuais ou de jogo no dispositivo.',
            ],
        },
        {
            h: 'Gestão de cookies',
            paragraphs: [
                'Você pode configurar o navegador para recusar todos os cookies ou avisar quando um cookie for enviado. Algumas funções (como o login) podem não funcionar sem cookies técnicos.',
            ],
        },
    ],
};

export const PRIVACY: Record<Locale, PrivacyCopy> = {
    it: privacyIt,
    en: privacyEn,
    es: privacyEs,
    fr: privacyFr,
    de: privacyDe,
    pt: privacyPt,
};

export const COOKIES: Record<Locale, CookiesCopy> = {
    it: cookiesIt,
    en: cookiesEn,
    es: cookiesEs,
    fr: cookiesFr,
    de: cookiesDe,
    pt: cookiesPt,
};
