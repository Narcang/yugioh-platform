import { Locale } from './i18n';

export interface PageSeo {
    title: string;
    description: string;
    keywords: string[];
}

export interface SeoCopy {
    home: PageSeo;
    how: PageSeo;
    decks: PageSeo;
    terms: PageSeo;
    privacy: PageSeo;
    cookies: PageSeo;
}

const it: SeoCopy = {
    home: {
        title: 'PlayTCG.Online — tavolo virtuale per TCG di carta',
        description:
            'Tavolo virtuale non ufficiale per TCG di carta: video, LP, fasi, dadi e mazzi. Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball e Riftbound. Dal PC o dal telefono, nel browser.',
        keywords: [
            'PlayTCG',
            'tavolo virtuale TCG',
            'Yu-Gi-Oh online',
            'Magic the Gathering remoto',
            'Pokémon TCG webcam',
            'One Piece Card Game',
            'Dragon Ball Fusion World',
            'Riftbound',
        ],
    },
    how: {
        title: 'Come funziona',
        description:
            'Gioca ai TCG di carta da remoto: video, LP, fasi, dadi, ricerca carte e mazzi. Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball e Riftbound. Funziona dal PC e dal telefono, nel browser.',
        keywords: ['come funziona PlayTCG', 'tavolo virtuale TCG', 'webcam playmat', 'TCG smartphone'],
    },
    decks: {
        title: 'Esplora i mazzi',
        description:
            'Sfoglia i mazzi condivisi dalla community: lista carte, formato e controllo di legalità per Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball e Riftbound.',
        keywords: ['deck builder TCG', 'mazzi Yu-Gi-Oh', 'mazzi Magic', 'mazzi Pokémon'],
    },
    terms: {
        title: 'Termini di servizio',
        description:
            'Termini di PlayTCG.Online: tavolo virtuale non ufficiale per TCG di carta. Non affiliato a Konami, Wizards of the Coast, The Pokémon Company, Bandai o Riot Games.',
        keywords: ['termini PlayTCG', 'fan content policy'],
    },
    privacy: {
        title: 'Privacy Policy',
        description: 'Informativa sulla privacy di PlayTCG.Online: dati di account, sessione ospite e diritti GDPR.',
        keywords: ['privacy PlayTCG', 'GDPR'],
    },
    cookies: {
        title: 'Cookie Policy',
        description:
            'Cookie policy di PlayTCG.Online: solo cookie tecnici per autenticazione e preferenze, niente profilazione.',
        keywords: ['cookie PlayTCG'],
    },
};

const en: SeoCopy = {
    home: {
        title: 'PlayTCG.Online — virtual table for paper TCGs',
        description:
            'Unofficial virtual table for paper TCGs: video, LP, phases, dice and decks. Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball and Riftbound. On PC or phone, in the browser.',
        keywords: [
            'PlayTCG',
            'virtual TCG table',
            'play Yu-Gi-Oh remotely',
            'Magic the Gathering webcam',
            'Pokémon TCG online table',
            'One Piece Card Game',
            'Dragon Ball Fusion World',
            'Riftbound',
        ],
    },
    how: {
        title: 'How it works',
        description:
            'Play paper TCGs remotely: video, LP, phases, dice, card search and decks. Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball and Riftbound. Works on PC and phone, in the browser.',
        keywords: ['how PlayTCG works', 'virtual TCG table', 'webcam playmat', 'TCG on phone'],
    },
    decks: {
        title: 'Browse decks',
        description:
            'Browse community decks: card lists, format and legality checks for Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball and Riftbound.',
        keywords: ['TCG deck builder', 'Yu-Gi-Oh decks', 'Magic decks', 'Pokémon decks'],
    },
    terms: {
        title: 'Terms of Service',
        description:
            'PlayTCG.Online terms: unofficial virtual table for paper TCGs. Not affiliated with Konami, Wizards of the Coast, The Pokémon Company, Bandai or Riot Games.',
        keywords: ['PlayTCG terms', 'fan content policy'],
    },
    privacy: {
        title: 'Privacy Policy',
        description: 'PlayTCG.Online privacy policy: account data, guest sessions and GDPR rights.',
        keywords: ['PlayTCG privacy', 'GDPR'],
    },
    cookies: {
        title: 'Cookie Policy',
        description: 'PlayTCG.Online cookie policy: strictly necessary cookies only, no profiling.',
        keywords: ['PlayTCG cookies'],
    },
};

const es: SeoCopy = {
    home: {
        title: 'PlayTCG.Online — mesa virtual para TCG de cartas',
        description:
            'Mesa virtual no oficial para TCG de cartas: vídeo, LP, fases, dados y mazos. Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball y Riftbound. En el PC o el móvil, en el navegador.',
        keywords: ['PlayTCG', 'mesa virtual TCG', 'Yu-Gi-Oh online', 'Magic remoto', 'Pokémon TCG webcam'],
    },
    how: {
        title: 'Cómo funciona',
        description:
            'Juega a TCG de cartas en remoto: vídeo, LP, fases, dados, búsqueda de cartas y mazos. Funciona en el PC y el móvil, en el navegador.',
        keywords: ['cómo funciona PlayTCG', 'mesa virtual TCG', 'playmat webcam'],
    },
    decks: {
        title: 'Explorar mazos',
        description:
            'Mazos públicos de la comunidad: lista de cartas, formato y legalidad para Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball y Riftbound.',
        keywords: ['constructor de mazos TCG', 'mazos Yu-Gi-Oh'],
    },
    terms: {
        title: 'Términos del servicio',
        description:
            'Términos de PlayTCG.Online: mesa virtual no oficial. No afiliado a Konami, Wizards of the Coast, The Pokémon Company, Bandai ni Riot Games.',
        keywords: ['términos PlayTCG'],
    },
    privacy: {
        title: 'Política de privacidad',
        description: 'Privacidad de PlayTCG.Online: datos de cuenta, sesión de invitado y derechos GDPR.',
        keywords: ['privacidad PlayTCG'],
    },
    cookies: {
        title: 'Política de cookies',
        description: 'Cookies de PlayTCG.Online: solo cookies técnicas, sin perfilado.',
        keywords: ['cookies PlayTCG'],
    },
};

const fr: SeoCopy = {
    home: {
        title: 'PlayTCG.Online — table virtuelle pour TCG papier',
        description:
            'Table virtuelle non officielle pour TCG papier : vidéo, LP, phases, dés et decks. Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball et Riftbound. Sur PC ou téléphone, dans le navigateur.',
        keywords: ['PlayTCG', 'table virtuelle TCG', 'Yu-Gi-Oh en ligne', 'Magic webcam'],
    },
    how: {
        title: 'Comment ça marche',
        description:
            'Joue aux TCG papier à distance : vidéo, LP, phases, dés, recherche de cartes et decks. Ça marche sur PC et téléphone, dans le navigateur.',
        keywords: ['comment ça marche PlayTCG', 'table virtuelle TCG'],
    },
    decks: {
        title: 'Parcourir les decks',
        description:
            'Decks publics de la communauté : listes, format et légalité pour Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball et Riftbound.',
        keywords: ['deck builder TCG'],
    },
    terms: {
        title: 'Conditions d’utilisation',
        description:
            'Conditions de PlayTCG.Online : table virtuelle non officielle. Non affilié à Konami, Wizards of the Coast, The Pokémon Company, Bandai ou Riot Games.',
        keywords: ['conditions PlayTCG'],
    },
    privacy: {
        title: 'Politique de confidentialité',
        description: 'Confidentialité de PlayTCG.Online : données de compte, session invité et droits RGPD.',
        keywords: ['confidentialité PlayTCG'],
    },
    cookies: {
        title: 'Politique cookies',
        description: 'Cookies de PlayTCG.Online : cookies techniques uniquement, pas de profilage.',
        keywords: ['cookies PlayTCG'],
    },
};

const de: SeoCopy = {
    home: {
        title: 'PlayTCG.Online — virtueller Tisch für Papier-TCGs',
        description:
            'Inoffizieller virtueller Tisch für Papier-TCGs: Video, LP, Phasen, Würfel und Decks. Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball und Riftbound. Am PC oder Handy, im Browser.',
        keywords: ['PlayTCG', 'virtueller TCG-Tisch', 'Yu-Gi-Oh online', 'Magic Webcam'],
    },
    how: {
        title: 'So funktioniert’s',
        description:
            'Spiel Papier-TCGs aus der Ferne: Video, LP, Phasen, Würfel, Kartensuche und Decks. Am PC und Handy, im Browser.',
        keywords: ['so funktioniert PlayTCG', 'virtueller TCG-Tisch'],
    },
    decks: {
        title: 'Decks entdecken',
        description:
            'Community-Decks: Kartenlisten, Format und Legalität für Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball und Riftbound.',
        keywords: ['TCG Deckbuilder'],
    },
    terms: {
        title: 'Nutzungsbedingungen',
        description:
            'Nutzungsbedingungen von PlayTCG.Online: inoffizieller virtueller Tisch. Nicht verbunden mit Konami, Wizards of the Coast, The Pokémon Company, Bandai oder Riot Games.',
        keywords: ['PlayTCG AGB'],
    },
    privacy: {
        title: 'Datenschutz',
        description: 'Datenschutz von PlayTCG.Online: Kontodaten, Gastsitzungen und DSGVO-Rechte.',
        keywords: ['PlayTCG Datenschutz'],
    },
    cookies: {
        title: 'Cookie-Richtlinie',
        description: 'Cookies bei PlayTCG.Online: nur technisch notwendige Cookies, kein Profiling.',
        keywords: ['PlayTCG Cookies'],
    },
};

const pt: SeoCopy = {
    home: {
        title: 'PlayTCG.Online — mesa virtual para TCG de papel',
        description:
            'Mesa virtual não oficial para TCG de papel: vídeo, LP, fases, dados e decks. Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball e Riftbound. No PC ou no celular, no navegador.',
        keywords: ['PlayTCG', 'mesa virtual TCG', 'Yu-Gi-Oh online', 'Magic webcam'],
    },
    how: {
        title: 'Como funciona',
        description:
            'Jogue TCG de papel à distância: vídeo, LP, fases, dados, busca de cartas e decks. Funciona no PC e no celular, no navegador.',
        keywords: ['como funciona PlayTCG', 'mesa virtual TCG'],
    },
    decks: {
        title: 'Explorar decks',
        description:
            'Decks públicos da comunidade: listas, formato e legalidade para Yu-Gi-Oh!, Magic, Pokémon, One Piece, Dragon Ball e Riftbound.',
        keywords: ['deck builder TCG'],
    },
    terms: {
        title: 'Termos de serviço',
        description:
            'Termos do PlayTCG.Online: mesa virtual não oficial. Não afiliado à Konami, Wizards of the Coast, The Pokémon Company, Bandai ou Riot Games.',
        keywords: ['termos PlayTCG'],
    },
    privacy: {
        title: 'Política de privacidade',
        description: 'Privacidade do PlayTCG.Online: dados da conta, sessão de convidado e direitos GDPR.',
        keywords: ['privacidade PlayTCG'],
    },
    cookies: {
        title: 'Política de cookies',
        description: 'Cookies do PlayTCG.Online: só cookies técnicos, sem perfilamento.',
        keywords: ['cookies PlayTCG'],
    },
};

export const SEO: Record<Locale, SeoCopy> = { it, en, es, fr, de, pt };
