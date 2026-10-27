import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await fs.mkdir('public/scanner', { recursive: true });
await fs.copyFile('node_modules/@techstark/opencv-js/dist/opencv.js', 'public/scanner/opencv.js');
try { await fs.access('public/scanner/yugioh/index.json'); }
catch {
 const result = spawnSync(process.execPath, ['scripts/build-scanner-index.mjs'], { stdio: 'inherit' });
 if (result.status !== 0) process.exit(result.status || 1);
}
