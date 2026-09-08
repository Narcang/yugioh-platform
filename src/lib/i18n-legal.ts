import type { Locale } from './i18n';

export interface TermsSection {
    h: string;
    paragraphs: string[];
    list?: string[];
}

export interface TermsCopy {
    title: string;
    updated: string;
    sections: TermsSection[];
}

const it: TermsCopy = {
    title: 'Termini di servizio',
    updated: 'Ultimo aggiornamento: 8 settembre 2026',
    sections: [
        {
            h: '1. Che cos’è PlayTCG.Online',
            paragraphs: [
                'PlayTCG.Online è un tavolo virtuale per giocare a TCG di carta a distanza: video, audio, punti vita, fasi, dadi, ricerca carte e costruzione mazzi. Non è un client ufficiale, non vende carte e non sostituisce i giochi cartacei. Le carte di carta le avete voi; le regole le applicate voi, come a un tavolo vero.',
                'PlayTCG.Online è un progetto di Be2Bit Ltd (Malta, VAT MT21599411).',
            ],
        },
        {
            h: '2. Accettazione',
            paragraphs: [
                'Usando PlayTCG.Online accetti questi termini e l’informativa sulla privacy. Se non sei d’accordo, non usare il servizio. Se usi il sito per conto di un minore, dichiari di essere il genitore o tutore e di accettare i termini per suo conto.',
            ],
        },
        {
            h: '3. Progetto non ufficiale',
            paragraphs: [
                'PlayTCG.Online è contenuto fan non ufficiale. Non è approvato, sponsorizzato né affiliato con i titolari dei giochi che puoi usare al tavolo. Tutti i marchi, loghi, nomi, illustrazioni e materiali di gioco appartengono ai rispettivi titolari. Non usiamo i loro loghi come marchio del sito.',
            ],
            list: [
                'Yu-Gi-Oh! è un marchio di Konami Digital Entertainment.',
                'Magic: The Gathering è un marchio di Wizards of the Coast LLC.',
                'Pokémon e Pokémon TCG sono marchi di Nintendo, Creatures Inc., GAME FREAK inc. e The Pokémon Company.',
                'One Piece Card Game e Dragon Ball Super Card Game Fusion World sono marchi di BANDAI, dei rispettivi titolari delle opere e dei licenzianti.',
                'Riftbound e i marchi collegati sono di Riot Games, Inc.',
            ],
        },
        {
            h: '4. Magic: The Gathering e Fan Content Policy',
            paragraphs: [
                'Per i materiali di Magic: The Gathering PlayTCG.Online si basa sulla Fan Content Policy di Wizards of the Coast. In particolare:',
                'PlayTCG.Online is unofficial Fan Content permitted under the Wizards of the Coast Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.',
                'La policy ufficiale è pubblicata da Wizards of the Coast. Se Wizards ci chiede di modificare o rimuovere materiali, lo faremo.',
            ],
        },
        {
            h: '5. Altri giochi',
            paragraphs: [
                'Per Yu-Gi-Oh!, Pokémon, One Piece, Dragon Ball (Fusion World) e Riftbound non esiste sempre una fan content policy pubblica equivalente a quella di Wizards. Mostriamo nomi, testi e immagini delle carte solo per identificazione al tavolo e nel deck builder, senza far passare il sito per un prodotto ufficiale. Riot Games non endorsa questo progetto; Riftbound al tavolo è il gioco di carta, non un clone digitale con regole automatiche.',
            ],
        },
        {
            h: '6. Immagini e dati delle carte',
            paragraphs: [
                'Immagini e dati delle carte arrivano da cataloghi pubblici di terze parti e, dove disponibili, da risorse pubbliche degli editori. Li usiamo solo per farti trovare e mostrare una carta. Non rivendichiamo la proprietà di illustrazioni, testi o meccaniche.',
            ],
            list: [
                'Yu-Gi-Oh!: YGOPRODeck',
                'Magic: The Gathering: Scryfall',
                'Pokémon: Pokémon TCG API (pokemontcg.io)',
                'One Piece: cataloghi pubblici della community (tra cui DOTGG)',
                'Dragon Ball Fusion World: risorse pubbliche dell’editore',
            ],
        },
        {
            h: '7. Cosa non puoi fare',
            paragraphs: ['Non è consentito, tra le altre cose:'],
            list: [
                'Fingere di essere Konami, Wizards, The Pokémon Company, Bandai, Riot o PlayTCG.Online',
                'Vendere, affittare o distribuire copie, proxy o contraffazioni di carte',
                'Usare il sito per molestie, minacce, contenuti illegali o per violare i diritti di altri',
                'Attaccare, scansionare o saturare l’infrastruttura, o copiare in massa i cataloghi per un servizio concorrente',
                'Eludere autenticazione, limiti o misure di sicurezza',
            ],
        },
        {
            h: '8. Account, ospiti e i tuoi mazzi',
            paragraphs: [
                'Puoi entrare come ospite per una partita. Un account serve per profilo e mazzi salvati. Sei responsabile di ciò che pubblichi. I mazzi restano tuoi; se li rendi pubblici, ci dai licenza non esclusiva di ospitarli e mostrarli sul sito. Possiamo rimuovere contenuti che violano questi termini o i diritti di terzi.',
            ],
        },
        {
            h: '9. Disponibilità e responsabilità',
            paragraphs: [
                'Il servizio è offerto “così com’è”. Possiamo interromperlo, modificarlo o correggere errori senza preavviso. Nei limiti ammessi dalla legge, non rispondiamo di danni indiretti, perdita di dati o interruzioni. Restano salvi i diritti inderogabili dei consumatori dell’UE.',
            ],
        },
        {
            h: '10. Modifiche e legge applicabile',
            paragraphs: [
                'Possiamo aggiornare questi termini. La data in cima alla pagina è quella che vale. Salvo norme inderogabili a tua tutela, si applica la legge italiana. Per i consumatori residenti in un altro Paese dell’UE restano ferme le tutele obbligatorie di quel Paese.',
            ],
        },
    ],
};

const en: TermsCopy = {
    title: 'Terms of Service',
    updated: 'Last updated: 8 September 2026',
    sections: [
        {
            h: '1. What PlayTCG.Online is',
            paragraphs: [
                'PlayTCG.Online is a virtual table for playing paper TCGs remotely: video, audio, life points, phases, dice, card search and deck building. It is not an official client, it does not sell cards, and it does not replace the paper games. You bring the paper cards; you apply the rules, as you would at a real table.',
                'PlayTCG.Online is a project of Be2Bit Ltd (Malta, VAT MT21599411).',
            ],
        },
        {
            h: '2. Acceptance',
            paragraphs: [
                'By using PlayTCG.Online you accept these terms and the privacy policy. If you do not agree, do not use the service. If you use the site on behalf of a minor, you confirm you are their parent or guardian and accept the terms for them.',
            ],
        },
        {
            h: '3. Unofficial project',
            paragraphs: [
                'PlayTCG.Online is unofficial fan content. It is not approved, endorsed, sponsored, or affiliated with the rights holders of the games you can play at the table. All trademarks, logos, names, artwork and game materials belong to their respective owners. We do not use their logos as our site mark.',
            ],
            list: [
                'Yu-Gi-Oh! is a trademark of Konami Digital Entertainment.',
                'Magic: The Gathering is a trademark of Wizards of the Coast LLC.',
                'Pokémon and Pokémon TCG are trademarks of Nintendo, Creatures Inc., GAME FREAK inc. and The Pokémon Company.',
                'One Piece Card Game and Dragon Ball Super Card Game Fusion World are trademarks of BANDAI and their respective rights holders and licensors.',
                'Riftbound and related marks are trademarks of Riot Games, Inc.',
            ],
        },
        {
            h: '4. Magic: The Gathering and the Fan Content Policy',
            paragraphs: [
                'For Magic: The Gathering materials, PlayTCG.Online relies on the Wizards of the Coast Fan Content Policy. In particular:',
                'PlayTCG.Online is unofficial Fan Content permitted under the Wizards of the Coast Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.',
                'The official policy is published by Wizards of the Coast. If Wizards asks us to change or remove materials, we will.',
            ],
        },
        {
            h: '5. Other games',
            paragraphs: [
                'For Yu-Gi-Oh!, Pokémon, One Piece, Dragon Ball (Fusion World) and Riftbound there is not always a public fan-content policy equivalent to Wizards’. We show card names, text and images only so you can identify cards at the table and in the deck builder, without presenting the site as an official product. Riot Games does not endorse this project; Riftbound at the table is the paper game, not a digital clone with automated rules.',
            ],
        },
        {
            h: '6. Card images and data',
            paragraphs: [
                'Card images and data come from public third-party catalogues and, where available, from the publishers’ public resources. We use them only so you can find and show a card. We do not claim ownership of artwork, card text or game mechanics.',
            ],
            list: [
                'Yu-Gi-Oh!: YGOPRODeck',
                'Magic: The Gathering: Scryfall',
                'Pokémon: Pokémon TCG API (pokemontcg.io)',
                'One Piece: public community catalogues (including DOTGG)',
                'Dragon Ball Fusion World: the publisher’s public resources',
            ],
        },
        {
            h: '7. What you must not do',
            paragraphs: ['Among other things, you must not:'],
            list: [
                'Impersonate Konami, Wizards, The Pokémon Company, Bandai, Riot or PlayTCG.Online',
                'Sell, rent or distribute copies, proxies or counterfeit cards',
                'Use the site for harassment, threats, illegal content, or to infringe other people’s rights',
                'Attack, scan or overload the service, or bulk-copy catalogues to run a competing product',
                'Bypass authentication, limits or security measures',
            ],
        },
        {
            h: '8. Accounts, guests and your decks',
            paragraphs: [
                'You can join a match as a guest. An account is for a profile and saved decks. You are responsible for what you publish. Decks remain yours; if you make them public, you grant us a non-exclusive licence to host and display them on the site. We may remove content that breaks these terms or third-party rights.',
            ],
        },
        {
            h: '9. Availability and liability',
            paragraphs: [
                'The service is provided “as is”. We may interrupt, change or fix it without notice. To the extent allowed by law, we are not liable for indirect damage, data loss or downtime. Mandatory EU consumer rights remain unaffected.',
            ],
        },
        {
            h: '10. Changes and governing law',
            paragraphs: [
                'We may update these terms. The date at the top of the page is the one that applies. Except where mandatory rules protect you, Italian law applies. Consumers living in another EU country keep the mandatory protections of that country.',
            ],
        },
    ],
};

const es: TermsCopy = {
    title: 'Términos del servicio',
    updated: 'Última actualización: 8 de septiembre de 2026',
    sections: [
        {
            h: '1. Qué es PlayTCG.Online',
            paragraphs: [
                'PlayTCG.Online es una mesa virtual para jugar TCG de cartas a distancia: vídeo, audio, puntos de vida, fases, dados, búsqueda de cartas y construcción de mazos. No es un cliente oficial, no vende cartas y no sustituye los juegos de papel. Las cartas las tenéis vosotros; las reglas las aplicáis vosotros, como en una mesa real.',
                'PlayTCG.Online es un proyecto de Be2Bit Ltd (Malta, VAT MT21599411).',
            ],
        },
        {
            h: '2. Aceptación',
            paragraphs: [
                'Al usar PlayTCG.Online aceptas estos términos y la política de privacidad. Si no estás de acuerdo, no uses el servicio. Si usas el sitio en nombre de un menor, confirmas que eres su padre, madre o tutor y aceptas los términos en su nombre.',
            ],
        },
        {
            h: '3. Proyecto no oficial',
            paragraphs: [
                'PlayTCG.Online es contenido fan no oficial. No está aprobado, respaldado, patrocinado ni afiliado a los titulares de los juegos que puedes usar en la mesa. Todas las marcas, logotipos, nombres, ilustraciones y materiales pertenecen a sus respectivos titulares. No usamos sus logotipos como marca del sitio.',
            ],
            list: [
                'Yu-Gi-Oh! es una marca de Konami Digital Entertainment.',
                'Magic: The Gathering es una marca de Wizards of the Coast LLC.',
                'Pokémon y Pokémon TCG son marcas de Nintendo, Creatures Inc., GAME FREAK inc. y The Pokémon Company.',
                'One Piece Card Game y Dragon Ball Super Card Game Fusion World son marcas de BANDAI y de sus respectivos titulares y licenciatarios.',
                'Riftbound y las marcas asociadas son de Riot Games, Inc.',
            ],
        },
        {
            h: '4. Magic: The Gathering y la Fan Content Policy',
            paragraphs: [
                'Para los materiales de Magic: The Gathering, PlayTCG.Online se acoge a la Fan Content Policy de Wizards of the Coast. En concreto:',
                'PlayTCG.Online is unofficial Fan Content permitted under the Wizards of the Coast Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.',
                'La política oficial la publica Wizards of the Coast. Si Wizards nos pide cambiar o retirar materiales, lo haremos.',
            ],
        },
        {
            h: '5. Otros juegos',
            paragraphs: [
                'Para Yu-Gi-Oh!, Pokémon, One Piece, Dragon Ball (Fusion World) y Riftbound no siempre hay una política de contenido fan pública equivalente a la de Wizards. Mostramos nombres, textos e imágenes de cartas solo para identificarlas en la mesa y en el constructor de mazos, sin presentar el sitio como un producto oficial. Riot Games no respalda este proyecto; Riftbound en la mesa es el juego de cartas, no un clon digital con reglas automáticas.',
            ],
        },
        {
            h: '6. Imágenes y datos de las cartas',
            paragraphs: [
                'Las imágenes y los datos de las cartas proceden de catálogos públicos de terceros y, cuando existen, de recursos públicos de los editores. Los usamos solo para que puedas buscar y mostrar una carta. No reclamamos la propiedad de ilustraciones, textos ni mecánicas.',
            ],
            list: [
                'Yu-Gi-Oh!: YGOPRODeck',
                'Magic: The Gathering: Scryfall',
                'Pokémon: Pokémon TCG API (pokemontcg.io)',
                'One Piece: catálogos públicos de la comunidad (incluido DOTGG)',
                'Dragon Ball Fusion World: recursos públicos del editor',
            ],
        },
        {
            h: '7. Qué no puedes hacer',
            paragraphs: ['Entre otras cosas, no puedes:'],
            list: [
                'Hacerte pasar por Konami, Wizards, The Pokémon Company, Bandai, Riot o PlayTCG.Online',
                'Vender, alquilar o distribuir copias, proxies o cartas falsificadas',
                'Usar el sitio para acoso, amenazas, contenido ilegal o para vulnerar derechos de terceros',
                'Atacar, escanear o saturar el servicio, o copiar en masa los catálogos para un producto competidor',
                'Eludir la autenticación, los límites o las medidas de seguridad',
            ],
        },
        {
            h: '8. Cuentas, invitados y tus mazos',
            paragraphs: [
                'Puedes entrar a una partida como invitado. La cuenta sirve para el perfil y los mazos guardados. Eres responsable de lo que publiques. Los mazos siguen siendo tuyos; si los haces públicos, nos das una licencia no exclusiva para alojarlos y mostrarlos en el sitio. Podemos retirar contenidos que incumplan estos términos o derechos de terceros.',
            ],
        },
        {
            h: '9. Disponibilidad y responsabilidad',
            paragraphs: [
                'El servicio se ofrece “tal cual”. Podemos interrumpirlo, cambiarlo o corregirlo sin aviso. En la medida que permita la ley, no respondemos de daños indirectos, pérdida de datos o caídas. Quedan a salvo los derechos imperativos de los consumidores de la UE.',
            ],
        },
        {
            h: '10. Cambios y ley aplicable',
            paragraphs: [
                'Podemos actualizar estos términos. La fecha de la parte superior es la que rige. Salvo normas imperativas que te protejan, se aplica la ley italiana. Los consumidores residentes en otro país de la UE conservan las protecciones obligatorias de ese país.',
            ],
        },
    ],
};

const fr: TermsCopy = {
    title: 'Conditions d’utilisation',
    updated: 'Dernière mise à jour : 8 septembre 2026',
    sections: [
        {
            h: '1. Qu’est-ce que PlayTCG.Online',
            paragraphs: [
                'PlayTCG.Online est une table virtuelle pour jouer aux TCG papier à distance : vidéo, audio, points de vie, phases, dés, recherche de cartes et construction de decks. Ce n’est pas un client officiel, on ne vend pas de cartes et on ne remplace pas les jeux papier. Les cartes papier sont les vôtres ; les règles, vous les appliquez, comme à une vraie table.',
                'PlayTCG.Online est un projet de Be2Bit Ltd (Malte, VAT MT21599411).',
            ],
        },
        {
            h: '2. Acceptation',
            paragraphs: [
                'En utilisant PlayTCG.Online, tu acceptes ces conditions et la politique de confidentialité. Si tu n’es pas d’accord, n’utilise pas le service. Si tu utilises le site pour un mineur, tu confirmes être son parent ou tuteur et accepter les conditions pour lui.',
            ],
        },
        {
            h: '3. Projet non officiel',
            paragraphs: [
                'PlayTCG.Online est du contenu fan non officiel. Il n’est pas approuvé, soutenu, sponsorisé ni affilié aux ayants droit des jeux que tu peux jouer à la table. Toutes les marques, logos, noms, illustrations et matériaux appartiennent à leurs titulaires. Nous n’utilisons pas leurs logos comme marque du site.',
            ],
            list: [
                'Yu-Gi-Oh! est une marque de Konami Digital Entertainment.',
                'Magic: The Gathering est une marque de Wizards of the Coast LLC.',
                'Pokémon et Pokémon TCG sont des marques de Nintendo, Creatures Inc., GAME FREAK inc. et The Pokémon Company.',
                'One Piece Card Game et Dragon Ball Super Card Game Fusion World sont des marques de BANDAI et de leurs ayants droit et concédants.',
                'Riftbound et les marques associées sont des marques de Riot Games, Inc.',
            ],
        },
        {
            h: '4. Magic: The Gathering et la Fan Content Policy',
            paragraphs: [
                'Pour les matériaux Magic: The Gathering, PlayTCG.Online s’appuie sur la Fan Content Policy de Wizards of the Coast. En particulier :',
                'PlayTCG.Online is unofficial Fan Content permitted under the Wizards of the Coast Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.',
                'La policy officielle est publiée par Wizards of the Coast. Si Wizards nous demande de modifier ou retirer des matériaux, nous le ferons.',
            ],
        },
        {
            h: '5. Autres jeux',
            paragraphs: [
                'Pour Yu-Gi-Oh!, Pokémon, One Piece, Dragon Ball (Fusion World) et Riftbound, il n’existe pas toujours une fan content policy publique équivalente à celle de Wizards. Nous affichons noms, textes et images de cartes uniquement pour les identifier à la table et dans le deck builder, sans présenter le site comme un produit officiel. Riot Games n’endosse pas ce projet ; Riftbound à la table est le jeu papier, pas un clone numérique aux règles automatiques.',
            ],
        },
        {
            h: '6. Images et données des cartes',
            paragraphs: [
                'Les images et données des cartes viennent de catalogues publics tiers et, quand c’est possible, de ressources publiques des éditeurs. Nous les utilisons seulement pour chercher et montrer une carte. Nous ne revendiquons aucune propriété sur les illustrations, textes ou mécaniques.',
            ],
            list: [
                'Yu-Gi-Oh! : YGOPRODeck',
                'Magic: The Gathering : Scryfall',
                'Pokémon : Pokémon TCG API (pokemontcg.io)',
                'One Piece : catalogues publics de la communauté (dont DOTGG)',
                'Dragon Ball Fusion World : ressources publiques de l’éditeur',
            ],
        },
        {
            h: '7. Ce que tu ne dois pas faire',
            paragraphs: ['Entre autres, tu ne dois pas :'],
            list: [
                'Te faire passer pour Konami, Wizards, The Pokémon Company, Bandai, Riot ou PlayTCG.Online',
                'Vendre, louer ou distribuer des copies, proxies ou cartes contrefaites',
                'Utiliser le site pour du harcèlement, des menaces, du contenu illégal ou pour violer les droits d’autrui',
                'Attaquer, scanner ou saturer le service, ou copier en masse les catalogues pour un produit concurrent',
                'Contourner l’authentification, les limites ou les mesures de sécurité',
            ],
        },
        {
            h: '8. Comptes, invités et tes decks',
            paragraphs: [
                'Tu peux rejoindre une partie en invité. Un compte sert au profil et aux decks enregistrés. Tu es responsable de ce que tu publies. Les decks restent les tiens ; si tu les rends publics, tu nous donnes une licence non exclusive pour les héberger et les afficher. Nous pouvons retirer un contenu qui enfreint ces conditions ou des droits de tiers.',
            ],
        },
        {
            h: '9. Disponibilité et responsabilité',
            paragraphs: [
                'Le service est fourni « en l’état ». Nous pouvons l’interrompre, le modifier ou le corriger sans préavis. Dans les limites autorisées par la loi, nous ne sommes pas responsables des dommages indirects, pertes de données ou interruptions. Les droits impératifs des consommateurs de l’UE restent entiers.',
            ],
        },
        {
            h: '10. Modifications et droit applicable',
            paragraphs: [
                'Nous pouvons mettre à jour ces conditions. La date en haut de page fait foi. Sauf règles impératives qui te protègent, le droit italien s’applique. Les consommateurs d’un autre pays de l’UE conservent les protections obligatoires de ce pays.',
            ],
        },
    ],
};

const de: TermsCopy = {
    title: 'Nutzungsbedingungen',
    updated: 'Zuletzt aktualisiert: 8. September 2026',
    sections: [
        {
            h: '1. Was PlayTCG.Online ist',
            paragraphs: [
                'PlayTCG.Online ist ein virtueller Tisch für Papier-TCGs aus der Ferne: Video, Audio, Lebenspunkte, Phasen, Würfel, Kartensuche und Deckbuilding. Es ist kein offizieller Client, verkauft keine Karten und ersetzt die Papierspiele nicht. Die Papierkarten habt ihr; die Regeln wendet ihr an, wie am echten Tisch.',
                'PlayTCG.Online ist ein Projekt von Be2Bit Ltd (Malta, VAT MT21599411).',
            ],
        },
        {
            h: '2. Annahme',
            paragraphs: [
                'Mit der Nutzung von PlayTCG.Online akzeptierst du diese Bedingungen und die Datenschutzerklärung. Wenn du nicht einverstanden bist, nutze den Dienst nicht. Nutzt du die Seite für eine minderjährige Person, bestätigst du, Elternteil oder Vormund zu sein und die Bedingungen für sie anzunehmen.',
            ],
        },
        {
            h: '3. Inoffizielles Projekt',
            paragraphs: [
                'PlayTCG.Online ist inoffizieller Fan-Inhalt. Es ist nicht genehmigt, unterstützt, gesponsert oder verbunden mit den Rechteinhabern der Spiele am Tisch. Alle Marken, Logos, Namen, Artworks und Spielmaterialien gehören den jeweiligen Inhabern. Wir nutzen ihre Logos nicht als Marke der Seite.',
            ],
            list: [
                'Yu-Gi-Oh! ist eine Marke von Konami Digital Entertainment.',
                'Magic: The Gathering ist eine Marke von Wizards of the Coast LLC.',
                'Pokémon und Pokémon TCG sind Marken von Nintendo, Creatures Inc., GAME FREAK inc. und The Pokémon Company.',
                'One Piece Card Game und Dragon Ball Super Card Game Fusion World sind Marken von BANDAI sowie der jeweiligen Rechteinhaber und Lizenzgeber.',
                'Riftbound und zugehörige Marken sind Marken von Riot Games, Inc.',
            ],
        },
        {
            h: '4. Magic: The Gathering und die Fan Content Policy',
            paragraphs: [
                'Für Magic: The Gathering-Materialien stützt sich PlayTCG.Online auf die Fan Content Policy von Wizards of the Coast. Insbesondere:',
                'PlayTCG.Online is unofficial Fan Content permitted under the Wizards of the Coast Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.',
                'Die offizielle Policy veröffentlicht Wizards of the Coast. Wenn Wizards uns bittet, Materialien zu ändern oder zu entfernen, tun wir das.',
            ],
        },
        {
            h: '5. Andere Spiele',
            paragraphs: [
                'Für Yu-Gi-Oh!, Pokémon, One Piece, Dragon Ball (Fusion World) und Riftbound gibt es nicht immer eine öffentliche Fan-Content-Policy wie bei Wizards. Wir zeigen Kartennamen, Texte und Bilder nur zur Identifikation am Tisch und im Deckbuilder, ohne die Seite als offizielles Produkt darzustellen. Riot Games unterstützt dieses Projekt nicht; Riftbound am Tisch ist das Kartenspiel aus Papier, kein digitaler Klon mit automatischen Regeln.',
            ],
        },
        {
            h: '6. Kartenbilder und -daten',
            paragraphs: [
                'Kartenbilder und -daten stammen aus öffentlichen Katalogen Dritter und, wo vorhanden, aus öffentlichen Ressourcen der Verlage. Wir nutzen sie nur, damit du eine Karte finden und zeigen kannst. Wir beanspruchen kein Eigentum an Artworks, Kartentexten oder Spielmechaniken.',
            ],
            list: [
                'Yu-Gi-Oh!: YGOPRODeck',
                'Magic: The Gathering: Scryfall',
                'Pokémon: Pokémon TCG API (pokemontcg.io)',
                'One Piece: öffentliche Community-Kataloge (einschließlich DOTGG)',
                'Dragon Ball Fusion World: öffentliche Ressourcen des Verlags',
            ],
        },
        {
            h: '7. Was du nicht tun darfst',
            paragraphs: ['Unter anderem darfst du nicht:'],
            list: [
                'Dich als Konami, Wizards, The Pokémon Company, Bandai, Riot oder PlayTCG.Online ausgeben',
                'Kopien, Proxies oder Fälschungen verkaufen, vermieten oder verbreiten',
                'Die Seite für Belästigung, Drohungen, illegale Inhalte oder die Verletzung fremder Rechte nutzen',
                'Den Dienst angreifen, scannen oder überlasten oder Kataloge massenhaft für ein Konkurrenzprodukt kopieren',
                'Authentifizierung, Limits oder Sicherheitsmaßnahmen umgehen',
            ],
        },
        {
            h: '8. Konten, Gäste und deine Decks',
            paragraphs: [
                'Du kannst als Gast einer Partie beitreten. Ein Konto ist für Profil und gespeicherte Decks. Du bist für das verantwortlich, was du veröffentlichst. Decks bleiben deine; machst du sie öffentlich, räumst du uns eine nicht-exklusive Lizenz ein, sie zu hosten und anzuzeigen. Wir können Inhalte entfernen, die diese Bedingungen oder Rechte Dritter verletzen.',
            ],
        },
        {
            h: '9. Verfügbarkeit und Haftung',
            paragraphs: [
                'Der Dienst wird „wie besehen“ angeboten. Wir können ihn ohne Vorankündigung unterbrechen, ändern oder korrigieren. Soweit gesetzlich zulässig haften wir nicht für indirekte Schäden, Datenverlust oder Ausfälle. Zwingende Verbraucherrechte in der EU bleiben unberührt.',
            ],
        },
        {
            h: '10. Änderungen und anwendbares Recht',
            paragraphs: [
                'Wir können diese Bedingungen aktualisieren. Es gilt das Datum oben auf der Seite. Soweit nicht zwingende Schutzvorschriften gelten, gilt italienisches Recht. Verbraucher in einem anderen EU-Land behalten die dort zwingenden Schutzrechte.',
            ],
        },
    ],
};

const pt: TermsCopy = {
    title: 'Termos de serviço',
    updated: 'Última atualização: 8 de setembro de 2026',
    sections: [
        {
            h: '1. O que é o PlayTCG.Online',
            paragraphs: [
                'PlayTCG.Online é uma mesa virtual para jogar TCG de papel à distância: vídeo, áudio, pontos de vida, fases, dados, busca de cartas e construção de decks. Não é um cliente oficial, não vende cartas e não substitui os jogos de papel. As cartas de papel são de vocês; as regras vocês aplicam, como numa mesa de verdade.',
                'PlayTCG.Online é um projeto da Be2Bit Ltd (Malta, VAT MT21599411).',
            ],
        },
        {
            h: '2. Aceitação',
            paragraphs: [
                'Ao usar o PlayTCG.Online você aceita estes termos e a política de privacidade. Se não concordar, não use o serviço. Se usar o site em nome de um menor, você confirma ser pai, mãe ou responsável e aceitar os termos por ele.',
            ],
        },
        {
            h: '3. Projeto não oficial',
            paragraphs: [
                'PlayTCG.Online é conteúdo fã não oficial. Não é aprovado, endossado, patrocinado nem afiliado aos donos dos jogos que você pode usar na mesa. Todas as marcas, logos, nomes, artes e materiais pertencem aos respectivos titulares. Não usamos os logos deles como marca do site.',
            ],
            list: [
                'Yu-Gi-Oh! é marca de Konami Digital Entertainment.',
                'Magic: The Gathering é marca de Wizards of the Coast LLC.',
                'Pokémon e Pokémon TCG são marcas de Nintendo, Creatures Inc., GAME FREAK inc. e The Pokémon Company.',
                'One Piece Card Game e Dragon Ball Super Card Game Fusion World são marcas da BANDAI e dos respectivos titulares e licenciadores.',
                'Riftbound e marcas associadas são da Riot Games, Inc.',
            ],
        },
        {
            h: '4. Magic: The Gathering e a Fan Content Policy',
            paragraphs: [
                'Para materiais de Magic: The Gathering, o PlayTCG.Online se apoia na Fan Content Policy da Wizards of the Coast. Em particular:',
                'PlayTCG.Online is unofficial Fan Content permitted under the Wizards of the Coast Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.',
                'A policy oficial é publicada pela Wizards of the Coast. Se a Wizards pedir para alterar ou remover materiais, faremos isso.',
            ],
        },
        {
            h: '5. Outros jogos',
            paragraphs: [
                'Para Yu-Gi-Oh!, Pokémon, One Piece, Dragon Ball (Fusion World) e Riftbound nem sempre existe uma fan content policy pública equivalente à da Wizards. Mostramos nomes, textos e imagens das cartas só para identificá-las na mesa e no deck builder, sem apresentar o site como produto oficial. A Riot Games não endossa este projeto; Riftbound na mesa é o jogo de papel, não um clone digital com regras automáticas.',
            ],
        },
        {
            h: '6. Imagens e dados das cartas',
            paragraphs: [
                'Imagens e dados das cartas vêm de catálogos públicos de terceiros e, quando existem, de recursos públicos das editoras. Usamos só para você encontrar e mostrar uma carta. Não reivindicamos a propriedade de artes, textos ou mecânicas.',
            ],
            list: [
                'Yu-Gi-Oh!: YGOPRODeck',
                'Magic: The Gathering: Scryfall',
                'Pokémon: Pokémon TCG API (pokemontcg.io)',
                'One Piece: catálogos públicos da comunidade (incluindo DOTGG)',
                'Dragon Ball Fusion World: recursos públicos da editora',
            ],
        },
        {
            h: '7. O que você não pode fazer',
            paragraphs: ['Entre outras coisas, você não pode:'],
            list: [
                'Se passar por Konami, Wizards, The Pokémon Company, Bandai, Riot ou PlayTCG.Online',
                'Vender, alugar ou distribuir cópias, proxies ou cartas falsificadas',
                'Usar o site para assédio, ameaças, conteúdo ilegal ou para violar direitos de terceiros',
                'Atacar, varrer ou saturar o serviço, ou copiar em massa os catálogos para um produto concorrente',
                'Contornar autenticação, limites ou medidas de segurança',
            ],
        },
        {
            h: '8. Contas, convidados e seus decks',
            paragraphs: [
                'Você pode entrar numa partida como convidado. A conta serve para perfil e decks salvos. Você é responsável pelo que publica. Os decks continuam seus; se os tornar públicos, você nos dá uma licença não exclusiva para hospedá-los e exibi-los. Podemos remover conteúdo que viole estes termos ou direitos de terceiros.',
            ],
        },
        {
            h: '9. Disponibilidade e responsabilidade',
            paragraphs: [
                'O serviço é oferecido “no estado em que se encontra”. Podemos interrompê-lo, alterá-lo ou corrigi-lo sem aviso. Na medida permitida pela lei, não respondemos por danos indiretos, perda de dados ou interrupções. Ficam resguardados os direitos obrigatórios dos consumidores da UE.',
            ],
        },
        {
            h: '10. Alterações e lei aplicável',
            paragraphs: [
                'Podemos atualizar estes termos. Vale a data no topo da página. Salvo normas obrigatórias que te protejam, aplica-se a lei italiana. Consumidores residentes noutro país da UE mantêm as proteções obrigatórias desse país.',
            ],
        },
    ],
};

export const TERMS: Record<Locale, TermsCopy> = { it, en, es, fr, de, pt };
