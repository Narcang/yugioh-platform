# Multi-game scanner preview

The `/scanner` lab now selects Yu-Gi-Oh! or Pokémon. Switching games stops the old stream, terminates its worker, clears results and loads only the selected index. In-flight work from the old game cannot identify cards in the new game.

Pokémon references are read from the existing public `pokemon_cards` table through the anonymous Data API. No schema, accounts, decks or room state are changed. The catalogue builder requires the project's existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; no service-role key is used.

Each Pokémon card gets two reference crops: regular illustration and almost-full-card. Full-art variants work best with the complete upright card visible. Boundary-free illustration search uses a wider Pokémon artwork window. The worker preserves geometric confirmation thresholds and multi-frame confirmation.

Pokémon printings can share exactly the same illustration. The scanner groups competing references by card name for the confirmation margin and clearly labels the selected printing as a catalogue reference. Physical edition, language, foil finish and exact printing are not verified. This is an experimental artwork/name recognizer, not a collection valuation or printing authentication tool.

Generated Pokémon assets stay out of Git. Images are downloaded once from the two hosts already present in the catalogue (`images.pokemontcg.io`, `images.scrydex.com`), resized and re-hosted in small packs. Unavailable images are counted and excluded; a build fails if more than 1% (or five cards for a small catalogue) are missing. First build can take several minutes. Vercel source-image caches live under `.next/cache/scanner` for reuse on subsequent builds.

The full-card preview uses a same-origin route that looks up the public catalogue ID, restricts the upstream to these HTTPS hosts, validates the image content type, and caches the response. Camera frames continue to stay on the device.

Validation snapshot: 20,392 cards / 40,784 crop references available; 52 source images returned unavailable. Anonymous catalogue pagination returned all 20,444 records. The compact 8×8 shortlist index is approximately 9.5 MB uncompressed. Eleven representative cards (classic Pokémon, trainer, basic energy, VMAX, VSTAR, illustration rare, a recent Scrydex card and Unown question-mark ID) were tested clean, pixelated and rotated on a background: 33/33 card names recognized in one continuous worker sequence. Later variants exercise tracking. A shared-art energy resolved to another printing, confirming the need for the reference-printing notice. Yu-Gi-Oh regression: 60/60 identities; blank and wrong-game frames rejected. Game switching clears the old result, both preview providers and a punctuation ID load, a missing ID returns 404, and mobile layout has no horizontal overflow. These are synthetic/reference-image checks; real Pokémon webcam/language/foil tests are still required.
