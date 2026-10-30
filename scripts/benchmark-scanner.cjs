const fs=require('fs/promises');const sharp=require('sharp');const path=require('path');const cache=process.env.SCANNER_CACHE_DIR||'.scanner-cache';
const {chromium}=require('playwright');
(async()=>{
 const catalog=JSON.parse(await fs.readFile(path.join(cache,'catalog.json'))).data;
 const ids=['46986414','89631139','74677422','55144522','53129443','44508094','33396948','16178681','84224627','18144506', ...catalog.filter(c=>c.frameType.includes('pendulum')).slice(0,5).map(c=>String(c.card_images[0].id))];
 const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();await page.goto((process.env.SCANNER_URL || 'http://localhost:3100/scanner'));
 await page.evaluate(()=>new Promise((resolve,reject)=>{window.testWorker=new Worker('/scanner/worker.js');window.testWorker.onmessage=({data})=>{if(data.type==='ready')resolve();if(data.type==='error')reject(Error(data.message))};window.testWorker.postMessage({type:'init'})}));
 const results=[];
 for(const id of ids){
  const input=await fs.readFile(path.join(cache,`${id}.jpg`));
  for(const kind of ['clean','blur','pixel','table']){
   let s=sharp(input);
   if(kind==='blur')s=s.blur(1.2);
   if(kind==='pixel')s=s.resize(84,123).jpeg({quality:30});
   let buffer=await s.toBuffer();
   if(kind==='table'){
    const card=await sharp(input).resize(210,308).rotate(12,{background:'#30343b'}).png().toBuffer();
    const m=await sharp(card).metadata();buffer=await sharp({create:{width:640,height:480,channels:3,background:'#30343b'}}).composite([{input:card,left:Math.round((640-m.width)/2),top:Math.round((480-m.height)/2)}]).png().toBuffer();
   }
   const start=Date.now();
   const r=await page.evaluate(async url=>{
    const im=await createImageBitmap(await (await fetch(url)).blob());const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);im.close();
    return await new Promise(resolve=>{window.testWorker.onmessage=({data})=>{if(data.type!=='progress')resolve(data)};window.testWorker.postMessage({type:'scan',image:ctx.getImageData(0,0,c.width,c.height)})});
   },'data:image/png;base64,'+buffer.toString('base64'));
   results.push({id,kind,match:r.match,found:r.candidate?.id,top:r.candidates?.[0]?.id,points:r.candidates?.[0]?.inliers,error:r.message,ms:Date.now()-start});
   console.log(JSON.stringify(results.at(-1)));
  }
 }
 const negative=await sharp({create:{width:640,height:480,channels:3,background:'#445566'}}).png().toBuffer();
 const n=await page.evaluate(async url=>{const im=await createImageBitmap(await(await fetch(url)).blob());const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);return await new Promise(resolve=>{window.testWorker.onmessage=({data})=>{if(data.type!=='progress')resolve(data)};window.testWorker.postMessage({type:'scan',image:ctx.getImageData(0,0,c.width,c.height)})})},'data:image/png;base64,'+negative.toString('base64'));
 console.log('NEGATIVE',n.match,n.message);
 const expected=id=>String(catalog.find(c=>c.card_images.some(im=>String(im.id)===id)).id);
 const failures=results.filter(r=>!r.match||r.found!==expected(r.id)||r.error);
 console.log('SUMMARY',JSON.stringify({total:results.length,correct:results.length-failures.length,failures,negativeRejected:n.match===false}));
 if(failures.length||n.match!==false)process.exitCode=1;
 await fs.writeFile('../scanner-results.json',JSON.stringify({results,negative:n},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
