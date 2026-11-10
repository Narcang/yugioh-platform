/* Integration check against a running /scanner preview and locally generated reference images.
 * BASE_URL defaults to http://localhost:3101. No webcam frames or user photos are used.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const { chromium } = require('playwright');

(async () => {
 const base = process.env.BASE_URL || 'http://localhost:3101';
 const games = process.argv.slice(2);
 if (!games.length) games.push('magic', 'onepiece', 'dragonball', 'riftbound');
 const browser = await chromium.launch({ channel: 'chrome', headless: true });
 try {
  const page = await browser.newPage();
  await page.goto(`${base}/scanner`);
  const results = [];
  for (const game of games) {
   const catalog = JSON.parse(await fs.readFile(`.scanner-cache/${game}/catalog.json`));
   const types = game === 'magic' ? ['^split$', '^saga$', '^transform$', '^adventure$', '^planar$', '^modal_dfc$', '^flip$'] : ['LEADER|Legend', 'Event|Spell|Extra', 'Battlefield|Land', 'CHARACTER|Unit|BATTLE'];
   const cards = [catalog[0], ...types.map(type => catalog.find(card => new RegExp(type, 'i').test(card.card_type || card.layout || ''))), catalog[Math.floor(catalog.length / 2)], catalog.at(-1)]
    .filter((card, i, list) => card && list.findIndex(other => other?.id === card.id) === i);
   for (const card of cards) {
    let source;
    try { source = await fs.readFile(path.join('.scanner-cache', game, `${encodeURIComponent(card.id)}.webp`)); }
    catch { continue; }
    for (const kind of ['clean', 'pixel', 'table']) {
     let data = source;
     if (kind === 'pixel') data = await sharp(source).resize(100, 145, { fit: 'fill' }).jpeg({ quality: 45 }).toBuffer();
     if (kind === 'table') {
      const rotated = await sharp(source).resize(230).rotate(8, { background: '#30343b' }).png().toBuffer();
      const meta = await sharp(rotated).metadata();
      data = await sharp({ create: { width: 640, height: 480, channels: 3, background: '#30343b' } })
       .composite([{ input: rotated, left: Math.round((640 - meta.width) / 2), top: Math.round((480 - meta.height) / 2) }]).png().toBuffer();
     }
     // Every sample starts cold: no previous artwork match can make the test pass.
     const result = await page.evaluate(async ({ game, data }) => {
      window.testWorker?.terminate();
      const worker = window.testWorker = new Worker('/scanner/worker.js');
      await new Promise((resolve, reject) => {
       worker.onerror = reject;
       worker.onmessage = ({ data }) => { if (data.type === 'ready') resolve(); if (data.type === 'error') reject(Error(data.message)); };
       worker.postMessage({ type: 'init', game });
      });
      const bitmap = await createImageBitmap(await (await fetch(data)).blob());
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height), ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0); bitmap.close();
      return new Promise((resolve, reject) => {
       worker.onmessage = ({ data }) => { if (data.type === 'result') resolve(data); if (data.type === 'error') reject(Error(data.message)); };
       worker.postMessage({ type: 'scan', image: ctx.getImageData(0, 0, canvas.width, canvas.height) });
      });
     }, { game, data: `data:image/png;base64,${data.toString('base64')}` });
     const identity = game === 'magic' ? card.oracle_id || card.id : game === 'onepiece' && card.card_type === 'DON' ? 'don' : game === 'dragonball' && card.card_type === 'ENERGY MARKER' ? 'energy-marker' : card.id;
     const correct = result.match && result.candidate?.identity === identity;
     const row = { game, id: card.id, name: card.name, kind, correct, found: result.candidate?.id, ms: result.ms, candidates: result.candidates?.map(c => [c.id, c.inliers]), ...(!correct ? { detected: result.detected, points: result.points } : {}) };
     results.push(row); console.log(JSON.stringify(row));
    }
   }
  }
  await fs.writeFile('../multigame-benchmark.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ total: results.length, passed: results.filter(r => r.correct).length, failed: results.filter(r => !r.correct) }));
  assert.ok(results.length >= games.length * 9, 'Not enough fixtures');
  assert.ok(results.every(row => row.correct), 'Recognition regression');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
