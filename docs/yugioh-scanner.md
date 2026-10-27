# Yu-Gi-Oh! visual scanner preview

Open `/scanner` in an HTTPS browser. This is an isolated test page; the match table and the disabled legacy `/api/identify` route are unchanged.

## Recognition

- Download a local reference index, then process frames inside a Web Worker using OpenCV 4.12 (Apache-2.0).
- Detect a quadrilateral card boundary and correct perspective. When detection fails, use the visible central guide. Cards should be upright and occupy a substantial part of the frame.
- Compare normalized grayscale artwork thumbnails to shortlist twelve references, using separate crops for regular and Pendulum cards. If the outer boundary is missing or occluded, search eighty central square windows across four scales and verify up to sixteen artwork candidates geometrically; the guide is no longer assumed to be the actual card boundary.
- Match ORB keypoints, apply the nearest-neighbor ratio test, and require a coherent RANSAC homography. Confirm only with at least ten inliers, a 50% inlier ratio, and a margin over a different card ID. Live video requires the same ID in two consecutive results.
- Return the canonical card ID, including for alternate artwork IDs. The name is the English catalogue name. Edition, rarity, print language and serial/set-code OCR are not inferred.
- Webcam frames and uploaded photos stay on the device. Only same-origin reference index/shards are fetched. No recognition service, database mutation, or secret key is required.

## Reference data

Snapshot from the same YGOPRODeck provider used by the existing Yu-Gi-Oh! integration: 14,645 cards, 14,817 illustrations, zero download failures. Reference artwork is downloaded once, cropped, and re-hosted in 128 compressed shards; the application never hotlinks the provider during scans. Source: https://ygoprodeck.com/api-guide/

`node scripts/build-scanner-index.mjs` rebuilds from a cached provider snapshot under `.scanner-cache` (override with `SCANNER_CACHE_DIR`), downloading missing source images once. Remove the cached `catalog.json` deliberately when updating the snapshot. Generated references and the OpenCV distribution are excluded from Git. `prebuild` copies the pinned OpenCV package and generates the catalogue once during the Vercel build. That first build requires access to the provider API and image CDN and can take several minutes. The browser subsequently fetches only the generated same-origin assets.

## Verification

`node scripts/benchmark-scanner.cjs` runs against `SCANNER_URL` (default `http://localhost:3100/scanner`) using installed Chrome and the cached images from the index builder (set `SCANNER_CACHE_DIR` when using a different cache location). Fifteen cards, including five Pendulum cards and an alternate illustration, each tested clean, blurred, reduced to 84 x 123 with JPEG quality 30, and rotated on a background: 60/60 canonical identities correct. A blank frame was rejected. Local synthetic timings were approximately 0.2–0.65 seconds per frame after initialization; they are not device performance guarantees.

These synthetic tests derive from catalogue reference images. They do not validate real webcams, reflections, sleeves, extreme perspective, partial occlusion, adversarial false positives, all cards, or physical cards in other languages. A real-card test is required before production rollout. In particular, sharing an illustration across languages is the basis for language independence; it has not yet been physically tested.

TypeScript and targeted ESLint checks pass. A local production build uses placeholder Supabase values to satisfy pre-existing modules; deployed preview must use the project's existing Preview environment settings.

Real-camera regression: an additional frame with an occluded outer border is recognized with 81 geometrically consistent points through the window fallback. A heavily blurred frame remains unconfirmed. Personal camera images are not included in the repository.
