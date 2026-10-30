import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await fs.mkdir('public/scanner', { recursive: true });
await fs.copyFile('node_modules/@techstark/opencv-js/dist/opencv.js', 'public/scanner/opencv.js');
if(process.env.VERCEL&&!process.env.SCANNER_CACHE_DIR)process.env.SCANNER_CACHE_DIR='.next/cache/scanner';
for(const [game,version,script] of [['yugioh',2,'scripts/build-scanner-index.mjs'],['pokemon',2,'scripts/build-pokemon-scanner-index.mjs']]){
 try {const index=JSON.parse(await fs.readFile(`public/scanner/${game}/index.json`,'utf8'));if(index.version!==version)throw Error('Rebuild required');}
 catch {const result=spawnSync(process.execPath,[script],{stdio:'inherit',env:process.env});if(result.status!==0)process.exit(result.status||1);}
}
