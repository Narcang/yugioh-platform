/* Local worker: video frames never leave the device. OpenCV 4.12, Apache-2.0. */
let cvReadyResolve;
const cvReady = new Promise(resolve => { cvReadyResolve = resolve; });
self.Module = { onRuntimeInitialized() { cvReadyResolve(); } };
importScripts('/scanner/opencv.js');
if (self.cv?.Mat) cvReadyResolve();
else if (self.cv) self.cv.onRuntimeInitialized = () => cvReadyResolve();
let entries = [], ready = false;
const shards = new Map();
function normalized(bytes) {
 const mean = bytes.reduce((a,b)=>a+b,0)/bytes.length;
 let norm=0;
 const vector=Float32Array.from(bytes, b=>{const v=b-mean;norm+=v*v;return v;});
 norm=Math.sqrt(norm)||1;
 for(let i=0;i<vector.length;i++)vector[i]/=norm;
 return vector;
}
function vector(mat) {
 const small=new cv.Mat(), gray=new cv.Mat();
 try { cv.cvtColor(mat,gray,cv.COLOR_RGBA2GRAY); cv.resize(gray,small,new cv.Size(16,16),0,0,cv.INTER_AREA); return normalized(small.data); }
 finally{small.delete();gray.delete();}
}
function art(card,pendulum) {
 const r=pendulum?[.07,.18,.86,.43]:[.12,.18,.76,.52];
 const crop=card.roi(new cv.Rect(Math.round(card.cols*r[0]),Math.round(card.rows*r[1]),Math.round(card.cols*r[2]),Math.round(card.rows*r[3])));
 const result=new cv.Mat();
 cv.resize(crop,result,new cv.Size(192,192));crop.delete();return result;
}
function extract(frame) {
 const gray=new cv.Mat(), blur=new cv.Mat(), edges=new cv.Mat(), contours=new cv.MatVector(), hierarchy=new cv.Mat();
 let points=null, best=0;
 try {
  cv.cvtColor(frame,gray,cv.COLOR_RGBA2GRAY);cv.GaussianBlur(gray,blur,new cv.Size(5,5),0);cv.Canny(blur,edges,35,110);
  const kernel=cv.Mat.ones(5,5,cv.CV_8U);
  try{cv.morphologyEx(edges,edges,cv.MORPH_CLOSE,kernel);}finally{kernel.delete();}
  cv.findContours(edges,contours,hierarchy,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
  for(let i=0;i<contours.size();i++){
   const c=contours.get(i), approx=new cv.Mat();
   try{
    const area=cv.contourArea(c);
    if(area<frame.rows*frame.cols*.07||area>frame.rows*frame.cols*.97||area<=best)continue;
    cv.approxPolyDP(c,approx,cv.arcLength(c,true)*.025,true);
    if(approx.rows!==4||!cv.isContourConvex(approx))continue;
    const p=Array.from({length:4},(_,j)=>({x:approx.data32S[j*2],y:approx.data32S[j*2+1]}));
    const sums=p.map(v=>v.x+v.y), diffs=p.map(v=>v.x-v.y);
    const ordered=[p[sums.indexOf(Math.min(...sums))],p[diffs.indexOf(Math.max(...diffs))],p[sums.indexOf(Math.max(...sums))],p[diffs.indexOf(Math.min(...diffs))]];
    if(new Set(ordered).size!==4)continue;
    const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    const ratio=(dist(ordered[0],ordered[1])+dist(ordered[2],ordered[3]))/(dist(ordered[0],ordered[3])+dist(ordered[1],ordered[2]));
    if(ratio<.48||ratio>.88)continue;
    points=ordered;best=area;
   }finally{c.delete();approx.delete();}
  }
 }finally{gray.delete();blur.delete();edges.delete();contours.delete();hierarchy.delete();}
 let detected=!!points;
 if(!points){
  // Explicit guide, not a claim of automatic detection.
  const h=frame.rows*.86,w=h*252/366,x=(frame.cols-w)/2,y=(frame.rows-h)/2;
  if(Math.abs(frame.cols/frame.rows-252/366)<.09)points=[{x:0,y:0},{x:frame.cols-1,y:0},{x:frame.cols-1,y:frame.rows-1},{x:0,y:frame.rows-1}];
  else points=[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
 }
 const src=cv.matFromArray(4,1,cv.CV_32FC2,points.flatMap(p=>[p.x,p.y]));
 const dst=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,251,0,251,365,0,365]);
 const transform=cv.getPerspectiveTransform(src,dst), card=new cv.Mat();
 try{cv.warpPerspective(frame,card,transform,new cv.Size(252,366));return {card,detected,points};}
 finally{src.delete();dst.delete();transform.delete();}
}
async function reference(entry) {
 let promise=shards.get(entry.shard);
 if(!promise){
  promise=fetch(`/scanner/yugioh/refs-${entry.shard}.json`).then(r=>{if(!r.ok)throw Error('Riferimenti non disponibili');return r.json();});
  shards.set(entry.shard,promise);
  if(shards.size>16)shards.delete(shards.keys().next().value);
 }
 try {
  const data=await promise, binary=atob(data[entry.artId]);
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/jpeg'}));
  const canvas=new OffscreenCanvas(bitmap.width,bitmap.height), ctx=canvas.getContext('2d');
  ctx.drawImage(bitmap,0,0);bitmap.close();return cv.matFromImageData(ctx.getImageData(0,0,canvas.width,canvas.height));
 }catch(e){shards.delete(entry.shard);throw e;}
}
function features(image) {
 const gray=new cv.Mat(), keys=new cv.KeyPointVector(), desc=new cv.Mat(), mask=new cv.Mat();
 // Smaller edge threshold retains useful points in low-resolution artwork.
 const orb=new cv.ORB(500,1.2,8,12,0,2,cv.ORB_HARRIS_SCORE,31,10);
 try{cv.cvtColor(image,gray,cv.COLOR_RGBA2GRAY);orb.detectAndCompute(gray,mask,keys,desc);return {keys,desc};}
 finally{gray.delete();mask.delete();orb.delete();}
}
function geometric(query,ref) {
 const matcher=new cv.BFMatcher(cv.NORM_HAMMING,false), matches=new cv.DMatchVectorVector();
 let src,dst,h,mask;
 try{
  if(query.desc.rows<8||ref.desc.rows<8)return {inliers:0,ratio:0};
  matcher.knnMatch(query.desc,ref.desc,matches,2);
  const qp=[],rp=[];
  for(let i=0;i<matches.size();i++){
   const pair=matches.get(i);
   try{if(pair.size()<2)continue;const a=pair.get(0),b=pair.get(1);if(a.distance<.75*b.distance&&a.distance<65){const q=query.keys.get(a.queryIdx).pt,r=ref.keys.get(a.trainIdx).pt;qp.push(q.x,q.y);rp.push(r.x,r.y);}}finally{pair.delete();}
  }
  if(qp.length<8)return {inliers:0,ratio:0};
  src=cv.matFromArray(qp.length/2,1,cv.CV_32FC2,qp);dst=cv.matFromArray(rp.length/2,1,cv.CV_32FC2,rp);mask=new cv.Mat();
  h=cv.findHomography(src,dst,cv.RANSAC,4,mask);
  if(h.empty())return {inliers:0,ratio:0};
  const inliers=Array.from(mask.data).reduce((a,b)=>a+b,0);
  return {inliers,ratio:inliers/(qp.length/2)};
 }finally{matcher.delete();matches.delete();src?.delete();dst?.delete();h?.delete();mask?.delete();}
}
self.onmessage=async ({data})=>{
 try{
  if(data.type==='init'){
   await cvReady;
   const response=await fetch('/scanner/yugioh/index.json');if(!response.ok)throw Error('Catalogo scanner non disponibile');
   const index=await response.json();
   entries=index.entries.map(e=>({...e,vector:normalized(Uint8Array.from(atob(e.gray),c=>c.charCodeAt(0)))}));
   ready=true;self.postMessage({type:'ready',count:entries.length,failures:index.failures});return;
  }
  if(data.type!=='scan'||!ready)return;
  const frame=cv.matFromImageData(data.image), extracted=extract(frame), normal=art(extracted.card,false), pendulum=art(extracted.card,true);
  let qn,qp;
  try{
   const vn=vector(normal),vp=vector(pendulum);
   const ranked=entries.map(e=>{const q=e.pendulum?vp:vn;let dot=0;for(let i=0;i<256;i++)dot+=q[i]*e.vector[i];return {entry:e,similarity:dot};}).sort((a,b)=>b.similarity-a.similarity).slice(0,12);
   qn=features(normal);qp=features(pendulum);
   const candidates=[];
   for(const candidate of ranked){
    const image=await reference(candidate.entry);let f;
    try{f=features(image);const g=geometric(candidate.entry.pendulum?qp:qn,f);candidates.push({id:candidate.entry.id,name:candidate.entry.name,artId:candidate.entry.artId,similarity:candidate.similarity,...g});}
    finally{image.delete();f?.keys.delete();f?.desc.delete();}
   }
   candidates.sort((a,b)=>b.inliers-a.inliers||b.similarity-a.similarity);
   const winner=candidates[0], runner=candidates.find(c=>c.id!==winner.id);
   const match=winner.inliers>=10&&winner.ratio>=.5&&(!runner||winner.inliers>=runner.inliers*1.5+2);
   self.postMessage({type:'result',match,candidate:match?winner:null,candidates:candidates.slice(0,3),detected:extracted.detected,points:extracted.points});
  }finally{frame.delete();extracted.card.delete();normal.delete();pendulum.delete();qn?.keys.delete();qn?.desc.delete();qp?.keys.delete();qp?.desc.delete();}
 }catch(error){self.postMessage({type:'error',message:error.message||'Errore durante il riconoscimento'});}
};
