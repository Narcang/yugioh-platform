import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root=path.resolve(process.env.SCANNER_CACHE_DIR||'.scanner-cache');
const cache=path.join(root,'pokemon');
const out=path.resolve('public/scanner/pokemon');
await fs.mkdir(cache,{recursive:true});await fs.mkdir(out,{recursive:true});
let cards;
try{cards=JSON.parse(await fs.readFile(path.join(cache,'catalog.json'),'utf8'));}
catch{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw Error('Public Supabase configuration is required for the Pokémon catalogue');
 cards=[];
 for(let offset=0;;offset+=1000){
  const r=await fetch(`${url}/rest/v1/pokemon_cards?select=id,name,image_url,image_large,set_name,number&order=id&offset=${offset}&limit=1000`,{headers:{apikey:key},signal:AbortSignal.timeout(30000)});
  if(!r.ok)throw Error(`Pokémon catalogue HTTP ${r.status}`);
  const batch=await r.json();cards.push(...batch);if(batch.length<1000)break;
 }
 if(cards.length<1000)throw Error('Pokémon catalogue unexpectedly incomplete');
 await fs.writeFile(path.join(cache,'catalog.json'),JSON.stringify(cards));
}
const entries=[],packs=Array.from({length:Math.ceil(cards.length*2/8)},()=>({}));let cursor=0,failed=0;
async function worker(){while(cursor<cards.length){const i=cursor++,card=cards[i];try{
 let source;const file=path.join(cache,`${encodeURIComponent(card.id)}.webp`);
 try{source=await fs.readFile(file);}catch{
  const u=new URL(card.image_url);if(u.protocol!=='https:'||!['images.pokemontcg.io','images.scrydex.com'].includes(u.hostname))throw Error('Unsupported image source');
  let error;
  for(let retry=0;retry<3;retry++){try{const r=await fetch(u,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`HTTP ${r.status}`);source=await sharp(Buffer.from(await r.arrayBuffer())).resize({width:320,withoutEnlargement:true}).webp({quality:85}).toBuffer();break;}catch(e){error=e;await new Promise(r=>setTimeout(r,500*(retry+1)));}}
  if(!source)throw error;await fs.writeFile(file,source);
 }
 const {width,height}=await sharp(source).metadata();
 for(const [j,mode,rect]of [[0,'regular',[.08,.16,.84,.38]],[1,'full',[.025,.025,.95,.95]]]){
  const art=await sharp(source).extract({left:Math.round(width*rect[0]),top:Math.round(height*rect[1]),width:Math.round(width*rect[2]),height:Math.round(height*rect[3])}).resize(192,192,{fit:'fill'}).webp({quality:65}).toBuffer();
  const gray16=await sharp(art).resize(16,16,{fit:'fill',kernel:'linear'}).greyscale().raw().toBuffer(),gray=Buffer.alloc(64);
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){const p=y*32+x*2;gray[y*8+x]=Math.round((gray16[p]+gray16[p+1]+gray16[p+16]+gray16[p+17])/4);}
  const shard=Math.floor((i*2+j)/8),artId=`${card.id}~${mode}`;
  entries.push({id:card.id,artId,name:card.name,cropMode:mode,gray:gray.toString('base64'),shard,setName:card.set_name,number:card.number});packs[shard][artId]=art.toString('base64');
 }
 }catch(e){failed++;console.error(`Pokémon ${card.id}: ${e.message}`);}
 if((i+1)%250===0)console.log(`Pokémon ${i+1}/${cards.length}, failed ${failed}`);
}}
await Promise.all(Array.from({length:24},worker));
if(failed>Math.max(5,cards.length*.01))throw Error(`Too many missing Pokémon images: ${failed}/${cards.length}`);
entries.sort((a,b)=>a.artId.localeCompare(b.artId));
for(let i=0;i<packs.length;i++)await fs.writeFile(path.join(out,`refs-${i}.json`),JSON.stringify(Object.fromEntries(Object.entries(packs[i]).sort(([a],[b])=>a.localeCompare(b)))));
await fs.writeFile(path.join(out,'index.json'),JSON.stringify({version:2,hashSize:8,game:'pokemon',generatedAt:new Date().toISOString(),total:cards.length,failures:failed,entries}));
console.log(`Pokémon ready: ${cards.length-failed} cards, ${entries.length} references; missing ${failed}`);
