import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const cache = path.resolve(process.env.SCANNER_CACHE_DIR || '.scanner-cache');
const out = path.resolve('public/scanner/yugioh');
await fs.mkdir(cache, { recursive: true });
await fs.mkdir(out, { recursive: true });
const snapshot = path.join(cache, 'catalog.json');
let catalog;
try { catalog = JSON.parse(await fs.readFile(snapshot, 'utf8')).data; }
catch { const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php'); if (!response.ok) throw Error('Catalog download failed'); const body = await response.text(); catalog = JSON.parse(body).data; await fs.writeFile(snapshot, body); }
const jobs = catalog.flatMap(card => card.card_images.map(image => ({ card, image })));
const entries = [], shards = Array.from({ length: 128 }, () => ({}));
let cursor = 0, failures = 0;
async function worker() {
 while (cursor < jobs.length) {
  const { card, image } = jobs[cursor++];
  const file = path.join(cache, `${image.id}.jpg`);
  try {
   let buffer;
   try { buffer = await fs.readFile(file); }
   catch {
    const response = await fetch(image.image_url_small, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(file, buffer);
   }
   const { width, height } = await sharp(buffer).metadata();
   const pendulum = card.frameType.includes('pendulum');
   const rect = pendulum ? [.07, .18, .86, .43] : [.12, .18, .76, .52];
   const art = await sharp(buffer).extract({ left: Math.round(width * rect[0]), top: Math.round(height * rect[1]), width: Math.round(width * rect[2]), height: Math.round(height * rect[3]) }).resize(192, 192, { fit: 'fill' }).webp({ quality: 55 }).toBuffer();
   const gray = await sharp(art).resize(16, 16, { fit: 'fill', kernel: 'linear' }).greyscale().raw().toBuffer();
   const shard = Number(image.id) % 128;
   entries.push({ id: String(card.id), artId: String(image.id), name: card.name, pendulum, gray: gray.toString('base64'), shard });
   shards[shard][image.id] = art.toString('base64');
  } catch (error) { failures++; console.error(image.id, error.message); }
  if ((entries.length + failures) % 250 === 0) console.log(`${entries.length}/${jobs.length}, failed ${failures}`);
 }
}
await Promise.all(Array.from({ length: 6 }, worker));
entries.sort((a, b) => a.artId.localeCompare(b.artId));
for (let i = 0; i < shards.length; i++) await fs.writeFile(path.join(out, `refs-${i}.json`), JSON.stringify(shards[i]));
await fs.writeFile(path.join(out, 'index.json'), JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), total: jobs.length, failures, entries }));
console.log(`Done: ${entries.length} artworks, ${failures} failures`);
