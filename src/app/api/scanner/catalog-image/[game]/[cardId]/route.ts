import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { isScannerGame, scannerGames } from '@/lib/scannerGames';

export async function GET(_request: NextRequest, context: { params: Promise<{ game: string; cardId: string }> }) {
 const { game, cardId } = await context.params;
 if (!isScannerGame(game) || game === 'yugioh' || game === 'pokemon') return new Response('Unknown game', { status: 404 });
 if (!/^[A-Za-z0-9][A-Za-z0-9.?!_-]{0,127}$/.test(cardId)) return new Response('Invalid card identifier', { status: 400 });
 const config = scannerGames[game];
 try {
  const { data, error } = await supabaseServer.from(config.table).select(config.select).eq('id', cardId).maybeSingle();
  if (error) return new Response('Catalogue unavailable', { status: 502 });
  if (!data) return new Response('Card not found', { status: 404 });
  // The table/columns/hosts are fixed per game; no arbitrary upstream URLs are accepted.
  const card = data as unknown as { image_large?: string; image_url?: string };
  const url = new URL(card.image_large || card.image_url || '');
  if (url.protocol !== 'https:' || url.port || url.username || url.password || !config.hosts.includes(url.hostname)) return new Response('Unsupported image source', { status: 502 });
  const upstream = await fetch(url, { headers: { 'User-Agent': 'PlayTCG-Scanner/1.0 (https://playtcg.online)', Accept: 'image/webp,image/jpeg,image/png' }, redirect: 'error', next: { revalidate: 2592000 }, signal: AbortSignal.timeout(10000) });
  if (!upstream.ok) return new Response('Image unavailable', { status: 502 });
  const type = upstream.headers.get('content-type')?.split(';')[0].trim() || '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return new Response('Invalid image', { status: 502 });
  if (Number(upstream.headers.get('content-length')) > 5 * 1024 * 1024) return new Response('Image too large', { status: 502 });
  const bytes = await upstream.arrayBuffer();
  if (bytes.byteLength > 5 * 1024 * 1024) return new Response('Image too large', { status: 502 });
  return new Response(bytes, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400', 'X-Content-Type-Options': 'nosniff' } });
 } catch { return new Response('Card image temporarily unavailable', { status: 502 }); }
}
