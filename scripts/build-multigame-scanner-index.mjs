import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const games = JSON.parse(await fs.readFile('src/lib/scanner-games.json', 'utf8'));
const game = process.argv[2], config = games[game];
if (!config?.table) throw Error('Choose magic, onepiece, dragonball or riftbound');
const cache = path.resolve(process.env.SCANNER_CACHE_DIR || '.scanner-cache', game);
const out = path.resolve('public/scanner', game);
await fs.mkdir(cache, { recursive: true });
await fs.mkdir(out, { recursive: true });

let cards;
try { cards = JSON.parse(await fs.readFile(path.join(cache, 'catalog.json'), 'utf8')); }
catch {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if (!url || !key) throw Error('Public catalogue configuration is required');
 cards = [];
 for (let offset = 0; ; offset += 1000) {
  const response = await fetch(`${url}/rest/v1/${config.table}?select=${config.select}&order=id&offset=${offset}&limit=1000`, {
   headers: { apikey: key }, signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw Error(`${game} catalogue HTTP ${response.status}`);
  const batch = await response.json();
  cards.push(...batch);
  if (batch.length < 1000) break;
 }
 if (cards.length < config.minCards) throw Error(`${game} catalogue unexpectedly incomplete: ${cards.length}`);
 await fs.writeFile(path.join(cache, 'catalog.json'), JSON.stringify(cards));
}
if (cards.length < config.minCards) throw Error(`${game} cached catalogue unexpectedly incomplete`);

const entries = [], packs = new Map(), failures = [];
let cursor = 0, completed = 0;
// Limit work in flight and flush each small pack instead of retaining a whole catalogue of images.
async function processCard(card, i) {
 const file = path.join(cache, `${encodeURIComponent(card.id)}.webp`);
 let source;
 try { source = await fs.readFile(file); }
 catch {
  const url = new URL(card.image_url || card.image_large);
  if (url.protocol !== 'https:' || url.port || url.username || url.password || !config.hosts.includes(url.hostname)) throw Error('Unsupported image source');
  let lastError;
  for (let retry = 0; retry < 3; retry++) {
   try {
    const response = await fetch(url, { headers: { 'User-Agent': 'PlayTCG-Scanner/1.0 (https://playtcg.online)', Accept: 'image/webp,image/jpeg,image/png' }, redirect: 'error', signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 5 * 1024 * 1024) throw Error('Image too large');
    source = await sharp(bytes).rotate().resize({ width: 320, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    break;
   } catch (error) {
    lastError = error;
    if (/HTTP 40[034]/.test(error.message)) break;
    await new Promise(resolve => setTimeout(resolve, 500 * (retry + 1)));
   }
  }
  if (!source) throw lastError;
  await fs.writeFile(file, source);
 }
 const { width, height } = await sharp(source).metadata();
 const refs = {}, rows = [];
 for (const [j, cropMode] of ['regular', 'full'].entries()) {
  const rect = config[cropMode];
  const art = await sharp(source).extract({
   left: Math.round(width * rect[0]), top: Math.round(height * rect[1]),
   width: Math.round(width * rect[2]), height: Math.round(height * rect[3]),
  }).resize(192, 192, { fit: 'fill' }).webp({ quality: 55 }).toBuffer();
  const gray = await sharp(art).resize(8, 8, { fit: 'fill', kernel: 'linear' }).greyscale().raw().toBuffer();
  const artId = `${card.id}~${cropMode}`;
  const identity = game === 'magic' ? card.oracle_id || card.id
   : game === 'onepiece' && card.card_type === 'DON' ? 'don'
   : game === 'dragonball' && card.card_type === 'ENERGY MARKER' ? 'energy-marker' : card.id;
  rows.push({ id: card.id, artId, identity,
   name: card.name, cropMode, gray: gray.toString('base64'), shard: Math.floor((i * 2 + j) / 8),
   setName: card.set_name || card.set_code, number: card.collector_number || card.id });
  refs[artId] = art.toString('base64');
 }
 entries.push(...rows);
 return refs;
}
async function worker() {
 while (cursor < cards.length) {
  const i = cursor++, shard = Math.floor(i / 4);
  let pack = packs.get(shard);
  if (!pack) { pack = { done: 0, refs: {} }; packs.set(shard, pack); }
  try { Object.assign(pack.refs, await processCard(cards[i], i)); }
  catch (error) { failures.push({ id: cards[i].id, reason: error.message }); }
  pack.done++;
  if (pack.done === Math.min(4, cards.length - shard * 4)) {
   await fs.writeFile(path.join(out, `refs-${shard}.json`), JSON.stringify(Object.fromEntries(Object.entries(pack.refs).sort(([a], [b]) => a.localeCompare(b)))));
   packs.delete(shard);
  }
  completed++;
  if (completed % 500 === 0 || completed === cards.length) console.log(`${game}: ${completed}/${cards.length}, unavailable ${failures.length}`);
 }
}
await Promise.all(Array.from({ length: 12 }, worker));
if (failures.length > Math.max(5, cards.length * .01)) throw Error(`${game}: too many unavailable images: ${failures.length}/${cards.length}`);
entries.sort((a, b) => a.artId.localeCompare(b.artId));
const profile = { regular: config.regular, full: config.full };
await fs.writeFile(path.join(out, 'index.json'), JSON.stringify({ version: 1, game, hashSize: 8,
 profile, profileHash: createHash('sha256').update(JSON.stringify(profile)).digest('hex'),
 generatedAt: new Date().toISOString(), total: cards.length, failures: failures.length, entries }));
await fs.writeFile(path.join(cache, 'unavailable.json'), JSON.stringify(failures, null, 2));
console.log(`${game} ready: ${cards.length - failures.length} cards, ${entries.length} references`);
