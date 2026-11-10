import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

// Reuse our already-tested, immutable public preview instead of encoding these two
// unchanged catalogues again. These are reference images, never camera/user images.
const origin = 'https://yugioh-platform-kvfkcpved-narcangs-projects.vercel.app';
const hashes = {
 yugioh: '55bd6cf8c66ca144c3e9732d0a3e7dba26db669257ddce4ebd8b00b696ad88dc',
 pokemon: '17c0406b09dedcb4d7a10f2487cd1dd6119d8c79b59f60b1d369c35b9215e539',
};

export async function restoreScannerBaseline(game, outputRoot = 'public/scanner') {
 if (!Object.hasOwn(hashes, game)) return false;
 const controller = new AbortController();
 const out = path.resolve(outputRoot, game);
 async function download(file) {
  const response = await fetch(`${origin}/scanner/${game}/${file}`, {
   redirect: 'error', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]),
  });
  if (!response.ok) throw Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
 }
 try {
  const bytes = await download('index.json');
  if (createHash('sha256').update(bytes).digest('hex') !== hashes[game]) throw Error('Baseline index checksum mismatch');
  const index = JSON.parse(bytes);
  if (index.version !== 2 || !Array.isArray(index.entries)) throw Error('Incompatible baseline');
  const groups = new Map();
  for (const entry of index.entries) {
   if (!Number.isSafeInteger(entry.shard) || entry.shard < 0 || entry.shard > 10000) throw Error('Invalid shard');
   if (!groups.has(entry.shard)) groups.set(entry.shard, []);
   groups.get(entry.shard).push(entry.artId);
  }
  const jobs = [...groups]; let cursor = 0, completed = 0;
  await fs.mkdir(out, { recursive: true });
  async function worker() {
   while (cursor < jobs.length) {
    const [shard, ids] = jobs[cursor++], data = await download(`refs-${shard}.json`);
    if (data.length > 2 * 1024 * 1024) throw Error('Oversized reference pack');
    const pack = JSON.parse(data);
    if (ids.some(id => typeof pack[id] !== 'string' || !pack[id].length)) throw Error('Incomplete reference pack');
    await fs.writeFile(path.join(out, `refs-${shard}.json`), data);
    completed++;
    if (completed % 500 === 0 || completed === jobs.length) console.log(`${game} restored: ${completed}/${jobs.length} packs`);
   }
  }
  await Promise.all(Array.from({ length: 32 }, worker));
  await fs.writeFile(path.join(out, 'index.json'), bytes);
  console.log(`${game}: reused verified baseline (${index.entries.length} references)`);
  return true;
 } catch (error) {
  controller.abort();
  console.warn(`${game}: baseline unavailable (${error.message}); rebuilding from source`);
  return false;
 }
}
