export const LOCALES = ['it', 'en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_META: Record<Locale, { label: string }> = {
    it: { label: 'Italiano' },
    en: { label: 'English' },
    es: { label: 'Español' },
};

export const LOCALE_STORAGE_KEY = 'playtcg-locale';

export function isLocale(value: string | null | undefined): value is Locale {
    return value === 'it' || value === 'en' || value === 'es';
}

/** Prefer the browser language list (es-MX → es). GPS is not used. */
export function detectBrowserLocale(): Locale {
    if (typeof navigator === 'undefined') return 'it';
    const tags = [...(navigator.languages ?? []), navigator.language].filter(Boolean);
    for (const tag of tags) {
        const base = tag.toLowerCase().split('-')[0];
        if (base === 'es' || base === 'en' || base === 'it') return base;
    }
    return 'it';
}

export function readStoredLocale(): Locale | null {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : null;
}

type Messages = typeof it;

const it = {
    nav: {
        howItWorks: 'Come funziona',
        explore: 'Esplora',
        myDecks: 'I tuoi deck',
        createDeck: 'Crea un mazzo',
        login: 'Accedi',
        home: 'Torna al portale',
        settings: 'Impostazioni',
        admin: 'Pannello Admin',
        signOut: 'Esci',
        language: 'Lingua',
    },
    footer: {
        rights: 'Tutti i diritti riservati.',
        privacy: 'Privacy Policy',
        cookies: 'Cookie Policy',
    },
    landing: {
        welcome: 'Benvenuto su',
        copy: 'Gioca online con i tuoi amici da PC o smartphone, gestisci i tuoi LP e lancia i dadi in tempo reale.',
        enterLobby: 'Entra nella Lobby',
        loginRegister: 'Accedi / Registrati',
        guest: 'Entra come Ospite',
        howItWorks: 'Come funziona',
    },
    auth: {
        login: 'Accedi',
        register: 'Registrati',
        username: 'Username',
        fullName: 'Nome completo',
        email: 'Email',
        password: 'Password',
        cancel: 'Annulla',
        enter: 'Entra',
        createAccount: 'Crea account',
        loading: 'Caricamento…',
        signupOk: 'Registrazione completata! Controlla la tua email per confermare (se richiesto).',
        error: "Errore durante l'autenticazione",
    },
    lobby: {
        matchmaking: 'Matchmaking',
        ranked: 'Partita classificata',
        rankedCopy: 'Competi per i primi posti in classifica.',
        quick: 'Partita rapida',
        quickCopy: 'Entra subito in una partita casual.',
        comingSoon: 'Prossimamente',
        customGames: 'Partite custom',
        createRoom: '+ Crea stanza',
        roomCode: 'Inserisci il codice stanza…',
        join: 'Entra',
        host: 'Host',
        gameFormat: 'Gioco e formato',
        lang: 'Lingua',
        players: 'Giocatori',
        action: 'Azione',
        full: 'Piena',
        public: 'Pubblica',
        private: 'Privata',
        roomNotFound: 'Stanza non trovata',
        roomFull: 'Questa lobby è piena!',
        loginToCreate: 'Devi effettuare il login per creare una stanza!',
        closeLobby: 'Chiudi lobby (admin)',
        passwordTitle: 'Password richiesta',
        passwordLabel: 'Inserisci la password per entrare',
        passwordWrong: 'Password non corretta!',
        confirm: 'Conferma',
        cancel: 'Annulla',
    },
    how: {
        title: 'Il tavolo da gioco, da remoto.',
        lead: 'PlayTCG.Online è un tavolo virtuale per TCG di carta: ti vedi, senti e tieni LP, fasi e carte sotto controllo, come se foste nella stessa stanza. Funziona dal computer e dallo smartphone, nel browser.',
        pillsLabel: 'In sintesi',
        pillNoApp: 'Nessuna app',
        pillDevices: 'PC e smartphone',
        pillPlayers: '2–4 giocatori',
        enterLobby: 'Entra nella lobby',
        exploreDecks: 'Esplora i mazzi',
        mobileTitle: 'Pensato anche per il telefono',
        mobileBody: 'Apri il sito dal browser, inquadra il playmat con la camera posteriore e ruota lo schermo per vedere tutto il campo. Il tavolo ha un layout dedicato per smartphone: niente app da scaricare, niente cavo verso il PC.',
        whatYouGet: 'Cosa trovi',
        howToStart: 'Come si inizia',
        faq: 'Domande rapide',
        shotPlaceholder: 'Screenshot del tavolo a 4 giocatori — in arrivo dopo i primi test',
        shotCaption: "Qui andrà l'inquadratura della partita, come sul tavolo vero.",
        ctaTitle: 'Pronto a sederti?',
        ctaBody: 'Apri una stanza dal PC o dal telefono, invita gli amici e inquadra il playmat.',
        legal: 'PlayTCG.Online non è affiliato a Konami, Wizards of the Coast, The Pokémon Company, Bandai o Riot. I marchi appartengono ai rispettivi titolari.',
        features: [
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
        ],
        steps: [
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
                body: 'Punta la camera sul campo — dal PC o dal telefono — sistema LP e fasi, e giocate come al tavolo vero. Le regole le applicate voi.',
            },
        ],
        faqs: [
            {
                q: 'Funziona dal telefono?',
                a: 'Sì. Apri playtcg.online nel browser dello smartphone: il tavolo si adatta allo schermo e usa la camera posteriore per inquadrare il playmat. Non serve un’app.',
            },
            {
                q: 'Devo avere un account?',
                a: 'No. Puoi entrare come ospite per una partita. L’account serve se vuoi tenere i mazzi e il profilo.',
            },
            {
                q: 'Quali giochi supportate?',
                a: 'Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball (Fusion World) e Riftbound. Stesso tavolo, cataloghi e regole mazzo diversi.',
            },
            {
                q: 'È un client ufficiale?',
                a: 'No. È un tavolo virtuale: le carte le avete voi, di carta, e le regole le applicate insieme, come su un tabletop classico.',
            },
        ],
    },
};

const en: Messages = {
    nav: {
        howItWorks: 'How it works',
        explore: 'Explore',
        myDecks: 'Your decks',
        createDeck: 'Create a deck',
        login: 'Log in',
        home: 'Back to home',
        settings: 'Settings',
        admin: 'Admin panel',
        signOut: 'Log out',
        language: 'Language',
    },
    footer: {
        rights: 'All rights reserved.',
        privacy: 'Privacy Policy',
        cookies: 'Cookie Policy',
    },
    landing: {
        welcome: 'Welcome to',
        copy: 'Play online with your friends from a PC or phone, track LP and roll dice in real time.',
        enterLobby: 'Enter the lobby',
        loginRegister: 'Log in / Sign up',
        guest: 'Continue as guest',
        howItWorks: 'How it works',
    },
    auth: {
        login: 'Log in',
        register: 'Sign up',
        username: 'Username',
        fullName: 'Full name',
        email: 'Email',
        password: 'Password',
        cancel: 'Cancel',
        enter: 'Enter',
        createAccount: 'Create account',
        loading: 'Loading…',
        signupOk: 'Sign-up complete! Check your email to confirm if asked.',
        error: 'Authentication error',
    },
    lobby: {
        matchmaking: 'Matchmaking',
        ranked: 'Ranked match',
        rankedCopy: 'Compete for the top of the leaderboard.',
        quick: 'Quick match',
        quickCopy: 'Jump into a casual game right away.',
        comingSoon: 'Coming soon',
        customGames: 'Custom games',
        createRoom: '+ Create room',
        roomCode: 'Enter room code…',
        join: 'Join',
        host: 'Host',
        gameFormat: 'Game & format',
        lang: 'Lang',
        players: 'Players',
        action: 'Action',
        full: 'Full',
        public: 'Public',
        private: 'Private',
        roomNotFound: 'Room not found',
        roomFull: 'This lobby is full!',
        loginToCreate: 'You need to log in to create a room!',
        closeLobby: 'Close lobby (admin)',
        passwordTitle: 'Password required',
        passwordLabel: 'Enter the password to join',
        passwordWrong: 'Wrong password!',
        confirm: 'Confirm',
        cancel: 'Cancel',
    },
    how: {
        title: 'The game table, remotely.',
        lead: 'PlayTCG.Online is a virtual table for paper TCGs: see each other, talk, and keep LP, phases and cards in sync — as if you were in the same room. It works on computer and phone, in the browser.',
        pillsLabel: 'At a glance',
        pillNoApp: 'No app',
        pillDevices: 'PC and phone',
        pillPlayers: '2–4 players',
        enterLobby: 'Enter the lobby',
        exploreDecks: 'Browse decks',
        mobileTitle: 'Built for phones too',
        mobileBody: 'Open the site in your browser, point the rear camera at the playmat and rotate the screen to see the whole field. The table has a dedicated phone layout: no app to install, no cable to a PC.',
        whatYouGet: 'What you get',
        howToStart: 'How to start',
        faq: 'Quick questions',
        shotPlaceholder: 'Four-player table screenshot — coming after the first tests',
        shotCaption: 'The in-game table view will sit here.',
        ctaTitle: 'Ready to sit down?',
        ctaBody: 'Open a room from a PC or phone, invite your friends and frame the playmat.',
        legal: 'PlayTCG.Online is not affiliated with Konami, Wizards of the Coast, The Pokémon Company, Bandai or Riot. All trademarks belong to their respective owners.',
        features: [
            {
                title: 'Audio and video',
                body: 'Point a webcam or phone at the playmat and stay on a call with the other players. No client to install: open the browser and you are at the table.',
            },
            {
                title: 'Cards at search reach',
                body: 'Search a card in the catalogues and show it to everyone. Works for Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball and Riftbound.',
            },
            {
                title: 'LP, phases and dice',
                body: 'Life points, turn phases and dice rolls stay visible and in sync. Less “what’s your life?” and more play.',
            },
            {
                title: '2 to 4 at the table',
                body: 'Pick a grid layout or a close-up on the active player. Fine for a duel or a four-player pod.',
            },
            {
                title: 'Whose turn',
                body: 'A turn indicator keeps the game moving. When you pass, everyone sees it.',
            },
            {
                title: 'Decks for every game',
                body: 'Build and share decks with format rules. Then join a room and play with the paper cards on your table.',
            },
        ],
        steps: [
            {
                title: 'Join',
                body: 'Sign up or continue as a guest. Nothing to download.',
            },
            {
                title: 'Open a room',
                body: 'Create a custom game or join with a code. Pick game, format and player count.',
            },
            {
                title: 'Frame and play',
                body: 'Point the camera at the field — from a PC or phone — set LP and phases, and play like at a real table. You apply the rules.',
            },
        ],
        faqs: [
            {
                q: 'Does it work on a phone?',
                a: 'Yes. Open playtcg.online in your phone browser: the table adapts to the screen and uses the rear camera to frame the playmat. No app needed.',
            },
            {
                q: 'Do I need an account?',
                a: 'No. You can join as a guest for a match. An account is for keeping decks and a profile.',
            },
            {
                q: 'Which games do you support?',
                a: 'Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball (Fusion World) and Riftbound. Same table, different catalogues and deck rules.',
            },
            {
                q: 'Is this an official client?',
                a: 'No. It is a virtual table: you have the paper cards, and you apply the rules together, like a classic tabletop.',
            },
        ],
    },
};

const es: Messages = {
    nav: {
        howItWorks: 'Cómo funciona',
        explore: 'Explorar',
        myDecks: 'Tus mazos',
        createDeck: 'Crear un mazo',
        login: 'Entrar',
        home: 'Volver al inicio',
        settings: 'Ajustes',
        admin: 'Panel de admin',
        signOut: 'Salir',
        language: 'Idioma',
    },
    footer: {
        rights: 'Todos los derechos reservados.',
        privacy: 'Política de privacidad',
        cookies: 'Política de cookies',
    },
    landing: {
        welcome: 'Bienvenido a',
        copy: 'Juega en línea con tus amigos desde el PC o el móvil, gestiona los LP y lanza los dados en tiempo real.',
        enterLobby: 'Entrar al lobby',
        loginRegister: 'Entrar / Registrarse',
        guest: 'Entrar como invitado',
        howItWorks: 'Cómo funciona',
    },
    auth: {
        login: 'Entrar',
        register: 'Registrarse',
        username: 'Usuario',
        fullName: 'Nombre completo',
        email: 'Email',
        password: 'Contraseña',
        cancel: 'Cancelar',
        enter: 'Entrar',
        createAccount: 'Crear cuenta',
        loading: 'Cargando…',
        signupOk: 'Registro completado. Revisa el email para confirmar si te lo piden.',
        error: 'Error de autenticación',
    },
    lobby: {
        matchmaking: 'Matchmaking',
        ranked: 'Partida ranked',
        rankedCopy: 'Compite por los primeros puestos de la clasificación.',
        quick: 'Partida rápida',
        quickCopy: 'Entra al momento en una partida casual.',
        comingSoon: 'Próximamente',
        customGames: 'Partidas custom',
        createRoom: '+ Crear sala',
        roomCode: 'Introduce el código de sala…',
        join: 'Unirse',
        host: 'Host',
        gameFormat: 'Juego y formato',
        lang: 'Idioma',
        players: 'Jugadores',
        action: 'Acción',
        full: 'Llena',
        public: 'Pública',
        private: 'Privada',
        roomNotFound: 'Sala no encontrada',
        roomFull: '¡Este lobby está lleno!',
        loginToCreate: 'Tienes que iniciar sesión para crear una sala.',
        closeLobby: 'Cerrar lobby (admin)',
        passwordTitle: 'Contraseña requerida',
        passwordLabel: 'Introduce la contraseña para entrar',
        passwordWrong: '¡Contraseña incorrecta!',
        confirm: 'Confirmar',
        cancel: 'Cancelar',
    },
    how: {
        title: 'La mesa de juego, en remoto.',
        lead: 'PlayTCG.Online es una mesa virtual para TCG de cartas: os veis, os oís y mantenéis LP, fases y cartas bajo control, como si estuvierais en la misma sala. Funciona en el ordenador y en el móvil, en el navegador.',
        pillsLabel: 'En resumen',
        pillNoApp: 'Sin app',
        pillDevices: 'PC y móvil',
        pillPlayers: '2–4 jugadores',
        enterLobby: 'Entrar al lobby',
        exploreDecks: 'Explorar mazos',
        mobileTitle: 'Pensado también para el móvil',
        mobileBody: 'Abre el sitio en el navegador, apunta la cámara trasera al playmat y gira la pantalla para ver todo el campo. La mesa tiene un diseño para smartphone: sin app que instalar, sin cable al PC.',
        whatYouGet: 'Qué encuentras',
        howToStart: 'Cómo empezar',
        faq: 'Preguntas rápidas',
        shotPlaceholder: 'Captura de la mesa a 4 jugadores — llega después de las primeras pruebas',
        shotCaption: 'Aquí irá la vista de la partida, como en la mesa real.',
        ctaTitle: '¿Listo para sentarte?',
        ctaBody: 'Abre una sala desde el PC o el móvil, invita a tus amigos y encuadra el playmat.',
        legal: 'PlayTCG.Online no está afiliado a Konami, Wizards of the Coast, The Pokémon Company, Bandai ni Riot. Las marcas pertenecen a sus respectivos titulares.',
        features: [
            {
                title: 'Audio y vídeo',
                body: 'Encuadra el playmat con la webcam o el móvil y sigue en llamada con los demás jugadores. Sin cliente que instalar: abre el navegador y estás en la mesa.',
            },
            {
                title: 'Cartas a golpe de búsqueda',
                body: 'Busca una carta en los catálogos y muéstrala a todos. Funciona con Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball y Riftbound.',
            },
            {
                title: 'LP, fases y dados',
                body: 'Puntos de vida, fases del turno y tiradas de dado se ven y se sincronizan. Menos «¿cuánta vida tienes?» y más juego.',
            },
            {
                title: 'De 2 a 4 en la mesa',
                body: 'Elige una cuadrícula o el primer plano del jugador activo. Vale para un duelo o para un pod de cuatro.',
            },
            {
                title: 'De quién es el turno',
                body: 'Un indicador de turno marca el ritmo. Cuando pasas, lo ven todos.',
            },
            {
                title: 'Mazos para cada juego',
                body: 'Construye y comparte mazos con las reglas del formato. Luego entras a una sala y juegas con las cartas de papel de tu mesa.',
            },
        ],
        steps: [
            {
                title: 'Entra',
                body: 'Regístrate o entra como invitado. No hay nada que descargar.',
            },
            {
                title: 'Abre una sala',
                body: 'Crea una custom game o únete con el código. Elige juego, formato y número de jugadores.',
            },
            {
                title: 'Encuadra y juega',
                body: 'Apunta la cámara al campo — desde el PC o el móvil — ajusta LP y fases, y jugad como en una mesa real. Las reglas las aplicáis vosotros.',
            },
        ],
        faqs: [
            {
                q: '¿Funciona en el móvil?',
                a: 'Sí. Abre playtcg.online en el navegador del móvil: la mesa se adapta a la pantalla y usa la cámara trasera para encuadrar el playmat. No hace falta una app.',
            },
            {
                q: '¿Hace falta una cuenta?',
                a: 'No. Puedes entrar como invitado a una partida. La cuenta sirve para guardar mazos y el perfil.',
            },
            {
                q: '¿Qué juegos soportáis?',
                a: 'Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball (Fusion World) y Riftbound. La misma mesa, catálogos y reglas de mazo distintos.',
            },
            {
                q: '¿Es un cliente oficial?',
                a: 'No. Es una mesa virtual: las cartas las tenéis vosotros, de papel, y las reglas las aplicáis juntos, como en un tabletop clásico.',
            },
        ],
    },
};

export const MESSAGES: Record<Locale, Messages> = { it, en, es };
