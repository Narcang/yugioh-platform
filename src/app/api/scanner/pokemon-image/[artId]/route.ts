import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(_request: NextRequest, context: { params: Promise<{ artId: string }> }) {
 const { artId } = await context.params;
 if (!/^[A-Za-z0-9][A-Za-z0-9.?!_-]{0,99}$/.test(artId)) return new Response('Invalid card identifier', { status: 400 });
 try {
  const { data, error } = await supabaseServer.from('pokemon_cards').select('image_large,image_url').eq('id',artId).maybeSingle();
  if(error)return new Response('Catalogue unavailable',{status:502});
  if(!data)return new Response('Card not found',{status:404});
  const url=new URL(data.image_large||data.image_url);
  if(url.protocol!=='https:'||url.port||url.username||url.password||!['images.pokemontcg.io','images.scrydex.com'].includes(url.hostname))return new Response('Unsupported image source',{status:502});
  const upstream=await fetch(url,{next:{revalidate:2592000},signal:AbortSignal.timeout(10000)});
  if(!upstream.ok)return new Response('Image unavailable',{status:502});
  const type=upstream.headers.get('content-type')??'';
  if(!['image/jpeg','image/png','image/webp'].includes(type.split(';')[0].trim()))return new Response('Invalid image',{status:502});
  const bytes=await upstream.arrayBuffer();if(bytes.byteLength>4*1024*1024)return new Response('Image too large',{status:502});
  return new Response(bytes,{headers:{'Content-Type':type,'Cache-Control':'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Card image temporarily unavailable',{status:502});}
}
