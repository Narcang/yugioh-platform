'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './ScannerLab.module.css';

type Candidate = { id: string; name: string; artId: string; inliers: number; ratio: number; similarity: number };
type ScanResult = { match: boolean; candidate: Candidate | null; candidates: Candidate[]; detected: boolean };

export default function ScannerLab() {
 const video = useRef<HTMLVideoElement>(null);
 const worker = useRef<Worker | null>(null);
 const stream = useRef<MediaStream | null>(null);
 const busy = useRef(false);
 const live = useRef(false);
 const pending = useRef<{ id: string; count: number }>({ id: '', count: 0 });
 const [ready, setReady] = useState(false);
 const [count, setCount] = useState(0);
 const [scanMs, setScanMs] = useState<number | null>(null);
 const [active, setActive] = useState(false);
 const [aspectRatio, setAspectRatio] = useState(4 / 3);
 const [status, setStatus] = useState('Caricamento del motore e del catalogo…');
 const [result, setResult] = useState<ScanResult | null>(null);
 const [confirmed, setConfirmed] = useState<Candidate | null>(null);

 useEffect(() => {
  const instance = new Worker('/scanner/worker.js');
  worker.current = instance;
  instance.onmessage = ({ data }) => {
   if (data.type === 'ready') { setReady(true); setCount(data.count); setStatus('Pronto. Avvia la webcam oppure carica una foto.'); return; }
   if (data.type === 'progress') { setStatus(data.message); return; }
   busy.current = false;
   if (data.type === 'error') { setStatus(data.message); return; }
   if (data.type === 'result') {
    if (typeof data.ms === 'number') setScanMs(data.ms);
    setResult(data);
    if (data.match && data.candidate) {
     const id = data.candidate.id;
     pending.current = { id, count: pending.current.id === id ? pending.current.count + 1 : 1 };
     if (!live.current || pending.current.count >= 2) { setConfirmed(data.candidate); setStatus('Carta riconosciuta.'); }
     else { setConfirmed(null); setStatus('Possibile corrispondenza: verifica sul prossimo fotogramma…'); }
    } else { pending.current = { id: '', count: 0 }; setConfirmed(null); setStatus(data.detected ? 'Carta rilevata, riconoscimento incerto. Avvicinala o riduci i riflessi.' : 'Allinea la carta alla guida e tienila ferma.'); }
   }
  };
  instance.onerror = () => { busy.current = false; setStatus('Impossibile avviare il motore. Ricarica la pagina e riprova.'); };
  instance.postMessage({ type: 'init' });
  return () => { live.current = false; stream.current?.getTracks().forEach(t => t.stop()); instance.terminate(); worker.current = null; };
 }, []);

 useEffect(() => {
  if (!active) return;
  const timer = window.setInterval(() => {
   const element = video.current;
   if (!element || !element.videoWidth || busy.current || !worker.current) return;
   const canvas = document.createElement('canvas');
   canvas.width = Math.min(800, element.videoWidth);
   canvas.height = Math.round(element.videoHeight * canvas.width / element.videoWidth);
   const ctx = canvas.getContext('2d', { willReadFrequently: true });
   if (!ctx) return;
   ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
   busy.current = true;
   worker.current.postMessage({ type: 'scan', image: ctx.getImageData(0, 0, canvas.width, canvas.height) });
  }, 300);
  return () => window.clearInterval(timer);
 }, [active]);

 async function start() {
  try {
   if (!navigator.mediaDevices?.getUserMedia) throw new Error('Webcam non disponibile. Usa HTTPS e consenti l’accesso alla fotocamera.');
   const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
   stream.current?.getTracks().forEach(t => t.stop());
   stream.current = media;
   if (video.current) { video.current.srcObject = media; await video.current.play(); }
   pending.current = { id: '', count: 0 }; setConfirmed(null); setResult(null);
   live.current = true; setActive(true); setStatus('Inquadra una carta intera, verticale, con luce uniforme.');
  } catch (error) { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; setStatus(error instanceof Error ? error.message : 'Accesso alla webcam non riuscito.'); }
 }
 function stop() { live.current = false; stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; if (video.current) video.current.srcObject = null; setActive(false); setStatus('Webcam spenta.'); }
 async function upload(file?: File) {
  if (!file || busy.current || !worker.current) return;
  if (file.size > 15 * 1024 * 1024) { setStatus('Scegli una foto inferiore a 15 MB.'); return; }
  stop(); setConfirmed(null); setResult(null); pending.current = { id: '', count: 0 };
  try {
   busy.current = true; setStatus('Analisi della foto…');
   const image = await createImageBitmap(file, { imageOrientation: 'from-image' });
   const canvas = document.createElement('canvas'); canvas.width = Math.min(1000, image.width); canvas.height = Math.round(image.height * canvas.width / image.width);
   const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Impossibile leggere la foto.');
   ctx.drawImage(image, 0, 0, canvas.width, canvas.height); image.close();
   worker.current.postMessage({ type: 'scan', image: ctx.getImageData(0, 0, canvas.width, canvas.height) });
  } catch { busy.current = false; setStatus('Foto non leggibile. Prova un file JPG, PNG o WebP.'); }
 }
 return <main className={styles.page}>
  <header className={styles.header}><Link href="/">← PlayTCG</Link><span className={styles.badge}>PROVA · YU-GI-OH!</span></header>
  <h1>La tua carta,<br /><span>riconosciuta dalla webcam.</span></h1>
  <p className={styles.intro}>Inquadra una carta alla volta. Il riconoscimento confronta l’illustrazione e i suoi punti visivi, anche se il testo è in un’altra lingua.</p>
  <div className={styles.layout}>
   <section className={styles.panel} aria-label="Acquisizione carta">
    <div className={styles.camera} style={{ aspectRatio }}>
     <video ref={video} autoPlay playsInline muted onLoadedMetadata={() => { if (video.current?.videoHeight) setAspectRatio(video.current.videoWidth / video.current.videoHeight); }} />
     {!active && <div className={styles.placeholder}>La webcam è spenta</div>}
     {active && <div className={styles.guide} />}
    </div>
    <div className={styles.controls}>
     <button disabled={!ready} onClick={active ? stop : start}>{active ? 'Spegni webcam' : 'Avvia webcam'}</button>
     <label className={!ready || active ? styles.disabled : ''}>Carica una foto<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!ready || active} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></label>
    </div>
    <p role="status" aria-live="polite" className={styles.status}>{status}</p>
    {scanMs !== null && <p className={styles.note}>Ultima analisi: {(scanMs / 1000).toFixed(1)} s</p>}
   </section>
   <section className={styles.panel} aria-label="Risultato">
    <h2>{confirmed ? 'Carta riconosciuta' : 'In attesa di una carta'}</h2>
    {confirmed ? <><h3>{confirmed.name}</h3><p>Identificativo: <strong>{confirmed.id}</strong></p><p>{confirmed.inliers} punti visivi coerenti.</p><p className={styles.note}>L’illustrazione identifica la carta. Edizione, lingua e rarità della stampa non sono determinate.</p></> : <p className={styles.note}>Il risultato viene confermato solo quando i dettagli visivi sono sufficienti. Con la webcam servono due letture consecutive.</p>}
    {!confirmed && !!result?.candidates.length && <details><summary>Possibili corrispondenze · non confermate</summary><ul>{result.candidates.map(c => <li key={c.artId}>{c.name} · {c.inliers} punti</li>)}</ul></details>}
    <hr /><p className={styles.note}>{count ? `${count.toLocaleString('it-IT')} illustrazioni di riferimento.` : 'Preparazione del catalogo…'} Le immagini della webcam e le foto caricate restano sul dispositivo.</p>
    <p className={styles.note}>Prima prova: carta verticale, intera e ben illuminata. Poi prova ad allontanarla, inclinarla e cambiare luce. Per ora nessuna lettura di codici o numeri seriali.</p>
   </section>
  </div>
 </main>;
}
