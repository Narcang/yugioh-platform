import { NextRequest } from 'next/server';

/** Same-origin, cached reference image; camera frames never reach this route. */
export async function GET(_request: NextRequest, context: { params: Promise<{ artId: string }> }) {
 const { artId } = await context.params;
 if (!/^\d{1,10}$/.test(artId)) return new Response('Invalid card identifier', { status: 400 });
 try {
  const upstream = await fetch(`https://images.ygoprodeck.com/images/cards/${artId}.jpg`, {
   next: { revalidate: 2592000 }, signal: AbortSignal.timeout(8000),
  });
  if (!upstream.ok) return new Response('Card image unavailable', { status: upstream.status === 404 ? 404 : 502 });
  const contentType = upstream.headers.get('content-type') ?? '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType.split(';')[0].trim())) return new Response('Invalid image response', { status: 502 });
  const bytes = await upstream.arrayBuffer();
  if (bytes.byteLength > 3 * 1024 * 1024) return new Response('Image too large', { status: 502 });
  return new Response(bytes, { headers: {
   'Content-Type': contentType,
   'Cache-Control': 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400',
   'X-Content-Type-Options': 'nosniff',
  } });
 } catch { return new Response('Card image temporarily unavailable', { status: 502 }); }
}
