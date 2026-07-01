import { NextResponse } from 'next/server';

/**
 * Card scanner (pHash image identification) is temporarily disabled.
 * The Python/OpenCV backend that powered this feature has been decommissioned.
 * It will be re-implemented as a Supabase Edge Function in a future update.
 */
export async function POST() {
  return NextResponse.json(
    { match: false, disabled: true, message: 'Card scanner temporarily unavailable' },
    { status: 503 }
  );
}
