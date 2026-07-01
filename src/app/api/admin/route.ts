import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Privileged client — bypasses RLS for admin mutations
const adminDb = createClient(SUPABASE_URL, SERVICE_KEY);

// ----------------------------------------------------------------
// Verify that the caller is a logged-in admin
// ----------------------------------------------------------------
async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  // Validate JWT with the anon client
  const userClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: { user }, error } = await userClient.auth.getUser(token);
  if (error || !user) return null;

  // Check is_admin flag in profiles
  const { data: profile } = await adminDb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  return profile?.is_admin === true ? user.id : null;
}

// ----------------------------------------------------------------
// GET  /api/admin?action=rooms|users
// ----------------------------------------------------------------
export async function GET(req: NextRequest) {
  const adminId = await verifyAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = new URL(req.url).searchParams.get('action');

  if (action === 'rooms') {
    const { data, error } = await adminDb
      .from('rooms')
      .select('id, host_name, host_id, format, language, current_players, max_players, is_public, created_at, settings')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rooms: data });
  }

  if (action === 'users') {
    const { data, error } = await adminDb
      .from('profiles')
      .select('id, username, full_name, avatar_url, is_admin, is_banned, updated_at')
      .order('updated_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ users: data });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// ----------------------------------------------------------------
// POST /api/admin
// Body: { action: 'close_room' | 'ban_user' | 'unban_user' | 'make_admin' | 'remove_admin', targetId: string }
// ----------------------------------------------------------------
export async function POST(req: NextRequest) {
  const adminId = await verifyAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as { action: string; targetId: string };
  const { action, targetId } = body;

  if (!action || !targetId) {
    return NextResponse.json({ error: 'Missing action or targetId' }, { status: 400 });
  }

  switch (action) {
    case 'close_room': {
      const { error } = await adminDb.from('rooms').delete().eq('id', targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case 'ban_user': {
      if (targetId === adminId) {
        return NextResponse.json({ error: 'Non puoi bannare te stesso' }, { status: 400 });
      }
      const { error } = await adminDb
        .from('profiles')
        .update({ is_banned: true })
        .eq('id', targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case 'unban_user': {
      const { error } = await adminDb
        .from('profiles')
        .update({ is_banned: false })
        .eq('id', targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case 'make_admin': {
      const { error } = await adminDb
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case 'remove_admin': {
      if (targetId === adminId) {
        return NextResponse.json({ error: 'Non puoi rimuovere i tuoi stessi privilegi' }, { status: 400 });
      }
      const { error } = await adminDb
        .from('profiles')
        .update({ is_admin: false })
        .eq('id', targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
