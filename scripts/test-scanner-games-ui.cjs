const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
 const base = process.env.BASE_URL || 'http://localhost:3101';
 const fixtures = [
  ['yugioh', '46986414', 'Dark Magician', '../scanner-cache/46986414.jpg'],
  ['pokemon', 'base1-4', 'Charizard', '.scanner-cache/pokemon/base1-4.webp'],
  ['magic', '00006596-1166-4a79-8443-ca9f82e6db4e', 'Kor Outfitter'],
  ['onepiece', 'EB01-001', 'Kouzuki Oden'],
  ['dragonball', 'FB01-001', 'Son Goku'],
  ['riftbound', 'ogn-275-298', 'Altar to Unity'],
 ].filter(([game]) => !process.argv[2] || process.argv.slice(2).includes(game));
 const browser = await chromium.launch({ channel: 'chrome', headless: true });
 try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = [], uploads = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() === 'POST' && request.url().includes('/scanner')) uploads.push(request.url()); });
  await page.goto(`${base}/scanner`);
  const ready = () => page.getByText('Pronto. Avvia la webcam oppure carica una foto.').waitFor({ timeout: 90000 });
  await ready();
  for (const [game, id, name, fixture] of fixtures) {
   await page.getByLabel('Gioco', { exact: false }).selectOption(game);
   await ready();
   assert.equal(await page.locator('h3').count(), 0, 'Previous game result must clear');
   await page.locator('input[type=file]').setInputFiles(fixture || `.scanner-cache/${game}/${encodeURIComponent(id)}.webp`);
   await page.getByRole('heading', { level: 3, name, exact: true }).waitFor({ timeout: 60000 });
   const image = page.getByAltText(`Carta riconosciuta: ${name}`);
   await image.waitFor();
   await image.evaluate(image => image.complete && image.naturalWidth ? true : new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; }));
   await page.setViewportSize({ width: 390, height: 844 });
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${game} mobile overflow`);
   console.log(JSON.stringify({ game, name, preview: await image.getAttribute('src'), dimensions: await image.evaluate(image => [image.naturalWidth, image.naturalHeight]) }));
   await page.setViewportSize({ width: 1280, height: 1000 });
  }
  // Returning to Yu-Gi-Oh must discard the previous game's result, including its image.
  await page.getByLabel('Gioco', { exact: false }).selectOption('yugioh'); await ready();
  assert.equal(await page.locator('h3').count(), 0);
  assert.equal(await page.locator('figure').count(), 0);
  for (const [url, expected] of [
   ['/api/scanner/catalog-image/unknown/FB01-001', 404],
   ['/api/scanner/catalog-image/onepiece/not-a-card', 404],
   ['/api/scanner/catalog-image/magic/%3Cbad%3E', 400],
  ]) assert.equal((await page.request.get(`${base}${url}`)).status(), expected, url);
  assert.deepEqual(errors, []);
  assert.deepEqual(uploads, [], 'Camera/photo pixels must not be uploaded');
  console.log('PASS: selectors, cleared results, previews, mobile layout, invalid IDs, local processing');
  if (process.env.TEST_LIVE === '1') {
   await page.getByLabel('Gioco', { exact: false }).selectOption('dragonball'); await ready();
   await page.evaluate(async url => {
    const image = await createImageBitmap(await (await fetch(url)).blob());
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#30343b'; ctx.fillRect(0, 0, 640, 480); ctx.drawImage(image, 205, 75, 230, 330); image.close();
    window.testMedia = canvas.captureStream(15);
    navigator.mediaDevices.getUserMedia = async () => window.testMedia;
   }, `data:image/webp;base64,${fs.readFileSync('.scanner-cache/dragonball/FB01-001.webp').toString('base64')}`);
   await page.getByRole('button', { name: 'Avvia webcam' }).click();
   await page.getByRole('button', { name: 'Spegni webcam' }).waitFor();
   assert.equal(await page.getByLabel('Gioco', { exact: false }).isDisabled(), true);
   await page.getByRole('heading', { level: 3, name: 'Son Goku', exact: true }).waitFor({ timeout: 30000 });
   await page.getByRole('button', { name: 'Spegni webcam' }).click();
   assert.equal(await page.getByLabel('Gioco', { exact: false }).isEnabled(), true);
   console.log('PASS: simulated live video and selector locking');
  }
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
